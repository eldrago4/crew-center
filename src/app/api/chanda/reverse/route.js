import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { auth } from '@/auth';
import { revokeRole, SUPPORTER_ROLE } from '../_processPayment';

export async function POST(req) {
    const session = await auth();
    if (!session?.user?.permissions?.includes('staff')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { paymentId } = await req.json();
        if (!paymentId) return NextResponse.json({ error: 'Missing paymentId' }, { status: 400 });

        const redis = Redis.fromEnv();
        const list = await redis.lrange('chanda:contributions', 0, -1);
        if (!list || list.length === 0) return NextResponse.json({ error: 'No contributions found' }, { status: 404 });

        let matchedRaw = null;
        let parsed = null;
        for (const item of list) {
            try {
                const obj = typeof item === 'string' ? JSON.parse(item) : item;
                if (obj && obj.paymentId === paymentId) {
                    matchedRaw = item;
                    parsed = obj;
                    break;
                }
            } catch (e) {
                continue;
            }
        }

        if (!matchedRaw) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

        // remove the list entry
        await redis.lrem('chanda:contributions', 0, matchedRaw);

        // decrement total contributors (best-effort)
        try { await redis.decr('chanda:total:contributors'); } catch (e) { /* ignore */ }

        // if goal-specific, decrement the raised amount
        try {
            if (parsed.goalId && parsed.goalId !== 'all') {
                await redis.incrbyfloat(`chanda:goal:${parsed.goalId}:raised`, -(parsed.amount || 0));
            }
        } catch (e) {
            // ignore
        }

        // revoke role if present
        try {
            if (parsed.discordId) await revokeRole(parsed.discordId, SUPPORTER_ROLE);
        } catch (e) {
            // ignore
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[chanda/reverse]', err);
        return NextResponse.json({ error: 'Reverse failed' }, { status: 500 });
    }
}

export const dynamic = 'force-dynamic';
