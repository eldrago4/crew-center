import { NextResponse } from 'next/server';
import { db as firebaseDb } from '../../../lib/firebase';
import db from '../../../db/client';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request) {
    // Verify bot API key
    const auth = request.headers.get('Authorization') || '';
    const apiKey = process.env.BOT_API_KEY;
    if (!apiKey || !auth.startsWith('Bearer ') || auth.slice(7) !== apiKey) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { callsign, name, baseAirport, typeRating, discordId } = body;

    if (!callsign || !name || !baseAirport || !typeRating) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    try {
        // Check if already enrolled to avoid duplicates
        const existing = await firebaseDb
            .collection('users')
            .where('callsign', '==', callsign)
            .limit(1)
            .get();

        if (existing.empty) {
            await firebaseDb.collection('users').add({
                callsign,
                name,
                email: `${callsign.toLowerCase()}@indianvirtual.com`,
                baseAirport,
                typeRatings: [typeRating],
                currentLocation: baseAirport,
                rank: 'Cadet',
                role: 'pilot',
                earnings: 0,
                flightHours: 0,
                totalFlights: 0,
                lastLogin: null,
                simbriefUsername: '',
                createdAt: new Date().toISOString(),
                createdBy: callsign,
                activeEvent: {},
            });
        }

        // Set careerMode = true in Neon DB
        await db
            .update(users)
            .set({ careerMode: true })
            .where(eq(users.id, callsign));

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[career-accept] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
