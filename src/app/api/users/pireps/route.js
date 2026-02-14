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

    // Send Discord webhook (awaited so serverless runtime doesn't kill it)
    try {
      const inserted = insertedPireps[ 0 ];

      let userData = null;
      try {
        const u = await db.select({ id: users.id, ifcName: users.ifcName, rank: users.rank }).from(users).where(eq(users.id, inserted.userId));
        if (u && u.length > 0) userData = u[ 0 ];
      } catch (uErr) {
        console.warn('Could not fetch user data for PIREP webhook:', uErr);
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

      const webhookUrl = process.env.DISCORD_PIREP_WEBHOOK_URL;
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ embeds: [ embed ], components }),
          signal: AbortSignal.timeout(5000),
        });
      }
    } catch (err) {
      console.error('Failed to send PIREP webhook:', err);
    }

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
      // Fetch user's current flight time and discord ID
      const userResult = await db.select({ flightTime: users.flightTime, discordId: users.discordId, rank: users.rank })
        .from(users).where(eq(users.id, pirep.userId));
      const currentUser = userResult[ 0 ];
      const rankBefore = currentUser?.rank;

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

      // Compute new rank locally from current flight time + added time
      const rankData = {
        Chhatrapati: {
          hours: 2000,
          aircraft: [ 'A380' ],
          color: 0xFFD700,
          flavor: [
            "there is literally nothing left to prove\nyou are the final boss",
            "2000 hours. TWO THOUSAND.\nmost pilots retire before this you just built different",
            "the entire fleet reports to you now\nwe're not even joking",
          ],
          aircraftLine: "you get THE plane. the only one that matters.",
          club: {
            name: 'Akasharatha Club',
            multiplier: '1.5x',
            line: "at 2500hrs you unlock **Akasharatha Club**\nthat's **1.5x** on EVERYTHING\n\n-# as if you needed more flex",
          },
        },
        Samrat: {
          hours: 1500,
          aircraft: [ 'A359', 'B748' ],
          color: 0xE74C3C,
          flavor: [
            "1500 hours and you're still going??\nyou're actually insane and we respect it",
            "at this point ATC should be calling YOU sir\nnot the other way around",
            "most people talk about grinding\nyou just... did it. absolute menace.",
          ],
          aircraftLine: "the big boys. the queens of the sky. yours now.",
          club: {
            name: 'Rajamatya Club',
            multiplier: '1.25x',
            line: "you just unlocked **Rajamatya Club**\nthat's a **1.25x** multiplier on everything\n\n-# welcome to the inner circle\n-# act like you belong",
          },
        },
        Maharaja: {
          hours: 900,
          aircraft: [ 'B77L', 'B77W', 'B772', 'B744', 'A340' ],
          color: 0x9B59B6,
          flavor: [
            "900 hours. the fleet bows.\nyou didn't just earn this you TOOK it",
            "triple 7s and 747s??\nyou've ascended past mortal aviation",
            "the heavies are yours now\nthe ramp agents are scared of you (compliment)",
          ],
          aircraftLine: "quad engines. heavy metal. absolute units.",
        },
        Rajdhiraj: {
          hours: 450,
          aircraft: [ 'B789', 'B787-10' ],
          color: 0x3498DB,
          flavor: [
            "450 hours in and you're getting dreamliners??\nthis is not a drill",
            "you went from \"can i fly\" to \"watch me fly\"\ncharacter development is real",
            "the 787 is basically a spaceship with wings\nand now it's yours congrats",
          ],
          aircraftLine: "dreamliners. the name says it all.",
        },
        Rajvanshi: {
          hours: 160,
          aircraft: [ 'B767', 'B757', 'A333', 'A339', 'B788' ],
          color: 0x2ECC71,
          flavor: [
            "yo you actually did it\nyou went from regional puddle jumper to flying ACTUAL widebodies",
            "160 hours and suddenly you're trusted with widebodies\nwhat could go wrong",
            "ok this is where it gets real\nwelcome to the big leagues fr",
          ],
          aircraftLine: "widebodies. WIDEBODIES. you're not in kansas anymore.",
        },
        Rajkumar: {
          hours: 80,
          aircraft: [ 'B38M', 'B737 series', 'A321 series' ],
          color: 0x1ABC9C,
          flavor: [
            "baby's first promotion!!\nwe're literally so proud rn",
            "80 hours in and you already leveled up\nspeedrunning this tbh",
            "you graduated from prop planes\nthe 737 awaits (try not to overrun the runway)",
          ],
          aircraftLine: "narrowbodies that actually go places. welcome up.",
        },
      };

      // Parse current flight time interval (e.g. "160:00:00" or "80:30:00")
      const currentParts = (currentUser?.flightTime || '00:00:00').split(':').map(Number);
      const currentTotalHours = currentParts[ 0 ] + currentParts[ 1 ] / 60;
      const newTotalHours = currentTotalHours + adjustedFlightTimeMinutes / 60;

      const rankAfter = Object.entries(rankData)
        .find(([ , d ]) => newTotalHours >= d.hours)?.[ 0 ] || 'Yuvraj';

      // If rank changed, update Discord role and DM the user
      if (rankBefore && rankBefore !== rankAfter && currentUser?.discordId) {
        try {
          const botToken = process.env.DISCORD_BOT_TOKEN;
          const discordId = currentUser.discordId.toString();

          if (botToken) {
            const headers = { Authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' };
            const guildId = '1246895842581938276';

            // Fetch guild roles and find IDs by name
            const rolesRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
              headers, signal: AbortSignal.timeout(5000),
            });
            const guildRoles = await rolesRes.json();

            const oldRoleId = guildRoles.find(r => r.name === rankBefore)?.id;
            const newRoleId = guildRoles.find(r => r.name === rankAfter)?.id;

            if (oldRoleId && newRoleId) {
              await Promise.all([
                fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordId}/roles/${oldRoleId}`, {
                  method: 'DELETE', headers, signal: AbortSignal.timeout(5000),
                }),
                fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordId}/roles/${newRoleId}`, {
                  method: 'PUT', headers, signal: AbortSignal.timeout(5000),
                }),
              ]);
            }

            // Send promotion DM to the user
            const rank = rankData[ rankAfter ];
            const flavor = rank.flavor[ Math.floor(Math.random() * rank.flavor.length) ];
            const aircraftCodes = rank.aircraft.map(a => `\`${a}\``).join(' ');

            const descriptionParts = [
              `## \u2726 RANK UP \u2726`,
              ``,
              `yo <@${discordId}> `,
              ``,
              flavor,
              ``,
              `-# we didn't think you'd make it tbh`,
              ``,
              `**${rankAfter.toUpperCase()}** \u2705`,
              ``,
              `### \uD83D\uDD13 new toys`,
              ``,
              `>>> ${aircraftCodes}`,
              `-# ${rank.aircraftLine}`,
              `-# no you can't crash them`,
            ];

            if (rank.club) {
              descriptionParts.push(
                ``,
                `### \uD83D\uDC51 HOLD ON`,
                ``,
                rank.club.line,
              );
            }

            descriptionParts.push(
              ``,
              `**${Math.floor(newTotalHours)}hrs** on the clock \u23F1\uFE0F`,
              ``,
              `-# this message will self destruct (it won't)`,
            );

            const dmEmbed = {
              description: descriptionParts.join('\n'),
              color: rank.color,
              timestamp: new Date().toISOString(),
            };

            const dmComponents = [
              {
                type: 1,
                components: [
                  { type: 2, style: 5, label: '\uD83D\uDCCA see who\'s behind you', url: 'https://www.indianvirtual.site/crew/community/leaderboard' },
                  { type: 2, style: 5, label: '\uD83D\uDEE9\uFE0F check your fleet', url: `https://www.indianvirtual.site/ranks#${rankAfter}` },
                ],
              },
            ];

            const dmChannelRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
              method: 'POST', headers,
              body: JSON.stringify({ recipient_id: discordId }),
              signal: AbortSignal.timeout(5000),
            });
            const dmChannel = await dmChannelRes.json();

            if (dmChannel.id) {
              await fetch(`https://discord.com/api/v10/channels/${dmChannel.id}/messages`, {
                method: 'POST', headers,
                body: JSON.stringify({ embeds: [ dmEmbed ], components: dmComponents }),
                signal: AbortSignal.timeout(5000),
              });
            }
          }
        } catch (roleErr) {
          console.error('Failed to update Discord role or send DM:', roleErr);
        }
      }

      return NextResponse.json({
        message: 'PIREP approved successfully',
        pirepId,
        flightTimeAdded: `${adjustedFlightTimeMinutes} minutes`,
        ...(rankBefore !== rankAfter && { rankPromotion: { from: rankBefore, to: rankAfter } })
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
