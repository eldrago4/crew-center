import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import db from '@/db/client'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const IF_BASE = 'https://api.infiniteflight.com/public/v2'

// IF livery name → our operator label (only confident matches)
const LIVERY_TO_OPERATOR = {
    'FedEx': 'Fedex Virtual',
    'Hainan Airlines': 'Hainan Virtual',
    'Copa Airlines': 'Copa Virtual',
    'AirAsia': 'AirAsia Virtual',
    'AirAsia X': 'AirAsia Virtual',
    'ITA Airways': 'ITA Airways Virtual',
    'Etihad Airways': 'Etihad Virtual',
    'Etihad Airways - 2015': 'Etihad Virtual',
    'Etihad Airways - Choose UK': 'Etihad Virtual',
    'Etihad Airways - Formula One': 'Etihad Virtual',
    'Etihad Cargo': 'Etihad Virtual',
    'LOT Polish Airlines': 'LOT Virtual',
    'Vietnam Airlines': 'Vietnam Virtual',
    'EasyJet': 'easyJet Virtual',
    'EasyJet - 2015': 'easyJet Virtual',
    'Qatar Airways': 'Qatar Virtual',
    'Qatar Airways - Retro': 'Qatar Virtual',
    'Qatar Cargo': 'Qatar Virtual',
    'Garuda Indonesia': 'Garuda Virtual Group',
    'Garuda Indonesia - Skyteam': 'Garuda Virtual Group',
    'Caribbean Airlines': 'Caribbean Virtual',
    'IndiGo': 'IndiGo Virtual',
    'Jet Airways': 'Jet Airways',
    'Lufthansa': 'Lufty Virtual',
    'Lufthansa - 2018': 'Lufty Virtual',
    'Lufthansa Cargo': 'Lufty Virtual',
    'Lufthansa CityLine': 'Lufty Virtual',
    'Lufthansa CityLine- 2018': 'Lufty Virtual',
    'Lufthansa Regional': 'Lufty Virtual',
    'Korean Air': 'Korean Air Virtual',
    'Korean Air Cargo': 'Korean Air Virtual',
    'Turkish Airlines': 'Turkish Virtual',
    'Turkish Airlines - Sharklets': 'Turkish Virtual',
    'Turkish Airlines Cargo': 'Turkish Virtual',
    'Turkish Cargo': 'Turkish Virtual',
    'Swiss International Air Lines': 'SWISS Virtual',
    'Brussels Airlines': 'Brussels Virtual',
    'EVA Air':           'BRVA Virtual',
    'EVA Air Cargo':     'BRVA Virtual',
    'Virgin Australia': 'Virgin Australia Virtual',
    'Singapore Airlines': 'Singapore Virtual',
    'Saudia': 'Saudia Virtual',
    'Saudia Cargo': 'Saudia Virtual',
    'Kenya Airways': 'Kenya Airways Virtual',
    'Croatia Airlines': 'Croatia Virtual',
    'Avianca': 'Avianca Virtual',
    'Thai Airways': 'Thai Virtual',
    'Thai Airways - Star Alliance': 'Thai Virtual',
    'United Airlines': 'United Virtual',
    'United Airlines - 2019': 'United Virtual',
    'United Airlines - Old': 'United Virtual',
    'United Continental': 'United Virtual',
    'United Express': 'United Virtual',
    'United Express - Old': 'United Virtual',
    'Ryanair': 'Ryanair Virtual',
    'TAP Air Portugal': 'TAP Virtual',
    'TAP Express': 'TAP Virtual',
    'South African Airways': 'South African Virtual Airlines',
    'ANA': 'ANA Virtual',
    'ANA - Kai': 'ANA Virtual',
    'ANA - La': 'ANA Virtual',
    'ANA - Lani': 'ANA Virtual',
    'ANA Cargo': 'ANA Virtual',
    'Lion Air': 'Lion Air Virtual',
    'Icelandair': 'Icelandic Virtual',
    'SpiceJet': 'SpiceJet Virtual',
    'Spicejet': 'SpiceJet Virtual',
    'Srilankan Airlines': 'Srilankan Virtual',
    'Air Mauritius': 'Air Mauritius',
    'Jazeera Airways': 'Jazeera Virtual',
    'Ethiopian Airlines': 'Ethiopian Virtual',
    'Ethiopian Cargo': 'Ethiopian Virtual',
    'LATAM': 'LATAM Virtual',
    'LAN': 'LATAM Virtual',
    'LAN Cargo': 'LATAM Virtual',
    'Air Canada': 'Air Canada',
    'Air Canada - Retro': 'Air Canada',
    'Air Canada Express': 'Air Canada',
    'Air Canada Rouge': 'Air Canada',
    'Qantas': 'Qantas Virtual',
    'QantasLink': 'Qantas Virtual',
    // Indian Virtual
    'Air India': 'Indian Virtual',
    'Air India Express': 'Indian Virtual',
    'Vistara': 'Indian Virtual',
    // Dubai Virtual
    'Emirates': 'Dubai Virtual',
    'Emirates - 1999': 'Dubai Virtual',
    'Emirates - 2023': 'Dubai Virtual',
    'Emirates - 50th Anniversary': 'Dubai Virtual',
    'Emirates SkyCargo': 'Dubai Virtual',
}

async function ifFetch(url, options = {}) {
    const res = await fetch(url, options)
    if (!res.ok) throw new Error(`IF API HTTP ${res.status}`)
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

    const [ user ] = await db
        .select({ ifcName: users.ifcName })
        .from(users)
        .where(eq(users.id, session.user.callsign))
        .limit(1)

    if (!user?.ifcName) {
        return NextResponse.json({ error: 'IFC username not found' }, { status: 404 })
    }

    try {
        const userResults = await ifFetch(`${IF_BASE}/users?apikey=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ discourseNames: [ user.ifcName ] }),
        })

        const ifUser = Array.isArray(userResults)
            ? userResults.find(u => u.discourseUsername?.toLowerCase() === user.ifcName.toLowerCase())
            : null

        if (!ifUser?.userId) {
            return NextResponse.json({ error: 'User not found in Infinite Flight' }, { status: 404 })
        }

        const [ flightsList, liveryResult ] = await Promise.all([
            ifFetch(`${IF_BASE}/users/${ifUser.userId}/flights?page=1&apikey=${apiKey}`),
            ifFetch(`${IF_BASE}/aircraft/liveries?apikey=${apiKey}`),
        ])
        const liveries = Array.isArray(liveryResult) ? liveryResult : []

        const flight = flightsList?.data?.find(f =>
            f.server === 'Expert' &&
            f.originAirport &&
            f.destinationAirport &&
            f.totalTime > 0 &&
            f.landingCount > 0
        )

        if (!flight) {
            return NextResponse.json({ error: 'No valid Expert server flights found' }, { status: 404 })
        }

        const livery = liveries.find(l => l.id === flight.liveryId)
        const operator = livery ? (LIVERY_TO_OPERATOR[ livery.liveryName ] ?? null) : null

        return NextResponse.json({
            departure: flight.originAirport,
            arrival: flight.destinationAirport,
            totalMinutes: flight.totalTime,
            aircraftName: livery?.aircraftName || '',
            operator,
        })
    } catch (err) {
        console.error('[IF LAST FLIGHT]', err.message)
        return NextResponse.json({ error: 'Failed to fetch flight data from Infinite Flight' }, { status: 502 })
    }
}
