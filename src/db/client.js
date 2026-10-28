import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import { raiseQuotaFlag } from '@/lib/maintenance-flag';
import { backupConfigured, backupQuery, enterFailover, isNeonUnavailable, isOnBackup } from './failover';

// Neon answers every query with this once the project's usage cap is hit.
// Matched on the message deliberately narrowly: the Postgres code class for this
// (53xxx, insufficient_resources) also covers transient trouble like 53300
// too_many_connections, and a connection spike must never black out the crew app.
const QUOTA_MESSAGE = /project quota exceeded/i;

export function isNeonQuotaError(error) {
    if (!error) return false;
    return (
        QUOTA_MESSAGE.test(String(error.message ?? '')) ||
        QUOTA_MESSAGE.test(String(error.sourceError?.message ?? ''))
    );
}

// Detection has to sit here, underneath every caller. auth.js wraps its own
// queries in `try { ... } catch (e) { /* handle gracefully below */ }`, so a quota
// failure never reaches a page or an error boundary — it just looks like the user
// is logged out. Flagging at the driver is the only spot below those catches.
function noteQuotaFailure(error) {
    if (!isNeonQuotaError(error)) return error;
    console.error('[db] Neon project quota exceeded — flagging maintenance:', error?.message);
    raiseQuotaFlag();
    return error;
}

function watched(fn, boundTo) {
    return function (...args) {
        let result;
        try {
            result = fn.apply(boundTo, args);
        } catch (error) {
            throw noteQuotaFailure(error);
        }
        // The driver is async, but guard the sync shape too rather than assume.
        if (result && typeof result.then === 'function') {
            return result.then(undefined, (error) => {
                throw noteQuotaFailure(error);
            });
        }
        return result;
    };
}

const rawSql = neon(process.env.DATABASE_URL, {
    connectTimeoutMillis: 10000, // 10s connection timeout to handle cold starts
    idleTimeoutMillis: 60000, // 1min idle timeout to align with scale to zero
    max: 10, // Connection pool max
    min: 0, // Scale to zero
    acquireTimeoutMillis: 60000, // 1min acquire timeout
    createTimeoutMillis: 30000, // 30s create timeout
    destroyTimeoutMillis: 5000, // 5s destroy timeout
    reapIntervalMillis: 1000, // Reap interval
    createRetryIntervalMillis: 200, // Retry interval
});

// drizzle's neon-http session only ever calls client.query (and client.transaction
// for db.batch), so routing those two is enough to move every query in the app.
async function query(text, params, options) {
    if (await isOnBackup()) return backupQuery(text, params, options);
    try {
        return await rawSql.query(text, params, options);
    } catch (error) {
        // Replayed on Supabase in the same request, so the request that discovers
        // the outage still succeeds — auth.js would otherwise swallow the failure
        // and show the user as logged out.
        if (backupConfigured && isNeonUnavailable(error)) {
            await enterFailover(error);
            return backupQuery(text, params, options);
        }
        throw noteQuotaFailure(error);
    }
}

// db.batch isn't used anywhere; if it ever is, it stays Neon-only.
const client = { query, transaction: watched(rawSql.transaction, rawSql) };

const db = drizzle({ client, schema });

export default db;
