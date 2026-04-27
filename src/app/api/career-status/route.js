import { NextResponse } from 'next/server';
import { auth } from '../../../auth';
import { db as firebaseDb } from '../../../lib/firebase';
import db from '../../../db/client';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
    const session = await auth();

    if (!session?.user?.callsign) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const callsign = session.user.callsign;

    // Check Firestore for existing career enrollment
    const snapshot = await firebaseDb
        .collection('users')
        .where('callsign', '==', callsign)
        .limit(1)
        .get();

    if (!snapshot.empty) {
        // User is enrolled in Firestore but careerMode may be stale in Neon DB.
        // Sync it now so the layout redirect kicks in on next request.
        if (!session.user.careerMode) {
            await db
                .update(users)
                .set({ careerMode: true })
                .where(eq(users.id, callsign));
        }
        return NextResponse.json({ enrolled: true });
    }

    return NextResponse.json({ enrolled: false });
}
