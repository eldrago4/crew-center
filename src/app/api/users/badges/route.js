import { NextResponse } from 'next/server'
import db from '@/db/client'
import { users } from '@/db/schema'
import { auth } from '@/auth'
import { eq } from 'drizzle-orm'

export async function GET() {
    const session = await auth()
    const callsign = session?.user?.callsign

    if (!callsign) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Note: users.badges is stored as jsonb[] where values are badge indexes 0..4.
    const rows = await db
        .select({ badges: users.badges })
        .from(users)
        .where(eq(users.id, callsign))
        .limit(1)

    const badges = rows?.[ 0 ]?.badges

    return NextResponse.json({ badges: Array.isArray(badges) ? badges : [] })
}

