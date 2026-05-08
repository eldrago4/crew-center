import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { Redis } from '@upstash/redis';
import { processConfirmedPayment } from '../_processPayment';
import { DEFAULT_GOALS, GOALS_REDIS_KEY } from '../_defaultGoals';

export async function POST(req) {
  try {
    const {
      razorpay_order_id, razorpay_payment_id, razorpay_signature,
      goalId, amount, discordId, ifcName,
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 });
    }

    // Validate goalId against live goals config
    const redis    = Redis.fromEnv();
    const raw      = await redis.get(GOALS_REDIS_KEY);
    const goals    = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : DEFAULT_GOALS;
    const validIds = new Set([...goals.map(g => g.id), 'all']);

    if (!goalId || !validIds.has(goalId)) {
      return NextResponse.json({ error: 'Invalid goal' }, { status: 400 });
    }

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    await processConfirmedPayment({
      paymentId:   razorpay_payment_id,
      goalId,
      amountPaise: amount,
      ifcName,
      discordId,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[chanda/verify]', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
