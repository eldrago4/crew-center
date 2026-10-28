import { Redis } from '@upstash/redis';

// Supabase is a hot standby for Neon. scripts/db-failover keeps it in sync and
// merges back whatever was written here during an outage; this module is the
// runtime half: it decides which database a query goes to.
//
// The switch is sticky. Once any instance fails over it sets DB_MODE_KEY in Redis
// and every instance stays on Supabase until the failback job has copied the
// Supabase-side writes into Neon and deleted the key. Going back on our own when
// Neon "looks fine" would split writes across two databases.
export const DB_MODE_KEY = 'db:mode';

const BACKUP_URL = process.env.SUPABASE_DATABASE_URL;

export const backupConfigured = Boolean(BACKUP_URL);

// How stale an instance's view of DB_MODE_KEY may be. The failback job waits well
// past this after deleting the key before its final merge pass.
const MODE_CACHE_MS = 20_000;

// Rejections that mean Neon refused or never ran the query, so replaying it on
// Supabase can't apply a write twice. Matched on message, not SQLSTATE: the quota
// rejection's class (53, insufficient_resources) also covers 53300
// too_many_connections, which is a spike to ride out, not a reason to fail over.
const UNAVAILABLE = [
    /project quota exceeded/i,
    /exceeded the (compute time|data transfer) quota/i,
    /endpoint (has been|is) disabled/i,
    /error connecting to database/i,
];

export function isNeonUnavailable(error) {
    if (!error) return false;
    const messages = [error.message, error.sourceError?.message, error.cause?.message];
    return messages.some((m) => m && UNAVAILABLE.some((re) => re.test(String(m))));
}

let redisClient;
function getRedis() {
    if (redisClient === undefined) {
        try {
            redisClient = Redis.fromEnv();
        } catch {
            redisClient = null;
        }
    }
    return redisClient;
}

let mode = { onBackup: false, at: 0 };
let modeRead = null;

/**
 * Whether queries should go straight to Supabase. Cached per instance. If Redis
 * can't be read we keep the last known answer rather than defaulting to Neon:
 * an instance that silently drifts back to Neon mid-outage would split writes.
 */
export async function isOnBackup() {
    if (!backupConfigured) return false;
    if (Date.now() - mode.at < MODE_CACHE_MS) return mode.onBackup;

    modeRead ??= (async () => {
        try {
            const redis = getRedis();
            if (!redis) return;
            const value = await redis.get(DB_MODE_KEY);
            mode = { onBackup: value != null, at: Date.now() };
        } catch {
            mode = { ...mode, at: Date.now() };
        } finally {
            modeRead = null;
        }
    })();
    await modeRead;
    return mode.onBackup;
}

/** Switch this instance to Supabase now and tell the others via Redis. */
export async function enterFailover(error) {
    const firstHere = !mode.onBackup;
    mode = { onBackup: true, at: Date.now() };
    if (firstHere) console.error('[db] Neon unavailable — failing over to Supabase:', error?.message);
    try {
        await getRedis()?.set(
            DB_MODE_KEY,
            { since: new Date().toISOString(), reason: String(error?.message ?? 'unknown').slice(0, 300) },
            { nx: true },
        );
    } catch {
        // This instance has already switched; the others will fail over on their
        // own first Neon error.
    }
}

// neon-http hands these back as the raw strings Postgres sent (drizzle sets this
// up in its neon-http driver), and drizzle's column mappers expect exactly that.
// Every other type uses pg-types' defaults, which is what Neon's driver uses too.
const RAW_TYPE_OIDS = new Set([1184, 1114, 1082, 1186, 1231, 1115, 1185, 1187, 1182]);

let poolPromise;
function getPool() {
    poolPromise ??= import('pg').then(({ default: pg }) => {
        const pool = new pg.Pool({ ...backupConnectionConfig(BACKUP_URL), max: 3 });
        // An idle client dropped by the pooler emits 'error' on the pool; unhandled,
        // that would crash the instance.
        pool.on('error', (err) => console.error('[db] Supabase pool error:', err.message));
        const rawTypes = {
            getTypeParser: (oid, format) =>
                RAW_TYPE_OIDS.has(oid) ? (value) => value : pg.types.getTypeParser(oid, format),
        };
        return { pool, rawTypes };
    });
    return poolPromise;
}

/**
 * Supabase's poolers present a certificate from Supabase's own CA. Verify against
 * it when SUPABASE_CA_CERT is set (Dashboard → Database → SSL Configuration);
 * otherwise encrypt without verifying. sslmode is stripped from the URL because
 * pg lets it override the ssl object; only an explicit sslmode=disable (local
 * testing) turns TLS off.
 */
export function backupConnectionConfig(url) {
    const parsed = new URL(url);
    const plaintext = parsed.searchParams.get('sslmode') === 'disable';
    parsed.searchParams.delete('sslmode');
    const ca = process.env.SUPABASE_CA_CERT?.replace(/\\n/g, '\n');
    return {
        connectionString: parsed.toString(),
        ssl: plaintext ? false : ca ? { ca } : { rejectUnauthorized: false },
        connectionTimeoutMillis: 10_000,
        idleTimeoutMillis: 30_000,
    };
}

/** Run a query on Supabase, answering in the shape @neondatabase/serverless would. */
export async function backupQuery(text, params = [], { arrayMode = false, fullResults = false } = {}) {
    const { pool, rawTypes } = await getPool();
    const result = await pool.query({
        text,
        values: params,
        rowMode: arrayMode ? 'array' : undefined,
        types: rawTypes,
    });
    if (!fullResults) return result.rows;
    result.rowAsArray = arrayMode;
    return result;
}
