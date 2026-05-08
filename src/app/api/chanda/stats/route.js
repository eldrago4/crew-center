import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const GOAL_IDS = ['domain', 'database', 'hosting', 'bot'];

export async function GET() {
  try {
    const redis = Redis.fromEnv();
    const [contributors, rawContribs, ...raised] = await Promise.all([
      redis.get('chanda:total:contributors'),
      redis.lrange('chanda:contributions', 0, 19),
      ...GOAL_IDS.map(id => redis.get(`chanda:goal:${id}:raised`)),
    ]);

    const goals = {};
    GOAL_IDS.forEach((id, i) => {
      goals[id] = parseFloat(raised[i] || 0);
    });

    const contributions = (rawContribs || []).map(item => {
      try { return typeof item === 'string' ? JSON.parse(item) : item; }
      catch { return null; }
    }).filter(Boolean);

    return NextResponse.json({
      contributors: parseInt(contributors || 0),
      goals,
      contributions,
    });
  } catch (err) {
    console.error('Chanda stats error:', err);
    return NextResponse.json({ contributors: 0, goals: {}, contributions: [] });
  }
}

export const dynamic = 'force-dynamic';
