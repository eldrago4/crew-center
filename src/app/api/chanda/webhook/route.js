import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { Redis } from '@upstash/redis';
import { processConfirmedPayment, grantRole } from '../_processPayment';

const GUILD_ID       = '1246895842581938276';
const SUPPORTER_ROLE = '1502237694271557632';

async function grantLotusRoles(discordId, redis) {
  await grantRole(discordId, SUPPORTER_ROLE);
  const lotusRoleId = await redis.get('chanda:lotus:discord_role_id');
  if (lotusRoleId) await grantRole(discordId, String(lotusRoleId));
}

async function fetchDiscordAvatarUrl(discordId) {
  try {
    const res = await fetch(`https://discord.com/api/v10/users/${discordId}`, {
      headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.avatar) return null;
    return `https://cdn.discordapp.com/avatars/${discordId}/${data.avatar}.webp?size=128`;
  } catch {
    return null;
  }
}

// Razorpay webhook signature uses the raw request body — must NOT parse as JSON first
export async function POST(req) {
  const rawBody   = await req.text();
  const signature = req.headers.get('x-razorpay-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[chanda/webhook] RAZORPAY_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  if (expected !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const redis = Redis.fromEnv();

  // ── One-time payment captured ───────────────────────────────────────────────
  if (event.event === 'payment.captured') {
    const payment = event.payload?.payment?.entity;
    if (payment) {
      const isSubscriptionPayment = !!payment.subscription_id;

      if (isSubscriptionPayment) {
        // Credit subscription payment as general support (all goals)
        const discordId = payment.notes?.discordId || null;
        const ifcName   = payment.notes?.ifcName   || 'Lotus Privé Subscriber';
        await processConfirmedPayment({
          paymentId:   payment.id,
          goalId:      'all',
          amountPaise: payment.amount,
          ifcName,
          discordId,
        }).catch(err => console.error('[webhook] subscription payment error:', err));
      } else {
        const goalId    = payment.notes?.goalId;
        const ifcName   = payment.notes?.ifcName   || 'Anonymous Pilot';
        const discordId = payment.notes?.discordId || null;
        if (goalId) {
          await processConfirmedPayment({
            paymentId:   payment.id,
            goalId,
            amountPaise: payment.amount,
            ifcName,
            discordId,
          }).catch(err => console.error('[webhook] payment error:', err));
        }
      }
    }
  }

  // ── Subscription activated (first payment succeeded) ───────────────────────
  if (event.event === 'subscription.activated') {
    const sub = event.payload?.subscription?.entity;
    if (sub) {
      const alreadyActive = await redis.get(`chanda:lotus:active:${sub.id}`);
      if (!alreadyActive) {
        await Promise.all([
          redis.incr('chanda:lotus:subscribers'),
          redis.set(`chanda:lotus:active:${sub.id}`, '1'),
        ]);
      }
      const discordId = sub.notes?.discordId;
      const ifcName   = sub.notes?.ifcName || 'Lotus Member';
      if (discordId) {
        await grantLotusRoles(discordId, redis);
        const avatarUrl = await fetchDiscordAvatarUrl(discordId);
        const member = JSON.stringify({ discordId, ifcName, avatarUrl, joinedAt: Date.now() });
        await redis.lpush('chanda:lotus:members', member);
        await redis.ltrim('chanda:lotus:members', 0, 49);
      }
    }
  }

  // ── Subscription renewal charged ────────────────────────────────────────────
  if (event.event === 'subscription.charged') {
    const sub = event.payload?.subscription?.entity;
    if (sub) {
      const discordId = sub.notes?.discordId;
      if (discordId) await grantLotusRoles(discordId, redis);
    }
  }

  // ── Subscription ended / halted ─────────────────────────────────────────────
  if (['subscription.cancelled', 'subscription.completed', 'subscription.halted'].includes(event.event)) {
    const sub = event.payload?.subscription?.entity;
    if (sub) {
      const wasActive = await redis.getdel(`chanda:lotus:active:${sub.id}`);
      if (wasActive) {
        await redis.decr('chanda:lotus:subscribers');
      }
    }
  }

  return NextResponse.json({ ok: true });
}

export const dynamic = 'force-dynamic';
