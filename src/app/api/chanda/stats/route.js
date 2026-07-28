import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { DEFAULT_GOALS, GOALS_REDIS_KEY } from '../_defaultGoals';
import { LOTUS_MEMBER_LIMIT, getLotusMembers } from '../_lotus';

export async function GET() {
  try {
    const redis = Redis.fromEnv();

    // Load goal definitions dynamically
    const raw = await redis.get(GOALS_REDIS_KEY);
    const goalDefs = raw
      ? (typeof raw === 'string' ? JSON.parse(raw) : raw)
      : DEFAULT_GOALS;
    const goalIds = goalDefs.map(g => g.id);

    // Read-only: this route has no auth check and is fetched by the crew chanda page,
    // so reconciling here let any unauthenticated request drive Discord role DELETEs
    // and Redis writes. The daily cron owns reconciliation.
    const lotusMembers = await getLotusMembers(redis);

    const [ uniqueCount, legacyTotal, rawContribs, ...raised ] = await Promise.all([
      // new unique contributors set
      redis.scard('chanda:contributors:set'),
      // legacy total (kept for backwards compatibility)
      redis.get('chanda:total:contributors'),
      redis.lrange('chanda:contributions', 0, -1),
      ...goalIds.map(id => redis.get(`chanda:goal:${id}:raised`)),
    ]);

    const goals = {};
    goalIds.forEach((id, i) => {
      goals[ id ] = parseFloat(raised[ i ] || 0);
    });

    const contributions = (rawContribs || []).map(item => {
      try { return typeof item === 'string' ? JSON.parse(item) : item; }
      catch { return null; }
    }).filter(Boolean);

    // Prefer the unique contributors set; fall back to legacy counter if empty
    const contributorsCount = (uniqueCount && Number(uniqueCount) > 0)
      ? Number(uniqueCount)
      : parseInt(legacyTotal || 0);

    return NextResponse.json({
      contributors: contributorsCount,
      goals,
      goalDefs,
      contributions,
      lotus: {
        subscribers: lotusMembers.length,
        members: lotusMembers,
        limit: LOTUS_MEMBER_LIMIT,
        slotsRemaining: Math.max(0, LOTUS_MEMBER_LIMIT - lotusMembers.length),
      },
    }, {
      // Shared, non-per-user stats built from ~10 Redis reads. Cached hard at the
      // Cloudflare edge for a week so this heavy handler runs at most ~weekly
      // instead of once per chanda-page view. NOTE: a new contribution/goal change
      // won't surface on the public page until the week elapses (no edge purge is
      // wired) — accepted per the chosen retention policy. Browser holds 1h.
      headers: {
        'Cache-Control': 'public, max-age=3600',
        'CDN-Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    console.error('Chanda stats error:', err);
    // A transient failure must never be pinned at the edge.
    return NextResponse.json(
      { contributors: 0, goals: {}, goalDefs: DEFAULT_GOALS, contributions: [], lotus: { subscribers: 0, members: [] } },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

