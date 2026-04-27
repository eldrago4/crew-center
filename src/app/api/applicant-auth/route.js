import { NextResponse } from 'next/server'
import db from '@/db/client'
import { applicants, users } from '@/db/schema'
import { eq } from 'drizzle-orm'

// POST — add a new applicant { callsign, ifcName, discordId }
export async function POST(request) {
    try {
        const body = await request.json()
        const { callsign, ifcName, discordId } = body

        if (!callsign || !ifcName || !discordId) {
            return NextResponse.json({ error: 'Missing required fields: callsign, ifcName, discordId' }, { status: 400 })
        }

        // Validate callsign format
        if (!/^INVA\d{3}$/.test(callsign)) {
            return NextResponse.json({ error: 'Callsign must match INVA*** format (e.g. INVA042)' }, { status: 400 })
        }

        // Check if callsign exists in users table (active user)
        const existingUser = await db.select({ id: users.id, ifcName: users.ifcName }).from(users).where(eq(users.id, callsign)).limit(1).execute()
        if (existingUser.length > 0 && existingUser[0].ifcName !== 'NA') {
            return NextResponse.json({ error: 'Callsign already taken by an active user' }, { status: 409 })
        }

        // Check if callsign already exists in applicants table
        const existingApplicant = await db.select({ id: applicants.id }).from(applicants).where(eq(applicants.id, callsign)).limit(1).execute()
        if (existingApplicant.length > 0) {
            return NextResponse.json({ error: 'Callsign already exists in applicants' }, { status: 409 })
        }

        // Insert into applicants
        await db.insert(applicants).values({
            id: callsign,
            ifcName,
            discordId: BigInt(discordId),
            passedAt: new Date().toISOString(),
        }).execute()

        return NextResponse.json({ success: true, callsign }, { status: 201 })
    } catch (err) {
        console.error('Error adding applicant:', err)

        // Handle unique constraint violation from DB
        if (err.code === '23505') {
            return NextResponse.json({ error: 'Callsign already exists' }, { status: 409 })
        }

        return NextResponse.json({ error: 'Failed to add applicant', details: err.message }, { status: 500 })
    }
}
