import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { processConfirmedPayment } from '../_processPayment';

const VALID_GOAL_IDS = new Set(['domain', 'database', 'hosting', 'bot']);

export async function POST(req) {
  try {
    const {
      razorpay_order_id, razorpay_payment_id, razorpay_signature,
      goalId, amount, discordId, ifcName,
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 });
    }
    if (!VALID_GOAL_IDS.has(goalId)) {
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
