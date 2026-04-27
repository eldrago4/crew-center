import { NextResponse } from 'next/server'
import db from '@/db/client'
import { applicants, users } from '@/db/schema'
import { sql, eq } from 'drizzle-orm'

// GET applicants or validate callsign (?validate=INVA042&current=INVA001)
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const validate = searchParams.get('validate')

        // Callsign validation mode
        if (validate) {
            const currentId = searchParams.get('current')
            if (!/^INVA\d{3}$/.test(validate)) {
                return NextResponse.json({ available: false, reason: 'Must match INVA*** format' })
            }
            if (validate === currentId) {
                return NextResponse.json({ available: true })
            }

            // Check users table
            const existing = await db.select({ id: users.id, ifcName: users.ifcName }).from(users).where(eq(users.id, validate)).limit(1).execute()
            if (existing.length > 0 && existing[0].ifcName !== 'NA') {
                return NextResponse.json({ available: false, reason: 'Taken by an active user' })
            }

            // Check applicants table
            const existingApp = await db.select({ id: applicants.id }).from(applicants).where(eq(applicants.id, validate)).limit(1).execute()
            if (existingApp.length > 0 && validate !== currentId) {
                return NextResponse.json({ available: false, reason: 'Taken by another applicant' })
            }

            return NextResponse.json({ available: true })
        }

        // Default: fetch all applicants
        const data = await db.select().from(applicants)
        const safe = (data || []).map(row => ({
            ...row,
            discordId: row.discordId != null ? String(row.discordId) : null,
        }))
        return NextResponse.json({ data: safe })
    } catch (err) {
        console.error('Error fetching applicants:', err)
        return NextResponse.json({ error: 'Failed to fetch applicants' }, { status: 500 })
    }
}

// POST accept applicant -> create user and delete applicant
export async function POST(request) {
    try {
        const body = await request.json()
        const { id } = body
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

        // find applicant
        const found = await db.select().from(applicants).where(sql`${applicants.id} = ${id}`).limit(1).execute()
        if (!found || found.length === 0) return NextResponse.json({ error: 'Applicant not found' }, { status: 404 })

        const app = found[ 0 ]

        // create users entry
        await db.insert(users).values({ id: app.id, ifcName: app.ifcName || null, discordId: app.discordId || null }).execute()

        // remove from applicants
        await db.delete(applicants).where(sql`${applicants.id} = ${id}`).execute()

        // Notify Discord bot about the new member
        try {
            const botApiUrl = process.env.BOT_API_URL
            const botApiKey = process.env.BOT_API_KEY

            if (botApiUrl && botApiKey && app.discordId) {
                await fetch(`${botApiUrl}/member-accepted`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${botApiKey}`,
                    },
                    body: JSON.stringify({
                        discord_id: app.discordId.toString(),
                        ifc_name: app.ifcName,
                        callsign: app.id,
                    }),
                    signal: AbortSignal.timeout(10000),
                })
            }
        } catch (botErr) {
            console.error('Failed to notify bot for accepted member:', botErr)
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Error accepting applicant:', err)
        return NextResponse.json({ error: 'Failed to accept applicant' }, { status: 500 })
    }
}

// PATCH update applicant callsign
export async function PATCH(request) {
    try {
        const body = await request.json()
        const { oldId, newId } = body
        if (!oldId || !newId) return NextResponse.json({ error: 'Missing oldId or newId' }, { status: 400 })

        // Validate format: INVA + 3 digits
        if (!/^INVA\d{3}$/.test(newId)) {
            return NextResponse.json({ error: 'Callsign must match INVA*** format (e.g. INVA042)' }, { status: 400 })
        }

        // Check if callsign already exists in users table
        const existing = await db.select({ id: users.id, ifcName: users.ifcName }).from(users).where(eq(users.id, newId)).limit(1).execute()
        if (existing.length > 0 && existing[0].ifcName !== 'NA') {
            return NextResponse.json({ error: 'Callsign already taken by an active user' }, { status: 409 })
        }

        // Check if callsign already exists in applicants table (another applicant)
        const existingApplicant = await db.select({ id: applicants.id }).from(applicants).where(eq(applicants.id, newId)).limit(1).execute()
        if (existingApplicant.length > 0 && newId !== oldId) {
            return NextResponse.json({ error: 'Callsign already taken by another applicant' }, { status: 409 })
        }

        // Find current applicant
        const found = await db.select().from(applicants).where(eq(applicants.id, oldId)).limit(1).execute()
        if (!found || found.length === 0) return NextResponse.json({ error: 'Applicant not found' }, { status: 404 })

        const app = found[0]

        // Since id is primary key, delete old and insert new
        await db.delete(applicants).where(eq(applicants.id, oldId)).execute()
        await db.insert(applicants).values({ id: newId, ifcName: app.ifcName, discordId: app.discordId, passedAt: app.passedAt }).execute()

        return NextResponse.json({ success: true, newId })
    } catch (err) {
        console.error('Error updating applicant callsign:', err)
        return NextResponse.json({ error: 'Failed to update callsign' }, { status: 500 })
    }
}

// DELETE remove applicant only
export async function DELETE(request) {
    try {
        const url = new URL(request.url)
        const id = url.searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

        await db.delete(applicants).where(sql`${applicants.id} = ${id}`).execute()
        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Error deleting applicant:', err)
        return NextResponse.json({ error: 'Failed to delete applicant' }, { status: 500 })
    }
}
