import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import db from '@/db/client'
import { pireps, crewcenter } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { Redis } from '@upstash/redis'

export const dynamic = 'force-dynamic'

const redis = Redis.fromEnv()
const CACHE_TTL_SECONDS = 10 * 60

export async function GET() {
    const session = await auth()
    if (!session?.user?.callsign) {
        return NextResponse.json({ rejectedPirepIds: [], eventIds: [] })
    }

    const cacheKey = `notifications:${session.user.callsign}`
    try {
        const cached = await redis.get(cacheKey)
        if (cached) {
            return NextResponse.json(typeof cached === 'string' ? JSON.parse(cached) : cached, {
                headers: { 'Cache-Control': 'private, max-age=120' },
            })
        }
    } catch (error) {
        console.warn('Notifications Redis cache read failed:', error)
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

    const payload = {
        rejectedPirepIds: rejected.map(p => p.pirepId),
        eventIds: events.map(e => e.id).filter(Boolean),
    }

    try {
        await redis.set(cacheKey, payload, { ex: CACHE_TTL_SECONDS })
    } catch (error) {
        console.warn('Notifications Redis cache write failed:', error)
    }

    return NextResponse.json(payload, {
        headers: { 'Cache-Control': 'private, max-age=120' },
    })
}
