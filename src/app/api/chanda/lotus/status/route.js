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
    return NextResponse.json(status);
  } catch (err) {
    console.error('[lotus/status]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
