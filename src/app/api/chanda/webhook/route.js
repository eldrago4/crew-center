import { NextResponse } from 'next/server';

export async function POST(req) {
  await req.text().catch(() => '');
  return NextResponse.json(
    { error: 'Gateway webhooks are disabled. Chanda now uses manual UPI confirmation.' },
    { status: 410 }
  );
}

export const dynamic = 'force-dynamic';
