import { NextResponse } from 'next/server';
import { getSiteFlags } from '@/lib/maintenance-flag';

// What the maintenance page shows: the note and expected end set from the server
// console. Only those two fields; who switched it on stays private. Served from
// Vercel's CDN for 30s, so a crowd sitting on the maintenance page costs about one
// invocation per region per half-minute rather than one per visitor.
export async function GET() {
    const { maintenance } = await getSiteFlags();
    return NextResponse.json(
        { message: maintenance?.message ?? null, until: maintenance?.until ?? null },
        { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=30' } },
    );
}
