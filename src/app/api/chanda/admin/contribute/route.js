import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { processConfirmedPayment } from '../../_processPayment';

export async function POST(req) {
  const session = await auth();
  if (!session?.user?.permissions?.includes('staff')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { ifcName, goalId, amountRupees, discordId } = await req.json();

    if (!ifcName || !goalId || !amountRupees || Number(amountRupees) < 1) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate a unique manual payment ID
    const paymentId = `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await processConfirmedPayment({
      paymentId,
      goalId,
      amountPaise: Math.round(Number(amountRupees) * 100),
      ifcName,
      discordId: discordId || null,
    });

    return NextResponse.json({ ok: true, paymentId });
  } catch (err) {
    console.error('[chanda/admin/contribute]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
