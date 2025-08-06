// Allowed callsigns for registration - commented out to allow any callsign
// const allowedCallsigns = [
//   "INVA001", "INVA002", "INVA003", "INVA004", "INVA005", "INVA006", "INVA007", "INVA008", "INVA009", "INVA010",
//   "INVA011", "INVA015", "INVA025", "INVA054", "INVA063", "INVA069", "INVA100", "INVA101", "INVA102", "INVA103",
//   "INVA104", "INVA105", "INVA107", "INVA111", "INVA119", "INVA120", "INVA121", "INVA128", "INVA131", "INVA136",
//   "INVA137", "INVA150", "INVA153", "INVA154", "INVA160", "INVA164", "INVA167", "INVA172", "INVA177", "INVA183",
//   "INVA188", "INVA189", "INVA198", "INVA199", "INVA200", "INVA206", "INVA216", "INVA221", "INVA224", "INVA230",
//   "INVA232", "INVA234", "INVA242", "INVA246", "INVA252", "INVA254", "INVA260", "INVA264", "INVA267", "INVA268",
//   "INVA271", "INVA279", "INVA280", "INVA284", "INVA286", "INVA293", "INVA301", "INVA303", "INVA305", "INVA306",
//   "INVA308", "INVA314", "INVA315", "INVA318", "INVA320", "INVA321", "INVA333", "INVA340", "INVA342", "INVA345",
//   "INVA350", "INVA353", "INVA357", "INVA359", "INVA360", "INVA361", "INVA369", "INVA380", "INVA393", "INVA407",
//   "INVA420", "INVA428", "INVA430", "INVA438", "INVA450", "INVA454", "INVA456", "INVA457", "INVA458", "INVA486",
//   "INVA491", "INVA500", "INVA524", "INVA537", "INVA541", "INVA606", "INVA615", "INVA639", "INVA640", "INVA645",
//   "INVA647", "INVA666", "INVA672", "INVA675", "INVA690", "INVA700", "INVA707", "INVA737", "INVA747", "INVA773",
//   "INVA777", "INVA779", "INVA786", "INVA787", "INVA788", "INVA790", "INVA797", "INVA801", "INVA805", "INVA888",
//   "INVA889", "INVA911", "INVA940", "INVA956", "INVA983", "INVA991", "INVA999"
// ];

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
    const idFilter = searchParams.get('id') || ''
    const forceRefresh = searchParams.get('refresh') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // If searching by id (callsign), return user or allowed status
    if (idFilter) {
      // Check DB for user
      const user = await db
        .select({
          id: users.id,
          name: users.ifcName,
          rank: users.rank,
          lastActive: users.lastActive
        })
        .from(users)
        .where(sql`${users.id} = ${idFilter}`)
        .execute();
      if (user.length > 0) {
        return NextResponse.json({ data: user });
      }
      // If not found, allow any callsign since restriction is removed
      return NextResponse.json({ data: [], allowed: true });
    }

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

export async function POST(request) {
  try {
    const { id, discordId, ifcName } = await request.json();
    if (!id || !discordId || !ifcName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Convert discordId to BigInt to match schema
    const discordIdBigInt = BigInt(discordId);

    // Insert user with proper data types
    await db.insert(users).values({
      id,
      discordId: discordIdBigInt,
      ifcName
    }).execute();

    // Invalidate cache
    cachedUsers = null;
    lastUserId = null;
    return NextResponse.json({ message: 'User created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { id, discordId, ifcName, flightTime, careerMode, rank } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
    }

    const updateData = {};
    if (discordId !== undefined) updateData.discordId = BigInt(discordId);
    if (ifcName !== undefined) updateData.ifcName = ifcName;
    if (flightTime !== undefined) updateData.flightTime = flightTime;
    if (careerMode !== undefined) updateData.careerMode = careerMode;
    if (rank !== undefined) updateData.rank = rank;
    
    // Always update updatedAt
    updateData.updatedAt = new Date().toISOString();

    const updateResult = await db
      .update(users)
      .set(updateData)
      .where(sql`${users.id} = ${id}`)
      .execute()

    if (updateResult.rowCount === 0) {
      return NextResponse.json(
        { error: `User ${id} not found` },
        { status: 404 }
      )
    }

    // Invalidate cache
    cachedUsers = null;
    lastUserId = null;

    return NextResponse.json(
      { message: `User ${id} updated successfully` },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating user:', error);
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
        lastUserId = cachedUsers[ 0 ].id
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
