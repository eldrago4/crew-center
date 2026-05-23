import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { DEFAULT_GOALS, GOALS_REDIS_KEY } from '../_defaultGoals';
import { LOTUS_MEMBER_LIMIT, reconcileLotusMembers } from '../_lotus';

export async function GET() {
  try {
    const redis = Redis.fromEnv();

    // Load goal definitions dynamically
    const raw = await redis.get(GOALS_REDIS_KEY);
    const goalDefs = raw
      ? (typeof raw === 'string' ? JSON.parse(raw) : raw)
      : DEFAULT_GOALS;
    const goalIds = goalDefs.map(g => g.id);

    const lotus = await reconcileLotusMembers(redis);

      const [uniqueCount, legacyTotal, rawContribs, ...raised] = await Promise.all([
        // new unique contributors set
        redis.scard('chanda:contributors:set'),
        // legacy total (kept for backwards compatibility)
        redis.get('chanda:total:contributors'),
        redis.lrange('chanda:contributions', 0, 19),
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
        subscribers: lotus.members.length,
        members: lotus.members,
        limit: LOTUS_MEMBER_LIMIT,
        slotsRemaining: Math.max(0, LOTUS_MEMBER_LIMIT - lotus.members.length),
      },
    });
  } catch (err) {
    console.error('Chanda stats error:', err);
    return NextResponse.json({ contributors: 0, goals: {}, goalDefs: DEFAULT_GOALS, contributions: [], lotus: { subscribers: 0, members: [] } });
  }
}

export const dynamic = 'force-dynamic';
