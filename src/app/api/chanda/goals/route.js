import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { auth } from '@/auth';
import { DEFAULT_GOALS, GOALS_REDIS_KEY } from '../_defaultGoals';

export async function GET() {
  try {
    const redis = Redis.fromEnv();
    const raw   = await redis.get(GOALS_REDIS_KEY);
    const goals = raw
      ? (typeof raw === 'string' ? JSON.parse(raw) : raw)
      : DEFAULT_GOALS;
    return NextResponse.json(goals);
  } catch (err) {
    console.error('[chanda/goals GET]', err);
    return NextResponse.json(DEFAULT_GOALS);
  }
}

export async function PUT(req) {
  const session = await auth();
  if (!session?.user?.permissions?.includes('staff')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const goals = await req.json();

    if (!Array.isArray(goals) || goals.some(g => !g.id || !g.label || !g.target)) {
      return NextResponse.json({ error: 'Invalid goals payload' }, { status: 400 });
    }

    const redis = Redis.fromEnv();
    await redis.set(GOALS_REDIS_KEY, JSON.stringify(goals));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[chanda/goals PUT]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
