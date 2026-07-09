import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// Shared server-side guards for API route handlers. Each returns either
// `{ session }` on success or `{ error }` (a ready-to-return NextResponse) on
// failure, so a handler can do:
//
//   const { session, error } = await requireStaff();
//   if (error) return error;
//
// These call auth() inside the existing handler, so they add no extra
// serverless invocations — only the permission check itself.

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.callsign) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null };
  }
  return { session, error: null };
}

export async function requireStaff() {
  const { session, error } = await requireUser();
  if (error) return { error, session: null };
  if (!session.user.permissions?.includes('staff')) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), session: null };
  }
  return { session, error: null };
}

export async function requireCeo() {
  const { session, error } = await requireUser();
  if (error) return { error, session: null };
  if (!session.user.permissions?.includes('ceo')) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), session: null };
  }
  return { session, error: null };
}

export function isStaff(session) {
  return Boolean(session?.user?.permissions?.includes('staff'));
}
