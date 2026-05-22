import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(req) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  await req.text().catch(() => '');
  return NextResponse.json(
    { error: 'Gateway subscriptions are disabled. Use manual Lotus UPI confirmation.' },
    { status: 410 }
  );
}

export const dynamic = 'force-dynamic';
