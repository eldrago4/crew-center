import { db } from '@/lib/firebase';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { callsign, baseAirport, typeRating } = await request.json();

    if (!callsign || !baseAirport || !typeRating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user exists
    const userRef = db.collection('users').doc(callsign);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      // User exists, return existing data
      const userData = userDoc.data();
      return NextResponse.json({ user: userData, created: false });
    } else {
      // Create new user
      const newUser = {
        callsign,
        baseAirport,
        typeRatings: [typeRating],
        rank: 'Cadet',
        role: 'pilot',
        totalFlights: 0,
        flightHours: 0,
        earnings: 0,
        currentLocation: baseAirport,
        createdAt: new Date(),
        createdBy: 'system'
      };

      await userRef.set(newUser);
      return NextResponse.json({ user: newUser, created: true });
    }
  } catch (error) {
    console.error('Error in career-enroll:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
