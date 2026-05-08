import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { auth } from '@/auth';

const PRICE_REDIS_KEY   = 'chanda:lotus:price';
const ROLE_REDIS_KEY    = 'chanda:lotus:discord_role_id';
const PLAN_REDIS_KEY    = 'chanda:lotus:plan_id';

export async function GET() {
  try {
    const redis = Redis.fromEnv();
    const [price, roleId, planId] = await Promise.all([
      redis.get(PRICE_REDIS_KEY),
      redis.get(ROLE_REDIS_KEY),
      redis.get(PLAN_REDIS_KEY),
    ]);
    return NextResponse.json({
      price:  price  ? parseInt(price)  : 19900,
      roleId: roleId ? String(roleId)   : '',
      planId: planId ? String(planId)   : null,
    });
  } catch (err) {
    console.error('[lotus/settings GET]', err);
    return NextResponse.json({ price: 19900, roleId: '', planId: null });
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

// DELETE clears the cached plan ID so a new one is created with the updated price
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
