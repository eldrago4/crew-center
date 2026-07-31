import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/apiAuth';

// Server-side proxy to the Cloudflare flight-recommender worker
// (api.indianvirtual.com). The worker's Bearer token stays here on the server
// and is never exposed to the browser; the pilot is identified by their own
// session callsign (= users.id), so a signed-in pilot can only ever ask for
// their own recommendations.

const RECS_API_URL = process.env.RECS_API_URL || 'https://api.indianvirtual.com';
const VALID_MODES = ['trend', 'discover', 'rank'];

export async function GET(request) {
  const { session, error } = await requireUser();
  if (error) return error;

  const apiKey = process.env.RECS_API_KEY;
  if (!apiKey) {
    console.error('[recommendations] RECS_API_KEY is not configured');
    return NextResponse.json({ error: 'Recommendations are not available right now.' }, { status: 503 });
  }

  const callsign = session.user.callsign;
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
