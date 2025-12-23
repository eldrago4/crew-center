import { NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import { db as firebaseDb } from '../../../../lib/firebase';
import db from '../../../../db/client';
import { users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request) {
    try {
        const session = await auth();

        if (!session?.user?.callsign) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const { baseAirport, typeRating } = await request.json();

        if (!baseAirport || !typeRating) {
            return NextResponse.json(
                { error: "Base airport and type rating are required" },
                { status: 400 }
            );
        }

        const callsign = session.user.callsign;

        // 1. Get user's name from Neon DB
        const userData = await db
            .select({ ifcName: users.ifcName })
            .from(users)
            .where(eq(users.id, callsign))
            .limit(1);

        if (userData.length === 0) {
            return NextResponse.json(
                { error: "User not found in database" },
                { status: 404 }
            );
        }

        const userName = userData[ 0 ].ifcName;

        // Get additional session data
        const discordId = session.user.discordId;

        // 2. Check if user exists in Firebase users collection (query by callsign field)
        const usersQuery = firebaseDb.collection('users').where('callsign', '==', callsign);
        const usersSnapshot = await usersQuery.get();

        if (!usersSnapshot.empty) {
            // User exists, get the first document
            const userDoc = usersSnapshot.docs[ 0 ];
            const userData = userDoc.data();

            // Check if already enrolled (has baseAirport set)
            if (userData.baseAirport) {
                return NextResponse.json({
                    success: true,
                    alreadyEnrolled: true,
                    message: "User already enrolled in career mode"
                });
            }

            // Update existing user with career enrollment data
            await userDoc.ref.update({
                baseAirport: baseAirport,
                typeRatings: [ typeRating ],
                currentLocation: baseAirport,
                lastLogin: new Date().toISOString()
            });
        } else {
            // Create new user document in Firestore (with auto-generated UUID as document ID)
            await firebaseDb.collection('users').add({
                callsign: callsign,
                name: userName,
                baseAirport: baseAirport,
                typeRatings: [ typeRating ],
                currentLocation: baseAirport,
                rank: 'Cadet',
                flightHours: 0,
                totalFlights: 0,
                earnings: 0,
                role: 'pilot',
                createdAt: new Date().toISOString(),
                createdBy: callsign,
                activeEvent: {}
            });
        }

        return NextResponse.json({
            success: true,
            alreadyEnrolled: false,
            message: "Enrollment successful"
        });

    } catch (error) {
        console.error('Enrollment API error:', error);
        return NextResponse.json(
            { error: "Enrollment failed", details: error.message },
            { status: 500 }
        );
    }
}

