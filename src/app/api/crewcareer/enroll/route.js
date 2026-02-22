import { NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import db from '../../../../db/client';
import { users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request) {
    try {
        const session = await auth();

        if (!session?.user?.callsign) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { baseAirport, typeRating } = await request.json();

        if (!baseAirport || !typeRating) {
            return NextResponse.json({ error: 'Base airport and type rating are required' }, { status: 400 });
        }

        const callsign = session.user.callsign;

        // Get ifcName from Neon DB — this maps to "name" in the Firestore users doc
        const userData = await db
            .select({ ifcName: users.ifcName })
            .from(users)
            .where(eq(users.id, callsign))
            .limit(1);

        if (userData.length === 0) {
            return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
        }

        const name = userData[0].ifcName;
        const discordId = session.user.discordId || null;

        // Forward registration request to the Discord bot web server
        const botBaseUrl = process.env.BOT_BASE_URL;
        const botApiKey = process.env.BOT_API_KEY;

        if (!botBaseUrl || !botApiKey) {
            return NextResponse.json({ error: 'Bot not configured' }, { status: 500 });
        }

        const botResponse = await fetch(`${botBaseUrl}/career-register`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${botApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ callsign, name, baseAirport, typeRating, discordId }),
        });

        if (!botResponse.ok) {
            const err = await botResponse.json().catch(() => ({}));
            console.error('[career enroll] Bot error:', err);
            return NextResponse.json({ error: 'Failed to send registration request' }, { status: 500 });
        }

        return NextResponse.json({ pending: true });

    } catch (error) {
        console.error('[career enroll] Error:', error);
        return NextResponse.json({ error: 'Enrollment failed', details: error.message }, { status: 500 });
    }
}
