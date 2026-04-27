import { NextResponse } from 'next/server';
import { fetchFleetModule } from '@/app/(crew)/crew/pireps/file/fleetModule';

export async function GET() {
  try {
    const aircraftOptions = await fetchFleetModule('fleet');
    return NextResponse.json(aircraftOptions);
  } catch (error) {
    console.error('Error fetching fleet data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch aircraft data' },
      { status: 500 }
    );
  }
}
