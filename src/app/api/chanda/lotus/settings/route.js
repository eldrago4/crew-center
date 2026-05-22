import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { auth } from '@/auth';

const PRICE_REDIS_KEY   = 'chanda:lotus:price';
const ROLE_REDIS_KEY    = 'chanda:lotus:discord_role_id';
const PLAN_REDIS_KEY    = 'chanda:lotus:plan_id';
const DEFAULT_PRICE     = 19000;
const DEFAULT_ROLE_ID   = '1507426495163793680';

export async function GET() {
  try {
    const redis = Redis.fromEnv();
    const [price, roleId, planId] = await Promise.all([
      redis.get(PRICE_REDIS_KEY),
      redis.get(ROLE_REDIS_KEY),
      redis.get(PLAN_REDIS_KEY),
    ]);
    return NextResponse.json({
      price:  price  ? parseInt(price)  : DEFAULT_PRICE,
      roleId: roleId ? String(roleId)   : DEFAULT_ROLE_ID,
      planId: planId ? String(planId)   : null,
    });
  } catch (err) {
    console.error('[lotus/settings GET]', err);
    return NextResponse.json({ price: DEFAULT_PRICE, roleId: DEFAULT_ROLE_ID, planId: null });
  }
}

export async function PUT(req) {
  const session = await auth();
  if (!session?.user?.permissions?.includes('staff')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { price, roleId } = await req.json();
    const redis = Redis.fromEnv();

    await Promise.all([
      price  ? redis.set(PRICE_REDIS_KEY, String(price)) : Promise.resolve(),
      roleId ? redis.set(ROLE_REDIS_KEY, roleId)         : redis.del(ROLE_REDIS_KEY),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[lotus/settings PUT]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// DELETE clears the legacy gateway plan ID kept from the old checkout flow.
export async function DELETE(req) {
  const session = await auth();
  if (!session?.user?.permissions?.includes('staff')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const redis = Redis.fromEnv();
    await redis.del(PLAN_REDIS_KEY);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[lotus/settings DELETE]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
