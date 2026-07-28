import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import db from '@/db/client';
import { users } from '@/db/schema';
import { sql } from 'drizzle-orm';

let _redis = null
function getRedis() {
  if (!_redis) _redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})
  return _redis
}

const CACHE_KEY = 'leaderboard:top10';
const CACHE_TTL_SECONDS = 86400; // 24h — same as the cron

// Computes the top-10 leaderboard straight from the DB and re-caches it.
// Used as a fallback so a missing/expired cache self-heals instead of 404-ing,
// keeping the page working even if the cron hasn't run.
async function computeAndCacheLeaderboard() {
  const topPilotsRaw = await db
    .select({
      id: users.id,
      ifcName: users.ifcName,
      flightTime: users.flightTime,
      rank: users.rank,
      discordId: users.discordId,
    })
    .from(users)
    .where(sql`${users.flightTime} IS NOT NULL`)
    .orderBy(sql`${users.flightTime} DESC`)
    .limit(10)
    .execute();

  const topPilots = topPilotsRaw.map(pilot => ({
    ...pilot,
    discordId: pilot.discordId ? pilot.discordId.toString() : null,
  }));

  // Best-effort cache write; don't fail the request if Redis write hiccups
  try {
    await getRedis().set(CACHE_KEY, JSON.stringify(topPilots), { ex: CACHE_TTL_SECONDS });
  } catch (writeErr) {
    console.warn('Leaderboard cache write failed:', writeErr);
  }

  return topPilots;
}

export async function GET() {
  try {
    const cachedData = await getRedis().get(CACHE_KEY);

    // Browser 5m; Cloudflare edge 1d fresh + 1d serve-stale (CDN-Cache-Control is
    // passed through by Vercel). The data only changes via the daily midnight cron,
    // so a day-old edge copy matches the data's real cadence.
    const CACHE_HEADERS = {
      'Cache-Control': 'public, max-age=300',
      'CDN-Cache-Control': 'public, max-age=86400, stale-while-revalidate=86400',
    };

    // Cache hit — return it (parse if stored as a JSON string)
    if (cachedData) {
      try {
        const leaderboard = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
        return NextResponse.json({ data: leaderboard }, { headers: CACHE_HEADERS });
      } catch (parseError) {
        console.warn('Invalid cached leaderboard, recomputing:', parseError);
        // fall through to recompute below
      }
    }

    // Cache miss (or corrupt) — compute on demand and re-cache
    const leaderboard = await computeAndCacheLeaderboard();
    return NextResponse.json({ data: leaderboard }, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
