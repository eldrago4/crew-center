import { NextResponse } from 'next/server'
import db from '@/db/client'
import { users } from '@/db/schema'
import { sql } from 'drizzle-orm'

// In-memory cache 
let cachedUsers = null
let lastUserId = null

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const nameFilter = searchParams.get('name') || ''
    const forceRefresh = searchParams.get('refresh') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Check for new users using indexed ID comparison
    if (cachedUsers && !forceRefresh) {
      const latestUser = await db
        .select({ id: users.id })
        .from(users)
        .orderBy(sql`${users.id} DESC`)
        .limit(1)
        .execute()

      if (latestUser[ 0 ]?.id === lastUserId) {
        // Use indexed search when filtering
        if (nameFilter) {
          const [ filtered, total ] = await Promise.all([
            db
              .select({
                id: users.id,
                name: users.ifcName,
                rank: users.rank,
                lastActive: users.lastActive
              })
              .from(users)
              .where(sql`users.ifcName ILIKE ${'%' + nameFilter + '%'}`)
              .limit(limit)
              .offset(offset)
              .execute(),
            db
              .select({ count: sql`count(*)` })
              .from(users)
              .where(sql`users.ifcName ILIKE ${'%' + nameFilter + '%'}`)
              .execute()
          ])
          return NextResponse.json({
            data: filtered,
            pagination: {
              page,
              limit,
              total: Number(total[ 0 ].count)
            }
          })
        }
        return NextResponse.json({
          data: cachedUsers.slice(offset, offset + limit),
          pagination: {
            page,
            limit,
            total: cachedUsers.length
          }
        })
      }
    }

    // Full indexed fetch when cache is stale
    const [ freshData, total ] = await Promise.all([
      db
        .select({
          id: users.id,
          name: users.ifcName,
          rank: users.rank,
          lastActive: users.lastActive
        })
        .from(users)
        .limit(limit)
        .offset(offset)
        .execute(),
      db
        .select({ count: sql`count(*)` })
        .from(users)
        .execute()
    ])

    // Update cache
    cachedUsers = await db
      .select({
        id: users.id,
        name: users.ifcName,
        rank: users.rank,
        lastActive: users.lastActive
      })
      .from(users)
      .execute()

    lastUserId = freshData[ 0 ]?.id

    if (nameFilter) {
      const [ filtered, filteredTotal ] = await Promise.all([
        db
          .select({
            id: users.id,
            name: users.ifcName,
            rank: users.rank,
            lastActive: users.lastActive
          })
          .from(users)
          .where(sql`users.ifcName ILIKE ${'%' + nameFilter + '%'}`)
          .limit(limit)
          .offset(offset)
          .execute(),
        db
          .select({ count: sql`count(*)` })
          .from(users)
          .where(sql`users.ifcName ILIKE ${'%' + nameFilter + '%'}`)
          .execute()
      ])
      return NextResponse.json({
        data: filtered,
        pagination: {
          page,
          limit,
          total: Number(filteredTotal[ 0 ].count)
        }
      })
    }

    return NextResponse.json({
      data: freshData,
      pagination: {
        page,
        limit,
        total: Number(total[ 0 ].count)
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Missing user id parameter' },
        { status: 400 }
      )
    }

    const deleteResult = await db
      .delete(users)
      .where(sql`${users.id} = ${id}`)
      .execute()

    if (deleteResult.rowCount === 0) {
      return NextResponse.json(
        { error: `User ${id} not found` },
        { status: 404 }
      )
    }

    // update cache only for affected user
    if (cachedUsers) {
      cachedUsers = cachedUsers.filter(user => user.id !== id)
      if (cachedUsers.length > 0) {
        lastUserId = cachedUsers[0].id
      } else {
        lastUserId = null
      }
    }

    return NextResponse.json(
      { message: `User ${id} removed successfully` },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
