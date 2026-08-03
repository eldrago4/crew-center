import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import db from '@/db/client';
import { users } from '@/db/schema';
import { requireUser } from '@/lib/apiAuth';

// Server-side proxy to the Cloudflare flight-recommender worker
// (api.indianvirtual.com). The worker's Bearer token stays here on the server
// and is never exposed to the browser; the pilot is identified by their own
// session callsign (= users.id), so a signed-in pilot can only ever ask for
// their own recommendations.

const RECS_API_URL = 'https://api.indianvirtual.com';
const VALID_MODES = [ 'trend', 'discover', 'rank' ];
const CALLSIGN_PATTERN = /^INVA\d{3}$/i;

function canonicalUserId(session) {
  const raw = session?.user?.callsign ?? '';
  return String(raw).trim().toUpperCase();
}

async function resolveCanonicallyBoundCallsign(session) {
  const direct = canonicalUserId(session);
  if (CALLSIGN_PATTERN.test(direct)) return direct;

  const ifcName = String(session?.user?.ifcName || '').trim();
  if (ifcName) {
    const [ match ] = await db
      .select({ id: users.id })
      .from(users)
      .where(sql`${users.ifcName} ILIKE ${ifcName}`)
      .limit(1);

    const resolved = String(match?.id || '').trim().toUpperCase();
    if (CALLSIGN_PATTERN.test(resolved)) return resolved;
  }

  const discordId = String(session?.user?.discordId || '').trim();
  if (discordId) {
    const [ match ] = await db
      .select({ id: users.id })
      .from(users)
      .where(sql`${users.discordId} = ${discordId}`)
      .limit(1);

    const resolved = String(match?.id || '').trim().toUpperCase();
    if (CALLSIGN_PATTERN.test(resolved)) return resolved;
  }

  return null;
}

export async function GET(request) {
  const { session, error } = await requireUser();
  if (error) return error;

  const apiKey = process.env.RECS_API_KEY;
  if (!apiKey) {
    console.error('[recommendations] RECS_API_KEY is not configured');
    return NextResponse.json({ error: 'Recommendations are not available right now.' }, { status: 503 });
  }

  const callsign = await resolveCanonicallyBoundCallsign(session);
  if (!callsign) {
    console.error('[recommendations] invalid callsign for recommendations lookup:', { sessionUser: session?.user });
    return NextResponse.json({ error: 'Invalid pilot identity for recommendations.' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const modeParam = (searchParams.get('mode') || 'trend').toLowerCase();
  const mode = VALID_MODES.includes(modeParam) ? modeParam : 'trend';
  const fresh = searchParams.get('fresh') === '1' ? '&fresh=1' : '';

  const target = `${RECS_API_URL}/recommendations/${encodeURIComponent(callsign)}?mode=${mode}${fresh}`;

  try {
    const upstream = await fetch(target, {
      headers: { Authorization: `Bearer ${apiKey}` },
      // The worker's own 24h KV cache is the source of truth; don't let the
      // platform layer add another cache on top of a per-pilot response.
      cache: 'no-store',
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      const res = NextResponse.json(
        { error: data.error || 'Could not fetch recommendations.' },
        { status: upstream.status },
      );
      const retryAfter = upstream.headers.get('Retry-After');
      if (retryAfter) res.headers.set('Retry-After', retryAfter);
      return res;
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[recommendations] upstream fetch failed:', err);
    return NextResponse.json({ error: 'Recommendations service is unreachable.' }, { status: 502 });
  }
}
