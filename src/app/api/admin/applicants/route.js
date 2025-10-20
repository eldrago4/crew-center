import { NextResponse } from 'next/server'
import db from '@/db/client'
import { applicants, users } from '@/db/schema'
import { sql } from 'drizzle-orm'

// GET applicants
export async function GET() {
    try {
        const data = await db.select().from(applicants)
        // Drizzle/pg may return BigInt for bigint columns (discordId). JSON.stringify can't handle BigInt.
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

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Error accepting applicant:', err)
        return NextResponse.json({ error: 'Failed to accept applicant' }, { status: 500 })
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
