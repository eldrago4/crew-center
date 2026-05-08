import { NextResponse } from 'next/server';

export async function POST(req) {
  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 });
  }

  const VALID_GOALS = new Set(['domain', 'database', 'hosting', 'bot']);

  try {
    const { amount, goalId, discordId, ifcName } = await req.json();

    if (!amount || Number(amount) < 1 || !goalId || !VALID_GOALS.has(goalId)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount:   Math.round(Number(amount) * 100), // paise
        currency: 'INR',
        receipt:  `cc_${goalId}_${Date.now()}`.slice(0, 40),
        notes: { goalId, discordId: discordId || '', ifcName: ifcName || '' },
      }),
    });

    if (!rzpRes.ok) {
      const errBody = await rzpRes.json().catch(() => ({}));
      console.error('[chanda/order] Razorpay error:', errBody);
      return NextResponse.json(
        { error: errBody?.error?.description || 'Order creation failed' },
        { status: 502 }
      );
    }

    const order = await rzpRes.json();

    return NextResponse.json({
      orderId:  order.id,
      amount:   order.amount,   // paise — Razorpay canonical value
      currency: order.currency,
      key:      keyId,
    });
  } catch (err) {
    console.error('[chanda/order] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
