import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/apiAuth';
import { fetchAirportBackdrop } from '@/lib/pexels';

// Arrival-airport photos for the gallery view of /crew/routes.
//
// The client asks for the ICAOs on the page it is actually looking at, rather
// than the page resolving all ~363 arrival airports up front: only a pilot who
// switches to the gallery view spends anything here, 15 airports at a time.
//
// Each airport is cached individually inside fetchAirportBackdrop, so a warm
// ICAO costs no Pexels call at all and this handler collapses to a cache read.

const MAX_ICAOS = 24;

// Same rule as cleanIcao in RoutesClient: some routes store "EGLL VIA VABB" or
// "DIAP (VIA DGAA)" in the ICAO column, and the airport is the first standalone
// 4-letter token. The client already cleans before asking, but this handler is
// public to any crew session, so it doesn't rely on that.
function normalizeIcao(value) {
    const upper = (value || '').toUpperCase();
    const token = /\b[A-Z]{4}\b/.exec(upper);
    return token ? token[ 0 ] : upper.replace(/[^A-Z]/g, '').slice(0, 4);
}

export async function GET(request) {
    const { error } = await requireUser();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const requested = (searchParams.get('icaos') || '')
        .split(',')
        .map(normalizeIcao)
        .filter((icao) => icao.length === 4);

    const icaos = [ ...new Set(requested) ].slice(0, MAX_ICAOS);
    if (!icaos.length) {
        return NextResponse.json({ error: 'icaos is required' }, { status: 400 });
    }

    // allSettled, not all: one airport whose lookup fails (or is rate-limited)
    // must not blank the other fourteen cards on the page.
    const settled = await Promise.allSettled(icaos.map((icao) => fetchAirportBackdrop(icao)));

    const backdrops = {};
    settled.forEach((result, i) => {
        backdrops[ icaos[ i ] ] = result.status === 'fulfilled' ? (result.value || null) : null;
    });

    const failed = settled.filter((r) => r.status === 'rejected');
    if (failed.length) {
        console.error(`Backdrop lookup failed for ${failed.length}/${icaos.length} airports:`, failed[ 0 ].reason?.message);
    }

    return NextResponse.json({ backdrops }, {
        // Private — this sits behind the crew session check above. The real
        // caching is the per-ICAO 'use cache' inside fetchAirportBackdrop; this
        // just stops a pilot paging back and forth from re-asking every time.
        headers: { 'Cache-Control': 'private, max-age=3600' },
    });
}
