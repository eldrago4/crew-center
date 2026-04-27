import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import db from '@/db/client'
import { users, pireps } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

export async function GET(request) {
  const session = await auth()
  if (!session?.user?.permissions?.includes('staff')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  try {
    const [userRows, pirepRows] = await Promise.all([
      db.select({
        id: users.id,
        ifcName: users.ifcName,
        discordId: users.discordId,
        rank: users.rank,
        flightTime: users.flightTime,
        careerMode: users.careerMode,
        lastActive: users.lastActive,
      })
        .from(users)
        .where(eq(users.id, id))
        .limit(1),

      db.select({
        pirepId: pireps.pirepId,
        flightNumber: pireps.flightNumber,
        date: pireps.date,
        flightTime: pireps.flightTime,
        departureIcao: pireps.departureIcao,
        arrivalIcao: pireps.arrivalIcao,
        aircraft: pireps.aircraft,
        valid: pireps.valid,
        multiplier: pireps.multiplier,
      })
        .from(pireps)
        .where(eq(pireps.userId, id))
        .orderBy(sql`${pireps.date} DESC`)
        .limit(8),
    ])

    if (userRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = userRows[0]
    return NextResponse.json({
      data: {
        ...user,
        discordId: user.discordId != null ? user.discordId.toString() : null,
        pireps: pirepRows,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
