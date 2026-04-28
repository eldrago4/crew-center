import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import db from '@/db/client'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const IF_BASE = 'https://api.infiniteflight.com/public/v2'

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

        const atcList = await ifFetch(`${IF_BASE}/users/${ifUser.userId}/atc?page=1&apikey=${apiKey}`)

        const session_entry = atcList?.data?.find(s => s.created && s.updated)

        if (!session_entry) {
            return NextResponse.json({ error: 'No ATC sessions found' }, { status: 404 })
        }

        return NextResponse.json({
            airportIcao: (session_entry.airportIcao || '').toUpperCase().slice(0, 4),
            openTime: session_entry.created,   // UTC ISO string
            closeTime: session_entry.updated,  // UTC ISO string
        })
    } catch (err) {
        console.error('[IF LAST ATC]', err.message)
        return NextResponse.json({ error: err.message || 'Failed to fetch ATC session' }, { status: 500 })
    }
}
