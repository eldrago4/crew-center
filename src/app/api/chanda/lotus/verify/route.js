import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { processConfirmedPayment } from '../../_processPayment';
import { activateLotusMember, LOTUS_PRICE_RUPEES } from '../../_lotus';

export async function POST(req) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { ifcName } = await req.json();
    const memberDiscordId = session.user.discordId || session.user.id;
    const memberName = ifcName || session.user.ifcName || session.user.callsign;
    const paymentId = `lotus_upi_${memberDiscordId}_${Date.now()}`;

    const result = await activateLotusMember({
      discordId: memberDiscordId,
      ifcName: memberName,
      paymentId,
    });

    await processConfirmedPayment({
      paymentId: `${paymentId}_support`,
      goalId: 'all',
      amountPaise: LOTUS_PRICE_RUPEES * 100,
      ifcName: memberName,
      discordId: memberDiscordId,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('[lotus/verify]', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 400 });
  }
}

export const dynamic = 'force-dynamic';
