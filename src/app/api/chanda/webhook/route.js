import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { processConfirmedPayment } from '../_processPayment';

// Razorpay webhook signature uses the raw request body — must NOT parse as JSON first
export async function POST(req) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-razorpay-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  // Verify webhook signature with webhook secret (different from API key secret)
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[chanda/webhook] RAZORPAY_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  if (expected !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Only handle payment.captured — the definitive "money received" event
  if (event.event === 'payment.captured') {
    const payment = event.payload?.payment?.entity;
    if (!payment) return NextResponse.json({ ok: true });

    const goalId    = payment.notes?.goalId;
    const ifcName   = payment.notes?.ifcName || 'Anonymous Pilot';
    const discordId = payment.notes?.discordId;

    if (goalId) {
      await processConfirmedPayment({
        paymentId:   payment.id,
        goalId,
        amountPaise: payment.amount,
        ifcName,
        discordId,
      }).catch(err => console.error('[chanda/webhook] processPayment error:', err));
    }
  }

  return NextResponse.json({ ok: true });
}

export const dynamic = 'force-dynamic';
