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

    // Badges effectively never change for a given browser session, and the dashboard
    // shows them from the server-rendered users.badges prop anyway (this endpoint is
    // not on the dashboard's hot path), so cache them ~forever in the private browser
    // cache. A newly awarded badge still appears on the next full page load via the
    // server prop; only this secondary API stays cached.
    return NextResponse.json({ badges: Array.isArray(badges) ? badges : [] }, {
        headers: { 'Cache-Control': 'private, max-age=31536000' },
    })
}

