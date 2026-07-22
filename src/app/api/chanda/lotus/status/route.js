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
    // Per-user subscription status, changes rarely. Private browser cache trims
    // repeat worker hits from the chanda page within a minute.
    return NextResponse.json(status, {
      headers: { 'Cache-Control': 'private, max-age=60' },
    });
  } catch (err) {
    console.error('[lotus/status]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

