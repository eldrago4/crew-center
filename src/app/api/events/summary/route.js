import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import db from '@/db/client.js'
import { crewcenter, users } from '@/db/schema'
import { eq, inArray, sql } from 'drizzle-orm'

const GUILD_ID = process.env.DISCORD_GUILD_ID
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const redis = Redis.fromEnv()
const CACHE_KEY = 'events:summary:v1'
const CACHE_TTL_SECONDS = 180

function extractDiscordEventId(url) {
  if (!url) return null
  const match = url.match(/discord\.com\/events\/\d+\/(\d+)/)
  return match ? match[1] : null
}

async function fetchDiscordEvents() {
  const res = await fetch(
    `https://discord.com/api/v10/guilds/${GUILD_ID}/scheduled-events?with_user_count=true`,
    { headers: { Authorization: `Bot ${BOT_TOKEN}` } }
  )

  if (!res.ok) return []
  const all = await res.json()
  return all
    .filter(event => event.status === 1 || event.status === 2)
    .sort((a, b) => new Date(a.scheduled_start_time) - new Date(b.scheduled_start_time))
}

async function fetchDiscordAttendees(discordEventId) {
  const rawAttendees = []
  let after = null

  while (true) {
    const url = new URL(
      `https://discord.com/api/v10/guilds/${GUILD_ID}/scheduled-events/${discordEventId}/users`
    )
    url.searchParams.set('limit', '100')
    if (after) url.searchParams.set('after', after)

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bot ${BOT_TOKEN}` },
    })

    if (!res.ok) return []

    const batch = await res.json()
    rawAttendees.push(...batch)
    if (batch.length < 100) break
    after = batch[batch.length - 1].user.id
  }

  return rawAttendees
}

async function buildSummary() {
  const [eventsRow, discordEvents] = await Promise.all([
    db.select({ value: crewcenter.value })
      .from(crewcenter)
      .where(eq(crewcenter.module, 'events'))
      .limit(1),
    fetchDiscordEvents(),
  ])

  const events = Array.isArray(eventsRow[0]?.value) ? eventsRow[0].value : []
  events.sort((a, b) => {
    if (a.promoted && !b.promoted) return -1
    if (!a.promoted && b.promoted) return 1
    return new Date(a.pushbackIso || 0) - new Date(b.pushbackIso || 0)
  })

  const discordById = {}
  for (const event of discordEvents) discordById[event.id] = event

  const discordMap = {}
  const eventPairs = []
  for (const event of events) {
    const discordEventId = extractDiscordEventId(event.signupUrl)
    if (!discordEventId) continue
    eventPairs.push({ eventId: event.id, discordEventId })
    if (discordById[discordEventId]) discordMap[event.id] = discordById[discordEventId]
  }

  const attendeeResults = await Promise.all(
    eventPairs.map(async pair => ({
      ...pair,
      rawAttendees: await fetchDiscordAttendees(pair.discordEventId),
    }))
  )

  const allDiscordIds = [
    ...new Set(attendeeResults.flatMap(result => result.rawAttendees.map(a => a.user.id))),
  ]
  const crewByDiscordId = {}
  if (allDiscordIds.length) {
    const crewRows = await db.select({
      discordId: users.discordId,
      ifcName: users.ifcName,
      flightTimeSecs: sql`COALESCE(EXTRACT(EPOCH FROM ${users.flightTime})::int, 0)`.as('flightTimeSecs'),
    })
      .from(users)
      .where(inArray(users.discordId, allDiscordIds.map(id => BigInt(id))))

    for (const row of crewRows) {
      crewByDiscordId[String(row.discordId)] = row
    }
  }

  const attendeesMap = {}
  const attendeesDetailMap = {}
  for (const result of attendeeResults) {
    const attendees = result.rawAttendees.map(a => {
      const crew = crewByDiscordId[a.user.id] || null
      return {
        discordId: a.user.id,
        displayName: a.user.global_name || a.user.username,
        avatarUrl: a.user.avatar
          ? `https://cdn.discordapp.com/avatars/${a.user.id}/${a.user.avatar}.png?size=64`
          : null,
        ifcName: crew?.ifcName ?? null,
        flightTimeSecs: crew?.flightTimeSecs ?? 0,
      }
    })
    attendeesMap[result.eventId] = attendees.map(a => a.discordId)
    attendeesDetailMap[result.eventId] = attendees
  }

  return { events, discordMap, attendeesMap, attendeesDetailMap }
}

export async function GET() {
  try {
    const cached = await redis.get(CACHE_KEY)
    if (cached) {
      return NextResponse.json(typeof cached === 'string' ? JSON.parse(cached) : cached, {
        headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=180' },
      })
    }
  } catch (error) {
    console.warn('Events summary Redis cache read failed:', error)
  }

  try {
    const payload = await buildSummary()
    try {
      await redis.set(CACHE_KEY, payload, { ex: CACHE_TTL_SECONDS })
    } catch (error) {
      console.warn('Events summary Redis cache write failed:', error)
    }

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=180' },
    })
  } catch (error) {
    console.error('Events summary error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
