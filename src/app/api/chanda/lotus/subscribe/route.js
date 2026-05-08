import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Redis } from '@upstash/redis';

const PLAN_REDIS_KEY  = 'chanda:lotus:plan_id';
const PRICE_REDIS_KEY = 'chanda:lotus:price';
const DEFAULT_PRICE   = 19900; // ₹199 in paise

async function getOrCreatePlan(redis, keyId, keySecret) {
  const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const headers   = { Authorization: `Basic ${basicAuth}`, 'Content-Type': 'application/json' };

  const cachedPlanId = await redis.get(PLAN_REDIS_KEY);
  if (cachedPlanId) return String(cachedPlanId);

  const rawPrice = await redis.get(PRICE_REDIS_KEY);
  const price    = rawPrice ? parseInt(rawPrice) : DEFAULT_PRICE;

  const res = await fetch('https://api.razorpay.com/v1/plans', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      period:   'monthly',
      interval: 1,
      item: {
        name:        'Lotus Privé',
        amount:      price,
        currency:    'INR',
        description: 'INVA Lotus Privé — Exclusive crew membership (monthly)',
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.description || 'Plan creation failed');
  }

  const plan = await res.json();
  await redis.set(PLAN_REDIS_KEY, plan.id);
  return plan.id;
}

export async function POST(req) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 });
  }

  try {
    const { discordId, ifcName } = await req.json();

    const redis     = Redis.fromEnv();
    const planId    = await getOrCreatePlan(redis, keyId, keySecret);
    const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const subRes = await fetch('https://api.razorpay.com/v1/subscriptions', {
      method:  'POST',
      headers: { Authorization: `Basic ${basicAuth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan_id:     planId,
        total_count: 240,   // 20 years of monthly cycles
        quantity:    1,
        notes: {
          discordId: discordId || '',
          ifcName:   ifcName   || '',
        },
      }),
    });

    if (!subRes.ok) {
      const err = await subRes.json().catch(() => ({}));
      console.error('[lotus/subscribe] Razorpay error:', err);
      return NextResponse.json(
        { error: err?.error?.description || 'Subscription creation failed' },
        { status: 502 }
      );
    }

    const sub = await subRes.json();
    return NextResponse.json({ subscriptionId: sub.id, key: keyId });
  } catch (err) {
    console.error('[lotus/subscribe]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
