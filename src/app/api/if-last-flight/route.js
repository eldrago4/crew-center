import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import db from '@/db/client'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const IF_BASE = 'https://api.infiniteflight.com/public/v2'

async function ifFetch(url, options = {}) {
    const res = await fetch(url, options)
    if (!res.ok) throw new Error(`IF API HTTP ${res.status} for ${url}`)
    const json = await res.json()
    if (json.errorCode !== 0) throw new Error(`IF API errorCode ${json.errorCode}`)
    return json.result
}

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

    try {
        // Resolve IFC username → IF userId
        const userResults = await ifFetch(`${IF_BASE}/users?apikey=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ discourseNames: [user.ifcName] }),
        })

        const ifUser = Array.isArray(userResults)
            ? userResults.find(u => u.discourseUsername?.toLowerCase() === user.ifcName.toLowerCase())
            : null

        if (!ifUser?.userId) {
            return NextResponse.json({ error: 'User not found in Infinite Flight' }, { status: 404 })
        }

        // Fetch flights (PaginatedList) and aircraft list in parallel
        const [flightsList, aircraftList] = await Promise.all([
            ifFetch(`${IF_BASE}/users/${ifUser.userId}/flights?page=1&apikey=${apiKey}`),
            ifFetch(`${IF_BASE}/aircraft?apikey=${apiKey}`),
        ])

        // PaginatedList — flights are in .data
        const lastFlight = flightsList?.data?.[0]
        if (!lastFlight) {
            return NextResponse.json({ error: 'No flights found in your logbook' }, { status: 404 })
        }

        const aircraft = Array.isArray(aircraftList)
            ? aircraftList.find(a => a.id === lastFlight.aircraftId)
            : null

        return NextResponse.json({
            departure: lastFlight.originAirport || '',
            arrival: lastFlight.destinationAirport || '',
            totalMinutes: lastFlight.totalTime ?? 0,
            aircraftName: aircraft?.name || '',
        })
    } catch (err) {
        console.error('[IF LAST FLIGHT]', err.message)
        return NextResponse.json({ error: 'Failed to fetch flight data from Infinite Flight' }, { status: 502 })
    }
}
