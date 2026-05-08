import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { DEFAULT_GOALS, GOALS_REDIS_KEY } from '../_defaultGoals';

export async function GET() {
  try {
    const redis = Redis.fromEnv();

    // Load goal definitions dynamically
    const raw       = await redis.get(GOALS_REDIS_KEY);
    const goalDefs  = raw
      ? (typeof raw === 'string' ? JSON.parse(raw) : raw)
      : DEFAULT_GOALS;
    const goalIds   = goalDefs.map(g => g.id);

    const [contributors, rawContribs, lotusSubscribers, rawLotusMembers, ...raised] = await Promise.all([
      redis.get('chanda:total:contributors'),
      redis.lrange('chanda:contributions', 0, 19),
      redis.get('chanda:lotus:subscribers'),
      redis.lrange('chanda:lotus:members', 0, 49),
      ...goalIds.map(id => redis.get(`chanda:goal:${id}:raised`)),
    ]);

    const goals = {};
    goalIds.forEach((id, i) => {
      goals[id] = parseFloat(raised[i] || 0);
    });

    const contributions = (rawContribs || []).map(item => {
      try { return typeof item === 'string' ? JSON.parse(item) : item; }
      catch { return null; }
    }).filter(Boolean);

    const lotusMembers = (rawLotusMembers || []).map(item => {
      try { return typeof item === 'string' ? JSON.parse(item) : item; }
      catch { return null; }
    }).filter(Boolean);

    return NextResponse.json({
      contributors:  parseInt(contributors || 0),
      goals,
      goalDefs,
      contributions,
      lotus: { subscribers: parseInt(lotusSubscribers || 0), members: lotusMembers },
    });
  } catch (err) {
    console.error('Chanda stats error:', err);
    return NextResponse.json({ contributors: 0, goals: {}, goalDefs: DEFAULT_GOALS, contributions: [], lotus: { subscribers: 0, members: [] } });
  }
}

export const dynamic = 'force-dynamic';
