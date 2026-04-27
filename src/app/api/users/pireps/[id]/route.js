import { NextResponse } from 'next/server'
import db from '@/db/client'
import { pireps, users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { error: 'PIREP ID is required' },
        { status: 400 }
      )
    }

    // Fetch the PIREP with user details
    const pirepResult = await db
      .select({
        pirepId: pireps.pirepId,
        flightNumber: pireps.flightNumber,
        date: pireps.date,
        flightTime: pireps.flightTime,
        departureIcao: pireps.departureIcao,
        arrivalIcao: pireps.arrivalIcao,
        operator: pireps.operator,
        aircraft: pireps.aircraft,
        multiplier: pireps.multiplier,
        comments: pireps.comments,
        valid: pireps.valid,
        updatedAt: pireps.updatedAt,
        userId: pireps.userId,
        adminComments: pireps.adminComments,
        user: {
          id: users.id,
          ifcName: users.ifcName,
          rank: users.rank
        }
      })
      .from(pireps)
      .leftJoin(users, eq(pireps.userId, users.id))
      .where(eq(pireps.pirepId, id))

    if (pirepResult.length === 0) {
      return NextResponse.json(
        { error: 'PIREP not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: pirepResult[0]
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
