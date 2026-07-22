import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getLotusStatus } from '../../_lotus';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const status = await getLotusStatus(session.user.discordId || session.user.id);
    // Per-user subscription status. Lotus billing is monthly, so hold it in the
    // private browser cache for ~a month. NOTE: no server-side bust — a status
    // change (new payment, membership drop) may lag in that browser until the
    // month elapses or a hard refresh; accepted per the chosen retention policy.
    return NextResponse.json(status, {
      headers: { 'Cache-Control': 'private, max-age=2592000' },
    });
  } catch (err) {
    console.error('[lotus/status]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

