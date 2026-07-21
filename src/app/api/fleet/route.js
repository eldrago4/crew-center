import { NextResponse, connection } from 'next/server';
import { fetchFleetModule } from '@/app/(crew)/crew/pireps/file/fleetModule';

export async function GET() {
  // Cached-read-only handler: without connection() it would be prerendered at
  // build (executing the cached read against the build-time DB). Request-time
  // matches today's behavior; Cloudflare's edge absorbs the traffic via the
  // CDN-Cache-Control below.
  await connection();
  try {
    const aircraftOptions = await fetchFleetModule('fleet');
    // Browser 1h; Cloudflare edge 1d + 1d serve-stale (CDN-Cache-Control passes
    // through Vercel) — the fleet list changes only on rare admin edits.
    return NextResponse.json(aircraftOptions, {
      headers: {
        'Cache-Control': 'public, max-age=3600',
        'CDN-Cache-Control': 'public, max-age=86400, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error fetching fleet data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch aircraft data' },
      { status: 500 }
    );
  }
}
