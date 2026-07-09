import { NextResponse } from 'next/server';
import db from '@/db/client';
import { crewcenter, routes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireUser, requireStaff } from '@/lib/apiAuth';

const MODULE = 'routeRequests';
const ICAO_RE = /^[A-Z]{4}$/;
const TIME_RE = /^\d{1,2}:\d{2}$/;

async function getRequests() {
    const result = await db.select().from(crewcenter).where(eq(crewcenter.module, MODULE));
    return Array.isArray(result[0]?.value) ? result[0].value : [];
}

async function saveRequests(list) {
    await db.insert(crewcenter)
        .values({ module: MODULE, value: list })
        .onConflictDoUpdate({ target: crewcenter.module, set: { value: list } });
}

// GET all pending route requests, newest first
export async function GET() {
    try {
        const requests = await getRequests();
        requests.sort((a, b) => (b.requestedAt || 0) - (a.requestedAt || 0));
        return NextResponse.json(requests);
    } catch (error) {
        console.error('Error fetching route requests:', error);
        return NextResponse.json({ error: 'Failed to fetch route requests' }, { status: 500 });
    }
}

// POST a new route request (crew-facing)
export async function POST(request) {
    try {
        const { session, error } = await requireUser();
        if (error) return error;

        const body = await request.json();
        const { flightNumber, departureIcao, arrivalIcao, flightTime, aircraft } = body;

        if (!flightNumber || !departureIcao || !arrivalIcao || !flightTime || !aircraft) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }
        if (!ICAO_RE.test(departureIcao) || !ICAO_RE.test(arrivalIcao)) {
            return NextResponse.json({ error: 'ICAO codes must be exactly 4 letters' }, { status: 400 });
        }
        if (!TIME_RE.test(flightTime)) {
            return NextResponse.json({ error: 'Flight time must be in HH:MM format' }, { status: 400 });
        }

        const requests = await getRequests();
        const newRequest = {
            id: crypto.randomUUID(),
            flightNumber,
            departureIcao,
            arrivalIcao,
            flightTime,
            aircraft,
            // Identity is taken from the session, never trusted from the body
            ifcName: session.user.ifcName || session.user.callsign || 'Anonymous Pilot',
            callsign: session.user.callsign || null,
            discordId: session.user.discordId || null,
            requestedAt: Date.now(),
        };
        requests.push(newRequest);
        await saveRequests(requests);

        return NextResponse.json(newRequest, { status: 201 });
    } catch (error) {
        console.error('Error submitting route request:', error);
        return NextResponse.json({ error: 'Failed to submit route request' }, { status: 500 });
    }
}

// PATCH — admin accept/reject a pending request
export async function PATCH(request) {
    try {
        const { error: authError } = await requireStaff();
        if (authError) return authError;

        const body = await request.json();
        const { id, action } = body;
        if (!id || ![ 'accept', 'reject' ].includes(action)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        const requests = await getRequests();
        const target = requests.find(r => r.id === id);
        if (!target) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        let insertedRoute = null;
        if (action === 'accept') {
            const [ inserted ] = await db.insert(routes).values({
                flightNumber: target.flightNumber,
                departureIcao: target.departureIcao,
                arrivalIcao: target.arrivalIcao,
                flightTime: target.flightTime,
                aircraft: target.aircraft,
            }).returning();
            insertedRoute = inserted;
        }

        const remaining = requests.filter(r => r.id !== id);
        await saveRequests(remaining);

        return NextResponse.json({
            message: action === 'accept' ? 'Route request accepted' : 'Route request rejected',
            route: insertedRoute,
        });
    } catch (error) {
        console.error('Error updating route request:', error);
        let errorMessage = 'Failed to update route request';
        const actualError = error.cause || error;
        if (actualError.code === '23505') {
            errorMessage = 'A route with this flight number already exists';
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
