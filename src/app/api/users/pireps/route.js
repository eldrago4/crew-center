import { NextResponse } from 'next/server'
import db from '@/db/client'
import { pireps } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user id parameter' },
        { status: 400 }
      )
    }

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql`count(*)` })
      .from(pireps)
      .where(eq(pireps.userId, userId))
    const total = Number(countResult[0]?.count || 0)

    // Fetch paginated pireps
    const pirepList = await db
      .select()
      .from(pireps)
      .where(eq(pireps.userId, userId))
      .orderBy(sql`${pireps.updatedAt} DESC`)
      .limit(pageSize)
      .offset((page - 1) * pageSize)

    return NextResponse.json({
      data: pirepList,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}