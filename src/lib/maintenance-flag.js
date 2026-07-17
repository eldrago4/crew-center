import { Redis } from '@upstash/redis'

// Shared by src/db/client.js (raises it) and src/proxy.js (reads it). Kept in its
// own module with no db/drizzle imports so the proxy bundle stays small — pulling
// db/client in here would drag drizzle into the middleware bundle.
export const QUOTA_FLAG_KEY = 'site:neon-quota-exceeded'

// Long enough to ride out a real quota outage without hammering a dead database,
// short enough that the crew app comes back on its own once quota resets — no
// redeploy, no manual unflagging.
const QUOTA_FLAG_TTL_SECONDS = 300

// The proxy runs on every /crew/* request. Re-reading Redis each time would add a
// network hop to the hot path, so a warm instance reads at most once per window.
// The cost of being briefly stale is a handful of requests seeing the old state,
// which for a multi-minute outage is irrelevant.
const READ_CACHE_MS = 15_000

let redisClient
function getRedis() {
    if (redisClient === undefined) {
        try {
            redisClient = Redis.fromEnv()
        } catch {
            // No Upstash env (local dev, previews). Degrade to "not in
            // maintenance" rather than taking the app down.
            redisClient = null
        }
    }
    return redisClient
}

/**
 * Raise the flag. Fire-and-forget and never throws: the caller is already
 * handling a failed query, and a Redis hiccup must not mask that original error.
 */
export function raiseQuotaFlag() {
    try {
        getRedis()?.set(QUOTA_FLAG_KEY, '1', { ex: QUOTA_FLAG_TTL_SECONDS })?.catch(() => {})
    } catch {
        // ignore
    }
}

let cache = { value: false, at: 0 }

/**
 * Read the flag, cached per warm instance. Fails OPEN — if Redis is unreachable
 * we report "no maintenance" and let the app try to serve, because a Redis outage
 * must not be able to black out a perfectly healthy site.
 */
export async function isQuotaFlagRaised() {
    const now = Date.now()
    if (now - cache.at < READ_CACHE_MS) return cache.value

    const redis = getRedis()
    if (!redis) return false

    try {
        const raised = (await redis.get(QUOTA_FLAG_KEY)) != null
        cache = { value: raised, at: now }
        return raised
    } catch {
        return false
    }
}
