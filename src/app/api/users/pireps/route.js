import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import db from "@/db/client";
import { pireps, users } from "@/db/schema";
import { eq, sql, isNull, ilike } from "drizzle-orm";
import { requireUser, requireStaff, isStaff } from "@/lib/apiAuth";
import { matchTrailCode, TRAIL_MULTIPLIER } from "@/app/shared/trails";

// Lazily constructed and memoized across warm invocations. Built inside the guarded
// helper (never at module scope) so that a missing/invalid Upstash env can't throw at
// import time and take PIREP submission down with it.
let _redis = null;
function getRedis() {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return _redis;
}

// Credits a Maharaja Trail leg when a pilot's comments contain a trail code.
// Progress is a Redis SET of PIREP ids per pilot+trail, which gives us two guarantees
// for free: SADD dedupes (re-filing the same PIREP can't double-count), and we stop
// adding once the set reaches the trail's leg count — so the multiplier can never be
// claimed more times than the trail has legs. Costs 1 command when the trail is already
// complete, 2 otherwise, and 0 when there's no code. Never throws: on any failure it
// returns null and the PIREP submission carries on untouched.
async function creditTrailLeg({ comments, userId, pirepId }) {
  const trail = matchTrailCode(comments);
  if (!trail) return null;
  try {
    const redis = getRedis();
    const key = `trail:${trail.slug}:${userId}`;
    const current = await redis.scard(key);
    if (current >= trail.legs) {
      return { slug: trail.slug, code: trail.code, name: trail.name, completed: trail.legs, total: trail.legs, newLeg: false, complete: true };
    }
    const added = await redis.sadd(key, String(pirepId));
    const completed = Math.min(current + (added ? 1 : 0), trail.legs);
    return { slug: trail.slug, code: trail.code, name: trail.name, completed, total: trail.legs, newLeg: added === 1, complete: completed >= trail.legs };
  } catch (err) {
    console.error("Trail leg credit failed (non-fatal):", err);
    return null;
  }
}

// Columns returned for the personal-logbook path. Explicit list instead of
// `select()` so we never ship every column (e.g. large free-text) of ~17k rows.
const PIREP_COLUMNS = {
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
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");
    const valid = searchParams.get("valid");
    const name = searchParams.get("name");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

    let query, countQuery;

    // Check if we should include user data (only when valid param is provided and no userId)
    const includeUserData = !userId && valid !== null && valid !== undefined;

    // Auth: this route was open to the world (it imports requireUser/requireStaff but
    // only used them in POST), letting anyone page the entire ~17k-row PIREP table.
    // The cross-user admin view (includeUserData → joins ifcName across all pilots)
    // requires staff; the personal logbook requires any signed-in pilot.
    const { error } = includeUserData ? await requireStaff() : await requireUser();
    if (error) return error;

    if (includeUserData) {
      // Include user data when only valid param is passed
      query = db
        .select({
          ...PIREP_COLUMNS,
          user: {
            id: users.id,
            ifcName: users.ifcName,
            rank: users.rank,
          },
        })
        .from(pireps)
        .leftJoin(users, eq(pireps.userId, users.id));

      countQuery = db
        .select({ count: sql`count(*)` })
        .from(pireps)
        .leftJoin(users, eq(pireps.userId, users.id));
    } else {
      // Standard query without user data — explicit columns, not select()
      query = db.select(PIREP_COLUMNS).from(pireps);
      countQuery = db.select({ count: sql`count(*)` }).from(pireps);
    }

    // Build where conditions
    const conditions = [];

    if (userId) {
      conditions.push(eq(pireps.userId, userId));
    }

    if (name && includeUserData) {
      conditions.push(ilike(users.ifcName, `%${name}%`));
    }

    if (valid !== null && valid !== undefined) {
      if (valid === "true") {
        conditions.push(eq(pireps.valid, true));
      } else if (valid === "false") {
        conditions.push(eq(pireps.valid, false));
      } else if (valid === "null") {
        conditions.push(isNull(pireps.valid));
      }
    }

    // Apply conditions if any
    if (conditions.length > 0) {
      let whereClause = conditions[ 0 ];
      for (let i = 1; i < conditions.length; i++) {
        whereClause = sql`${whereClause} AND ${conditions[ i ]}`;
      }

      query = query.where(whereClause);
      countQuery = countQuery.where(whereClause);
    }

    const pageQuery = query
      .orderBy(sql`${pireps.updatedAt} DESC`)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    // Run the count and the page query in parallel instead of serially (they're
    // independent). The clients depend on `total` on every page, so we can't skip it
    // without changing them — but `private, max-age=60` lets the browser serve
    // back/forward pagination from its own cache, so repeated page turns don't
    // re-invoke the function at all.
    const [ pirepList, countResult ] = await Promise.all([ pageQuery, countQuery ]);
    const total = Number(countResult[ 0 ]?.count || 0);

    return NextResponse.json(
      {
        data: pirepList,
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      { headers: { "Cache-Control": "private, max-age=60" } },
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { session, error } = await requireUser();
    if (error) return error;
    const staff = isStaff(session);

    const body = await request.json();

    // Destructure required fields and optional fields
    const {
      flightNumber,
      date, // This should be a string in 'YYYY-MM-DD HH:MM:SS.ms' format
      flightTime, // This should be a string in 'HH:MM:SS' format
      departureIcao,
      arrivalIcao,
      aircraft,
      operator = "Indian Virtual", // Default value as per schema
      multiplier, // Optional
      comments = "", // Default to empty string if not provided
    } = body;

    // Identity and approval are derived server-side: a normal pilot can only
    // file a PENDING PIREP for themselves. Only staff may file on behalf of
    // another callsign or pre-approve (valid=true) — otherwise a user could
    // self-approve arbitrary flight time and self-promote their rank.
    const userId = staff ? body.userId : session.user.callsign;
    const valid = staff ? (body.valid ?? null) : null;

    // Basic validation for required fields
    // Accept empty strings as present for IFATC
    const requiredFields = [
      flightNumber,
      date,
      flightTime,
      departureIcao,
      arrivalIcao,
      aircraft,
      userId,
    ];
    if (requiredFields.some((f) => f === undefined || f === null)) {
      return NextResponse.json(
        {
          error:
            "Missing required PIREP fields: flightNumber, date, flightTime, departureIcao, arrivalIcao, aircraft, userId",
        },
        { status: 400 },
      );
    }

    // Prepare the PIREP data for insertion
    const newPirepData = {
      flightNumber,
      date: new Date(date).toISOString().split("T")[ 0 ], // Ensure date is in a format Drizzle expects for timestamp
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

    const insertedPireps = await db
      .insert(pireps)
      .values(newPirepData)
      .returning();

    if (insertedPireps.length === 0) {
      throw new Error("Failed to insert PIREP: No record returned.");
    }

    await db
      .update(users)
      .set({ lastActive: new Date().toISOString() })
      .where(eq(users.id, userId));

    // If the comments reference a Maharaja Trail code, credit a leg (deduped + capped).
    // Fully isolated: a Redis hiccup here must never fail an otherwise-valid PIREP.
    let trailResult = null;
    try {
      const p = insertedPireps[ 0 ];
      trailResult = await creditTrailLeg({
        comments: p.comments,
        userId: p.userId,
        pirepId: p.pirepId,
      });
      // Only a leg that actually counted (within the cap, not a duplicate) earns the
      // trail bonus — so the multiplier can never be farmed past the trail's leg count.
      // We take the max with any multiplier already on the PIREP so a higher event
      // multiplier is never downgraded.
      if (trailResult?.newLeg) {
        const currentMult = p.multiplier ? parseFloat(p.multiplier) : 1;
        const appliedMult = Math.max(currentMult, TRAIL_MULTIPLIER);
        if (appliedMult > currentMult) {
          await db
            .update(pireps)
            .set({ multiplier: String(appliedMult) })
            .where(eq(pireps.pirepId, p.pirepId));
          p.multiplier = String(appliedMult);
        }
        trailResult.multiplier = appliedMult;
        trailResult.multiplierApplied = appliedMult > currentMult;
      }
    } catch (trailErr) {
      console.error("Trail crediting error (non-fatal):", trailErr);
    }

    // Send Discord webhook (awaited so serverless runtime doesn't kill it)
    try {
      const inserted = insertedPireps[ 0 ];

      let userData = null;
      try {
        const u = await db
          .select({ id: users.id, ifcName: users.ifcName, rank: users.rank })
          .from(users)
          .where(eq(users.id, inserted.userId));
        if (u && u.length > 0) userData = u[ 0 ];
      } catch (uErr) {
        console.warn("Could not fetch user data for PIREP webhook:", uErr);
        userData = null;
      }



      const CODESHARE_EMOJI_BASE = "/codeshare-emojis";
      const CODESHARE_EMOJI_FILES = {
        "6E": "6E.png",
        "9W": "9W.png",
        AC: "AC.png",
        AI: "AI.png",
        AIH: "AIH.png",
        AV: "AV.png",
        AZ: "AZ.png",
        BR: "BR.png",
        BW: "BW.png",
        CI: "CI.png",
        CM: "CM.png",
        CX: "CX.png",
        EK: "EK.png",
        ET: "ET.png",
        EY: "EY.png",
        FI: "FI.png",
        FR: "FR.png",
        GA: "GA.png",
        HU: "HU.png",
        // IFATC sessions file under flightNumber "IFATC". Mapping it here gives their
        // embeds the IFATC badge thumbnail, the same way codeshare flights get an
        // airline badge. Safe as a startsWith() prefix — no real callsign begins "IFATC".
        IFATC: "IFATC.png",
        IX: "IX.png",
        KE: "KE.png",
        KQ: "KQ.png",
        LH: "LH.png",
        LO: "LO.png",
        LX: "LX.png",
        MK: "MK.png",
        MS: "MS.png",
        NH: "NH.png",
        OD: "OD-ID-SL-JT.png",
        ID: "OD-ID-SL-JT.png",
        SL: "OD-ID-SL-JT.png",
        JT: "OD-ID-SL-JT.png",
        QF: "QF.png",
        QR: "QF.png",
        SA: "SA.png",
        SN: "SN.png",
        SQ: "SQ.png",
        SV: "SV.png",
        TG: "TG.png",
        TK: "TK.png",
        TP: "TP.png",
        U2: "U2.png",
        UA: "UA.png",
        UK: "UK.png",
        VN: "VN.png",
      };

      const CODESHARE_PREFIXES = Object.keys(CODESHARE_EMOJI_FILES).sort(
        (a, b) => b.length - a.length,
      );

      const normalizedFlightNumber = String(inserted.flightNumber || "")
        .toUpperCase()
        .replace(/[\s-]/g, "");
      const prefix = CODESHARE_PREFIXES.find((code) =>
        normalizedFlightNumber.startsWith(code),
      );
      const fileName = prefix ? CODESHARE_EMOJI_FILES[ prefix ] : null;
      const thumbnailUrl = fileName
        ? `${process.env.NEXT_PUBLIC_APP_URL || "https://indianvirtual.com"}${CODESHARE_EMOJI_BASE}/${fileName}`
        : null;


      const flightNumberNormalized = String(inserted.flightNumber || "")
        .toUpperCase()
        .trim();
      const isIFATC =
        flightNumberNormalized === "IFATC" ||
        flightNumberNormalized.startsWith("IFATC");

      const fields = isIFATC
        ? [
          {
            name: "Controlled Hub",
            value: inserted.departureIcao || "N/A",
            inline: false,
          },
          {
            name: "Duty Time",
            value: inserted.flightTime || "—",
            inline: false,
          },
          {
            name: "Controller",
            value: userData
              ? `${userData.ifcName} (\`${userData.id}\`)`
              : `<@${inserted.userId}>`,
            inline: false,
          },
          {
            name: "ATC Comments",
            value: inserted.comments || "—",
            inline: false,
          },
        ]
        : [
          {
            name: "Flight Number",
            value: inserted.flightNumber || "—",
            inline: false,
          },
          {
            name: "Pilot",
            value: userData
              ? `${userData.ifcName} (\`${userData.id}\`)`
              : `<@${inserted.userId}>`,
            inline: false,
          },
          {
            name: "Route",
            value: `**${inserted.departureIcao || "N/A"}** ➔ **${inserted.arrivalIcao || "N/A"}**`,
            inline: true,
          },
          {
            name: "Flight Time",
            value: inserted.flightTime || "—",
            inline: true,
          },
          {
            name: "Pilot Comments",
            value: inserted.comments || "—",
            inline: false,
          },
        ];

      // Surface trail progress right on the PIREP embed when a leg was referenced.
      if (trailResult && !isIFATC) {
        const suffix = trailResult.complete
          ? " · ✅ Trail complete"
          : trailResult.newLeg
            ? ""
            : " · already counted";
        const multLine = trailResult.newLeg ? `\n${trailResult.multiplier}× multiplier applied` : "";
        fields.push({
          name: "🛤️ Maharaja Trail",
          value: `**${trailResult.name}** \`${trailResult.code}\`\nLeg ${trailResult.completed}/${trailResult.total}${suffix}${multLine}`,
          inline: false,
        });
      }

      // Embed accent: green for IFATC sessions, deep plum ONLY when the PIREP was
      // recognised as a Maharaja Trail leg (trail code in comments), teal for every
      // ordinary flight PIREP.
      const embedColor = isIFATC
        ? 0x2ecc71
        : trailResult
          ? 0x511d4b
          : 0x1abc9c;

      const embed = {
        title: `PIREP #${inserted.pirepId}`,
        description: isIFATC
          ? "**IFATC PIREP**"
          : null,
        color: embedColor,
        fields,
        timestamp: new Date(inserted.updatedAt || Date.now()).toISOString(),
      };

      // Embed thumbnails for Discord Incoming Webhooks:
      // Incoming webhooks support `thumbnail` on the embed object.
      // Ensure it is set correctly inside the `embed` object (NOT inside POST fn). 
      if (thumbnailUrl) {
        embed.thumbnail = { url: thumbnailUrl };
      }

      // Discord webhook buttons require Message Components (type 1 = ActionRow, type 2 = Button)
      // https://discord.com/developers/docs/interactions/message-components#buttons
      const components = [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: "Copy PIREP",
              url: `https://indianvirtual.com/crew/pireps/file?flightNumber=${encodeURI(inserted.flightNumber)}&departureIcao=${encodeURI(inserted.departureIcao)}&arrivalIcao=${encodeURI(inserted.arrivalIcao)}&aircraft=${encodeURI(inserted.aircraft)}`,
            },
          ],
        },
      ];


      const webhookUrl = process.env.DISCORD_PIREP_WEBHOOK_URL;
      if (!webhookUrl) {
        console.warn("PIREP webhook skipped: DISCORD_PIREP_WEBHOOK_URL is not set");
      } else {
        // Discord Incoming Webhooks payload
        // https://discord.com/developers/docs/resources/webhook#execute-webhook
        // Build payload exactly per Incoming Webhook docs.
        // Components are NOT supported for Incoming Webhooks; to avoid 400s, omit them.
        const payload = { embeds: [ embed ] };
        try {
          const res = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(5000),
          });
          if (!res.ok) {
            const text = await res.text().catch(() => "");
            // Log full payload to diagnose Discord's "embeds": ["0"] errors
            console.error("PIREP webhook failed:", {
              status: res.status,
              text,
              payload,
            });
          }
        } catch (hookErr) {
          console.error("PIREP webhook request error:", hookErr, { payload });
        }
      }
    } catch (err) {
      console.error("Failed to send PIREP webhook:", err);
    }

    return NextResponse.json(
      { message: "PIREP submitted successfully", pirep: insertedPireps[ 0 ], trail: trailResult || undefined },
      { status: 201 }, // 201 Created status
    );
  } catch (error) {
    console.error("Error submitting PIREP:", error);
    return NextResponse.json(
      { error: "Failed to submit PIREP", details: error.message },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  try {
    const { error } = await requireStaff();
    if (error) return error;

    const body = await request.json();
    const { pirepId, action, adminComments } = body;

    if (!pirepId || !action) {
      return NextResponse.json(
        { error: "Missing required fields: pirepId and action" },
        { status: 400 },
      );
    }

    if (![ "approve", "reject" ].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be either "approve" or "reject"' },
        { status: 400 },
      );
    }

    // Get the pirep details
    const pirepResult = await db
      .select()
      .from(pireps)
      .where(eq(pireps.pirepId, pirepId));

    if (pirepResult.length === 0) {
      return NextResponse.json({ error: "PIREP not found" }, { status: 404 });
    }

    const pirep = pirepResult[ 0 ];

    if (action === "approve") {
      // Fetch user's current flight time and discord ID
      const userResult = await db
        .select({
          flightTime: users.flightTime,
          discordId: users.discordId,
          rank: users.rank,
        })
        .from(users)
        .where(eq(users.id, pirep.userId));
      const currentUser = userResult[ 0 ];
      const rankBefore = currentUser?.rank;

      // Update pirep to set valid = true
      await db
        .update(pireps)
        .set({
          valid: true,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(pireps.pirepId, pirepId));

      // Calculate flight time in minutes and add to user's flight time
      const flightTimeStr = pirep.flightTime; // Format: "HH:MM:SS"
      const [ hours, minutes, seconds ] = flightTimeStr.split(":").map(Number);
      const flightTimeMinutes = hours * 60 + minutes;

      // Apply multiplier if available
      const multiplier = pirep.multiplier ? parseFloat(pirep.multiplier) : 1;
      const adjustedFlightTimeMinutes = flightTimeMinutes * multiplier;

      // Update user's flight time
      await db
        .update(users)
        .set({
          flightTime: sql`"flightTime" + ${adjustedFlightTimeMinutes} * INTERVAL '1 minute'`,
        })
        .where(eq(users.id, pirep.userId));

      // Compute new rank locally from current flight time + added time
      const rankThresholds = {
        Chhatrapati: 2000,
        Samrat: 1500,
        Maharaja: 900,
        Rajdhiraj: 450,
        Rajvanshi: 160,
        Rajkumar: 80,
      };

      const currentParts = (currentUser?.flightTime || "00:00:00")
        .split(":")
        .map(Number);
      const currentTotalHours = currentParts[ 0 ] + currentParts[ 1 ] / 60;
      const newTotalHours = currentTotalHours + adjustedFlightTimeMinutes / 60;

      const rankAfter =
        Object.entries(rankThresholds).find(
          ([ , hours ]) => newTotalHours >= hours,
        )?.[ 0 ] || "Yuvraj";

      // If rank changed, notify the bot to handle Discord role swap + DM
      if (rankBefore && rankBefore !== rankAfter && currentUser?.discordId) {
        try {
          const botApiUrl = process.env.BOT_API_URL;
          const botApiKey = process.env.BOT_API_KEY;

          if (botApiUrl && botApiKey) {
            await fetch(`${botApiUrl}/rank-up`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${botApiKey}`,
              },
              body: JSON.stringify({
                discord_id: currentUser.discordId.toString(),
                old_rank: rankBefore,
                new_rank: rankAfter,
                total_hours: Math.floor(newTotalHours),
              }),
              signal: AbortSignal.timeout(10000),
            });
          }
        } catch (botErr) {
          console.error("Failed to notify bot for rank promotion:", botErr);
        }
      }

      return NextResponse.json({
        message: "PIREP approved successfully",
        pirepId,
        flightTimeAdded: `${adjustedFlightTimeMinutes} minutes`,
        ...(rankBefore !== rankAfter && {
          rankPromotion: { from: rankBefore, to: rankAfter },
        }),
      });
    } else if (action === "reject") {
      // Fetch user info before updating
      const userResult = await db
        .select({ discordId: users.discordId, ifcName: users.ifcName })
        .from(users)
        .where(eq(users.id, pirep.userId));
      const rejectUser = userResult[ 0 ];

      // Check current valid status to determine if we need to deduct flight time
      let flightTimeDeducted = null;

      if (pirep.valid === true) {
        // Calculate flight time in minutes and deduct from user's flight time
        const flightTimeStr = pirep.flightTime; // Format: "HH:MM:SS"
        const [ hours, minutes, seconds ] = flightTimeStr.split(":").map(Number);
        const flightTimeMinutes = hours * 60 + minutes;

        // Apply multiplier if available
        const multiplier = pirep.multiplier ? parseFloat(pirep.multiplier) : 1;
        const adjustedFlightTimeMinutes = flightTimeMinutes * multiplier;

        // Update user's flight time (deduct)
        await db
          .update(users)
          .set({
            flightTime: sql`"flightTime" - ${adjustedFlightTimeMinutes} * INTERVAL '1 minute'`,
          })
          .where(eq(users.id, pirep.userId));

        flightTimeDeducted = `${adjustedFlightTimeMinutes} minutes`;
      }

      // Update pirep to set valid = false and add admin comments
      const updateData = {
        valid: false,
        updatedAt: new Date().toISOString(),
      };

      if (adminComments) {
        updateData.adminComments = adminComments;
      }

      await db
        .update(pireps)
        .set(updateData)
        .where(eq(pireps.pirepId, pirepId));

      // DM the pilot via bot
      if (rejectUser?.discordId) {
        try {
          const botApiUrl = process.env.BOT_API_URL;
          const botApiKey = process.env.BOT_API_KEY;

          if (botApiUrl && botApiKey) {
            await fetch(`${botApiUrl}/pirep-rejected`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${botApiKey}`,
              },
              body: JSON.stringify({
                discord_id: rejectUser.discordId.toString(),
                ifc_name: rejectUser.ifcName || "Pilot",
                pirep_id: pirepId,
                flight_number: pirep.flightNumber,
                departure_icao: pirep.departureIcao,
                arrival_icao: pirep.arrivalIcao,
                aircraft: pirep.aircraft,
                date: pirep.date,
                flight_time: pirep.flightTime,
                admin_comments: adminComments || null,
              }),
              signal: AbortSignal.timeout(10000),
            });
          }
        } catch (botErr) {
          console.error("Failed to notify bot for PIREP rejection:", botErr);
        }
      }

      return NextResponse.json({
        message: "PIREP rejected successfully",
        pirepId,
        ...(flightTimeDeducted && { flightTimeDeducted }),
        ...(adminComments && { adminComments }),
      });
    }
  } catch (error) {
    console.error("Error updating PIREP:", error);
    return NextResponse.json(
      { error: "Failed to update PIREP", details: error.message },
      { status: 500 },
    );
  }
}
