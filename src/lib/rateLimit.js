import { Redis } from '@upstash/redis';

// Lightweight fixed-window rate limiter built on the Upstash Redis REST client
// (the same @upstash/redis the rest of the app already uses via Redis.fromEnv()).
// A single INCR + first-hit EXPIRE keeps it to one round-trip on the hot path.
//
// It FAILS OPEN: if Redis is unconfigured or unreachable we allow the request,
// so a Redis blip degrades to "no rate limiting" rather than a hard outage of
// whatever feature it guards.

let _redis;
function getRedis() {
  if (_redis !== undefined) return _redis;
  try {
    _redis = Redis.fromEnv();
  } catch {
    _redis = null;
  }
  return _redis;
}

/**
 * @param {string} key            Unique bucket key (e.g. `aig:chat:${callsign}`).
 * @param {object} [opts]
 * @param {number} [opts.limit]         Max requests per window (default 12).
 * @param {number} [opts.windowSeconds] Window length in seconds (default 60).
 * @returns {Promise<{allowed:boolean, remaining:number, retryAfter:number}>}
 */
export async function rateLimit(key, { limit = 12, windowSeconds = 60 } = {}) {
  const redis = getRedis();
  if (!redis) return { allowed: true, remaining: limit, retryAfter: 0 };

  const redisKey = `rl:${key}`;
  try {
    const count = await redis.incr(redisKey);
    // Only the first hit in a window sets the TTL, so the window doesn't slide
    // forward on every request.
    if (count === 1) {
      await redis.expire(redisKey, windowSeconds);
    }
    if (count > limit) {
      let ttl = await redis.ttl(redisKey);
      if (ttl < 0) ttl = windowSeconds; // no TTL yet (race) — assume full window
      return { allowed: false, remaining: 0, retryAfter: ttl };
    }
    return { allowed: true, remaining: Math.max(0, limit - count), retryAfter: 0 };
  } catch (err) {
    console.error('[rateLimit] Redis error, failing open:', err);
    return { allowed: true, remaining: limit, retryAfter: 0 };
  }
}
