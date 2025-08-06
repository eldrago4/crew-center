import { NextResponse } from 'next/server'
import db from '@/db/client'
import { users, pireps } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

// Efficient cache check using MAX(updated_at) - minimal compute
async function getDataVersion(userId) {
  const [ userVersion, pirepVersion ] = await Promise.all([
    db
      .select({ maxUpdated: sql`MAX(${users.updatedAt})`.as('maxUpdated') })
      .from(users)
      .where(eq(users.id, userId)),
    db
      .select({ maxUpdated: sql`MAX(${pireps.updatedAt})`.as('maxUpdated') })
      .from(pireps)
      .where(eq(pireps.userId, userId))
  ])

  const userTimestamp = userVersion[ 0 ]?.maxUpdated ? new Date(userVersion[ 0 ].maxUpdated).getTime() : 0
  const pirepTimestamp = pirepVersion[ 0 ]?.maxUpdated ? new Date(pirepVersion[ 0 ].maxUpdated).getTime() : 0

  return Math.max(userTimestamp, pirepTimestamp)
}

// Cache using Next.js Edge Cache + timestamp-based invalidation
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')
    const lastKnownVersion = parseInt(searchParams.get('version') || '0')
    const forceRefresh = searchParams.get('refresh') === 'true'

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user id parameter' },
        { status: 400 }
      )
    }

    // Get current data version (timestamp-based)
    const currentVersion = await getDataVersion(userId)

    // If no updates, return 304 Not Modified
    if (!forceRefresh && lastKnownVersion === currentVersion && lastKnownVersion > 0) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
          'X-Data-Version': currentVersion.toString()
        }
      })
    }

    // Fetch fresh data
    const [ userDetails, pirepDetails ] = await Promise.all([
      db
        .select({
          id: users.id,
          ifcName: users.ifcName,
          flightTime: users.flightTime,
          careerMode: users.careerMode,
          rank: users.rank,
          updatedAt: users.updatedAt
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1),
      db
        .select({
          pirepId: pireps.pirepId,
          flightNumber: pireps.flightNumber,
          date: pireps.date,
          flightTime: pireps.flightTime,
          departureIcao: pireps.departureIcao,
          arrivalIcao: pireps.arrivalIcao,
          aircraft: pireps.aircraft,
          multiplier: pireps.multiplier,
          approved: pireps.valid,
          comments: pireps.comments,
          updatedAt: pireps.updatedAt
        })
        .from(pireps)
        .where(eq(pireps.userId, userId))
        .orderBy(sql`${pireps.updatedAt} DESC`)
        .limit(5)
    ])

    if (!userDetails || userDetails.length === 0) {
      return NextResponse.json(
        { error: `User with id ${userId} not found` },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: {
        ...userDetails[ 0 ],
        pireps: pirepDetails
      },
      version: currentVersion
    }, {
      headers: {
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
        'X-Data-Version': currentVersion.toString()
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// POST endpoint for efficient cache checking
export async function POST(request) {
  try {
    const { userId, lastKnownVersion } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user id' },
        { status: 400 }
      )
    }

    const currentVersion = await getDataVersion(userId)

    if (lastKnownVersion === currentVersion) {
      return NextResponse.json(
        { hasUpdates: false },
        {
          status: 200,
          headers: {
            'Cache-Control': 'public, max-age=30, stale-while-revalidate=60'
          }
        }
      )
    }

    // Fetch fresh data
    const [ userDetails, pirepDetails ] = await Promise.all([
      db
        .select({
          id: users.id,
          ifcName: users.ifcName,
          flightTime: users.flightTime,
          careerMode: users.careerMode,
          rank: users.rank,
          updatedAt: users.updatedAt
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1),
      db
        .select({
          pirepId: pireps.pirepId,
          flightNumber: pireps.flightNumber,
          date: pireps.date,
          flightTime: pireps.flightTime,
          departureIcao: pireps.departureIcao,
          arrivalIcao: pireps.arrivalIcao,
          aircraft: pireps.aircraft,
          multiplier: pireps.multiplier,
          approved: pireps.valid,
          comments: pireps.comments,
          updatedAt: pireps.updatedAt
        })
        .from(pireeps)
        .where(eq(pireps.userId, userId))
        .orderBy(sql`${pireps.updatedAt} DESC`)
        .limit(5)
    ])

    if (!userDetails || userDetails.length === 0) {
      return NextResponse.json(
        { error: `User with id ${userId} not found` },
        { status: 404 }
      )
    }

    return NextResponse.json({
      hasUpdates: true,
      data: {
        ...userDetails[ 0 ],
        pireps: pirepDetails
      },
      version: currentVersion
    }, {
      headers: {
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
        'X-Data-Version': currentVersion.toString()
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
