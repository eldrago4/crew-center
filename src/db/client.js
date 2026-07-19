import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import { raiseQuotaFlag } from '@/lib/maintenance-flag';

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

// Build the neon client + drizzle db lazily, on first use. This used to run at module
// load, reading process.env.DATABASE_URL then — which is fine on Node/Vercel but breaks
// on the Cloudflare Workers runtime (OpenNext), where env is only populated per-request.
// When the module happened to evaluate at isolate init, neon() got an undefined string
// and threw "No database connection string was provided". Deferring construction to the
// first query moves the env read into a request context, where DATABASE_URL is present.
// On Vercel this is a pure no-op — it's just built on the first query instead of at import.
let realDb = null;
function getDb() {
    if (realDb) return realDb;

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

    // Observe-and-rethrow only. Every property other than the two the driver actually
    // calls through passes to the real client untouched, so this cannot change query
    // behaviour — it only gets a look at the errors on the way past.
    const sql = new Proxy(rawSql, {
        apply(target, thisArg, args) {
            return watched(target, thisArg)(...args);
        },
        get(target, prop, receiver) {
            const value = Reflect.get(target, prop, receiver);
            // drizzle's neon-http session reaches for client.transaction / client.query.
            if ((prop === 'transaction' || prop === 'query') && typeof value === 'function') {
                return watched(value, target);
            }
            return value;
        },
    });

    realDb = drizzle(sql, { schema });
    return realDb;
}

// Lazy facade: the first property access (db.select, db.insert, db.query, …) builds the
// real drizzle db — which happens inside a request handler, so DATABASE_URL is available.
const db = new Proxy({}, {
    get(_target, prop) {
        const real = getDb();
        const value = Reflect.get(real, prop, real);
        return typeof value === 'function' ? value.bind(real) : value;
    },
});

export default db;
