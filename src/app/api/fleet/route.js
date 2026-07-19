import { NextResponse } from 'next/server';
import { fetchFleetModule } from '@/app/(crew)/crew/pireps/file/fleetModule';

export async function GET() {
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
