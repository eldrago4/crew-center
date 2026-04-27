import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import db from '@/db/client'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

const IF_BASE = 'https://api.infiniteflight.com/public/v2'

export async function GET() {
    const session = await auth()
    if (!session?.user?.callsign) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apiKey = process.env.INFINITE_FLIGHT_API_KEY
    if (!apiKey) {
        return NextResponse.json({ error: 'IF API key not configured' }, { status: 500 })
    }

    const [user] = await db
        .select({ ifcName: users.ifcName })
        .from(users)
        .where(eq(users.id, session.user.callsign))
        .limit(1)

    if (!user?.ifcName) {
        return NextResponse.json({ error: 'IFC username not found' }, { status: 404 })
    }

    // Resolve IFC username → IF userId
    const userRes = await fetch(`${IF_BASE}/users?apikey=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discourseNames: [user.ifcName] }),
    })
    const userData = await userRes.json()
    const ifUser = userData.result?.find(
        u => u.discourseUsername?.toLowerCase() === user.ifcName.toLowerCase()
    )
    if (!ifUser) {
        return NextResponse.json({ error: 'User not found in Infinite Flight' }, { status: 404 })
    }

    // Fetch most recent flight and aircraft list in parallel
    const [flightsRes, aircraftRes] = await Promise.all([
        fetch(`${IF_BASE}/users/${ifUser.userId}/flights?page=1&apikey=${apiKey}`),
        fetch(`${IF_BASE}/aircraft?apikey=${apiKey}`),
    ])
    const [flightsData, aircraftData] = await Promise.all([
        flightsRes.json(),
        aircraftRes.json(),
    ])

    const lastFlight = flightsData.result?.[0]
    if (!lastFlight) {
        return NextResponse.json({ error: 'No flights found' }, { status: 404 })
    }

    const aircraft = aircraftData.result?.find(a => a.id === lastFlight.aircraftId)

    return NextResponse.json({
        departure: lastFlight.originAirport || '',
        arrival: lastFlight.destinationAirport || '',
        totalMinutes: lastFlight.totalTime ?? 0,
        aircraftName: aircraft?.name || '',
    })
}
