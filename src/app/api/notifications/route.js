import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import db from '@/db/client'
import { pireps, crewcenter } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
    const session = await auth()
    if (!session?.user?.callsign) {
        return NextResponse.json({ rejectedPirepIds: [], eventIds: [] })
    }

    const [rejected, eventsRow] = await Promise.all([
        db.select({ pirepId: pireps.pirepId })
            .from(pireps)
            .where(and(eq(pireps.userId, session.user.callsign), eq(pireps.valid, false))),
        db.select({ value: crewcenter.value })
            .from(crewcenter)
            .where(eq(crewcenter.module, 'events'))
            .limit(1),
    ])

    const events = Array.isArray(eventsRow[0]?.value) ? eventsRow[0].value : []

    return NextResponse.json({
        rejectedPirepIds: rejected.map(p => p.pirepId),
        eventIds: events.map(e => e.id).filter(Boolean),
    })
}
