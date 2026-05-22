import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { auth } from '@/auth';
import { processConfirmedPayment } from '../_processPayment';
import { DEFAULT_GOALS, GOALS_REDIS_KEY } from '../_defaultGoals';

export async function POST(req) {
  try {
    const session = await auth();
    const {
      goalId, amount, ifcName,
    } = await req.json();
    const sessionDiscordId = session?.user?.discordId || session?.user?.id || null;

    if (!goalId || !amount || Number(amount) < 1) {
      return NextResponse.json({ error: 'Invalid payment confirmation' }, { status: 400 });
    }

    // Validate goalId against live goals config
    const redis    = Redis.fromEnv();
    const raw      = await redis.get(GOALS_REDIS_KEY);
    const goals    = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : DEFAULT_GOALS;
    const validIds = new Set([...goals.map(g => g.id), 'all']);

    if (!goalId || !validIds.has(goalId)) {
      return NextResponse.json({ error: 'Invalid goal' }, { status: 400 });
    }

    await processConfirmedPayment({
      paymentId:   `upi_${goalId}_${sessionDiscordId || 'anon'}_${Date.now()}`,
      goalId,
      amountPaise: Math.round(Number(amount) * 100),
      ifcName,
      discordId: sessionDiscordId,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[chanda/verify]', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
