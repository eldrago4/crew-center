import { NextResponse } from 'next/server'
import db from '@/db/client'
import { pireps, users } from '@/db/schema'
import { eq, sql, isNull } from 'drizzle-orm'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')
    const valid = searchParams.get('valid')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)

    let query, countQuery

    // Check if we should include user data (only when valid param is provided and no userId)
    const includeUserData = !userId && valid !== null && valid !== undefined

    if (includeUserData) {
      // Include user data when only valid param is passed
      query = db.select({
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
        user: {
          id: users.id,
          ifcName: users.ifcName,
          rank: users.rank
        }
      }).from(pireps).leftJoin(users, eq(pireps.userId, users.id))

      countQuery = db.select({ count: sql`count(*)` }).from(pireps).leftJoin(users, eq(pireps.userId, users.id))
    } else {
      // Standard query without user data
      query = db.select().from(pireps)
      countQuery = db.select({ count: sql`count(*)` }).from(pireps)
    }

    // Build where conditions
    const conditions = []

    if (userId) {
      conditions.push(eq(pireps.userId, userId))
    }

    if (valid !== null && valid !== undefined) {
      if (valid === 'true') {
        conditions.push(eq(pireps.valid, true))
      } else if (valid === 'false') {
        conditions.push(eq(pireps.valid, false))
      } else if (valid === 'null') {
        conditions.push(isNull(pireps.valid))
      }
    }

    // Apply conditions if any
    if (conditions.length > 0) {
      let whereClause = conditions[ 0 ]
      for (let i = 1; i < conditions.length; i++) {
        whereClause = sql`${whereClause} AND ${conditions[ i ]}`
      }

      query = query.where(whereClause)
      countQuery = countQuery.where(whereClause)
    }

    // Get total count for pagination
    const countResult = await countQuery
    const total = Number(countResult[ 0 ]?.count || 0)

    // Fetch paginated pireps
    const pirepList = await query
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

export async function POST(request) {
  try {
    const body = await request.json()

    // Destructure required fields and optional fields
    const {
      flightNumber,
      date, // This should be a string in 'YYYY-MM-DD HH:MM:SS.ms' format
      flightTime, // This should be a string in 'HH:MM:SS' format
      departureIcao,
      arrivalIcao,
      aircraft,
      userId,
      operator = 'Indian Virtual', // Default value as per schema
      multiplier, // Optional
      comments = '', // Default to empty string if not provided
      valid = null, // Default to false if not provided, or handle based on your logic
    } = body;

    // Basic validation for required fields
    // Accept empty strings as present for IFATC
    const requiredFields = [ flightNumber, date, flightTime, departureIcao, arrivalIcao, aircraft, userId ];
    if (requiredFields.some(f => f === undefined || f === null)) {
      return NextResponse.json(
        { error: 'Missing required PIREP fields: flightNumber, date, flightTime, departureIcao, arrivalIcao, aircraft, userId' },
        { status: 400 }
      );
    }

    // Prepare the PIREP data for insertion
    const newPirepData = {
      flightNumber,
      date: new Date(date).toISOString().split('T')[ 0 ], // Ensure date is in a format Drizzle expects for timestamp
      flightTime,
      departureIcao,
      arrivalIcao,
      operator,
      aircraft,
      userId,
      // Only include optional 'multiplier' if it's provided in the request body
      ...(multiplier !== undefined && { multiplier: String(multiplier) }), // Convert numeric to string for Drizzle numeric type
      comments, // 'comments' will now default to '' if not provided in the body
      valid, // Use the provided valid status or default
      updatedAt: new Date().toISOString(), // Set current timestamp for updatedAt
    };

    const insertedPireps = await db.insert(pireps).values(newPirepData).returning();

    if (insertedPireps.length === 0) {
      throw new Error('Failed to insert PIREP: No record returned.');
    }

    (async () => {
      try {
        const inserted = insertedPireps[ 0 ];

        let userData = null;
        try {
          const u = await db.select({ id: users.id, ifcName: users.ifcName, rank: users.rank }).from(users).where(eq(users.id, inserted.userId));
          if (u && u.length > 0) userData = u[ 0 ];
        } catch (uErr) {
          console.warn('Could not fetch user data for PIREP webhook:', uErr); // Use warn if non-critical
          userData = null;
        }

        const fields = [
          {
            name: 'Pilot',
            value: userData
              ? `(\`${userData.id}\`) ${userData.ifcName}`
              : `<@${inserted.userId}>`,
            inline: true
          },
          {
            name: 'Flight Time',
            value: inserted.flightTime || '—',
            inline: true
          },
          {
            name: 'Operator',
            value: inserted.operator || '—',
            inline: true
          }
        ];

        // Only include multiplier field when it's explicitly not 1
        if (inserted.multiplier && Number(inserted.multiplier) !== 1) {
          fields.push({
            name: '💰 Multiplier',
            value: `**${inserted.multiplier}x**`,
            inline: true
          });
        }

        const embed = {
          title: `New PIREP: **${inserted.flightNumber}**`,
          description: `**${inserted.departureIcao || 'N/A'}** ➔ **${inserted.arrivalIcao || 'N/A'}**`,
          color: 0x1ABC9C,
          fields,
          timestamp: new Date(inserted.updatedAt || Date.now()).toISOString(),
          footer: {
            text: `# ${inserted.pirepId ?? inserted.id ?? 'N/A'}`
          }
        };

        const components = [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 5,
                label: 'Copy PIREP',
                url: `https://indianvirtual.site/crew/pireps/file?flightNumber=${encodeURI(inserted.flightNumber)}&departureIcao=${inserted.departureIcao}&arrivalIcao=${inserted.arrivalIcao}&aircraft=${encodeURI(inserted.aircraft)}`
              },
            ]
          }
        ];

        const webhookBody = {
          embeds: [ embed ],
          components: components // <-- Added components here
        };

        const webhookUrl = process.env.DISCORD_PIREP_WEBHOOK_URL;

        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookBody),
          // we don't await long; let it be best-effort
        });
      } catch (err) {
        console.error('Failed to send PIREP webhook:', err);
      }
    })();

    return NextResponse.json(
      { message: 'PIREP submitted successfully', pirep: insertedPireps[ 0 ] },
      { status: 201 } // 201 Created status
    );

  } catch (error) {
    console.error("Error submitting PIREP:", error);
    return NextResponse.json(
      { error: 'Failed to submit PIREP', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { pirepId, action, adminComments } = body;

    if (!pirepId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: pirepId and action' },
        { status: 400 }
      );
    }

    if (![ 'approve', 'reject' ].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be either "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Get the pirep details
    const pirepResult = await db.select().from(pireps).where(eq(pireps.pirepId, pirepId));

    if (pirepResult.length === 0) {
      return NextResponse.json(
        { error: 'PIREP not found' },
        { status: 404 }
      );
    }

    const pirep = pirepResult[ 0 ];

    if (action === 'approve') {
      // Update pirep to set valid = true
      await db.update(pireps)
        .set({
          valid: true,
          updatedAt: new Date().toISOString()
        })
        .where(eq(pireps.pirepId, pirepId));

      // Calculate flight time in minutes and add to user's flight time
      const flightTimeStr = pirep.flightTime; // Format: "HH:MM:SS"
      const [ hours, minutes, seconds ] = flightTimeStr.split(':').map(Number);
      const flightTimeMinutes = hours * 60 + minutes;

      // Apply multiplier if available
      const multiplier = pirep.multiplier ? parseFloat(pirep.multiplier) : 1;
      const adjustedFlightTimeMinutes = flightTimeMinutes * multiplier;

      // Update user's flight time
      await db.update(users)
        .set({
          flightTime: sql`"flightTime" + ${adjustedFlightTimeMinutes} * INTERVAL '1 minute'`
        })
        .where(eq(users.id, pirep.userId));

      return NextResponse.json({
        message: 'PIREP approved successfully',
        pirepId,
        flightTimeAdded: `${adjustedFlightTimeMinutes} minutes`
      });

    } else if (action === 'reject') {
      // Check current valid status to determine if we need to deduct flight time
      let flightTimeDeducted = null;

      if (pirep.valid === true) {
        // Calculate flight time in minutes and deduct from user's flight time
        const flightTimeStr = pirep.flightTime; // Format: "HH:MM:SS"
        const [ hours, minutes, seconds ] = flightTimeStr.split(':').map(Number);
        const flightTimeMinutes = hours * 60 + minutes;

        // Apply multiplier if available
        const multiplier = pirep.multiplier ? parseFloat(pirep.multiplier) : 1;
        const adjustedFlightTimeMinutes = flightTimeMinutes * multiplier;

        // Update user's flight time (deduct)
        await db.update(users)
          .set({
            flightTime: sql`"flightTime" - ${adjustedFlightTimeMinutes} * INTERVAL '1 minute'`
          })
          .where(eq(users.id, pirep.userId));

        flightTimeDeducted = `${adjustedFlightTimeMinutes} minutes`;
      }

      // Update pirep to set valid = false and add admin comments
      const updateData = {
        valid: false,
        updatedAt: new Date().toISOString()
      };

      if (adminComments) {
        updateData.adminComments = adminComments;
      }

      await db.update(pireps)
        .set(updateData)
        .where(eq(pireps.pirepId, pirepId));

      return NextResponse.json({
        message: 'PIREP rejected successfully',
        pirepId,
        ...(flightTimeDeducted && { flightTimeDeducted }),
        ...(adminComments && { adminComments })
      });
    }

  } catch (error) {
    console.error("Error updating PIREP:", error);
    return NextResponse.json(
      { error: 'Failed to update PIREP', details: error.message },
      { status: 500 }
    );
  }
}
