import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import db from '@/db/client.js'
import { users } from '@/db/schema'
import { inArray, sql } from 'drizzle-orm'

const GUILD_ID = process.env.DISCORD_GUILD_ID
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const redis = Redis.fromEnv()
const CACHE_TTL_SECONDS = 180

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const discordEventId = searchParams.get('discordEventId')

  if (!discordEventId) {
    return NextResponse.json({ error: 'discordEventId is required' }, { status: 400 })
  }

  const cacheKey = `discord:event:${discordEventId}:attendees:v1`
  try {
    const cached = await redis.get(cacheKey)
    if (cached) {
      return NextResponse.json(typeof cached === 'string' ? JSON.parse(cached) : cached, {
        headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=180' },
      })
    }
  } catch (error) {
    console.warn('Discord attendees Redis cache read failed:', error)
  }

  // Fetch all attendees with pagination
  let rawAttendees = []
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

    if (!res.ok) {
      const body = await res.text()
      console.error(`Discord attendees API error ${res.status}:`, body)
      return NextResponse.json({ error: `Discord API ${res.status}`, detail: body }, { status: res.status })
    }

    const batch = await res.json()
    rawAttendees.push(...batch)
    if (batch.length < 100) break
    after = batch[batch.length - 1].user.id
  }

  if (rawAttendees.length === 0) {
    const emptyPayload = { attendees: [] }
    try {
      await redis.set(cacheKey, emptyPayload, { ex: CACHE_TTL_SECONDS })
    } catch (error) {
      console.warn('Discord attendees Redis cache write failed:', error)
    }
    return NextResponse.json(emptyPayload, {
      headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=180' },
    })
  }

  // Match against crew DB by discordId
  const discordIds = rawAttendees.map(a => BigInt(a.user.id))
  const crewRows = await db.select({
    discordId: users.discordId,
    ifcName: users.ifcName,
    flightTimeSecs: sql`COALESCE(EXTRACT(EPOCH FROM ${users.flightTime})::int, 0)`.as('flightTimeSecs'),
  })
    .from(users)
    .where(inArray(users.discordId, discordIds))

  const crewByDiscordId = {}
  for (const row of crewRows) {
    crewByDiscordId[String(row.discordId)] = row
  }

  const attendees = rawAttendees.map(a => {
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

  const payload = { attendees }
  try {
    await redis.set(cacheKey, payload, { ex: CACHE_TTL_SECONDS })
  } catch (error) {
    console.warn('Discord attendees Redis cache write failed:', error)
  }

  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=180' },
  })
}
