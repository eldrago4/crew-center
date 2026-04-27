import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function GET() {
  try {
    const cachedData = await redis.get('leaderboard:top10');

    if (!cachedData) {
      return NextResponse.json(
        { error: 'Leaderboard data not available' },
        { status: 404 }
      );
    }

    // Since Redis returns the data as stored (already a string from JSON.stringify),
    // we need to parse it back to an object
    let leaderboard;
    try {
      leaderboard = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
    } catch (parseError) {
      console.error('Error parsing cached data:', parseError);
      return NextResponse.json(
        { error: 'Invalid cached data format' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
