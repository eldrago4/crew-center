import { NextResponse } from 'next/server'
import db from '@/db/client.js'
import { users } from '@/db/schema'
import { inArray } from 'drizzle-orm'

const GUILD_ID = process.env.DISCORD_GUILD_ID
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const discordEventId = searchParams.get('discordEventId')

  if (!discordEventId) {
    return NextResponse.json({ error: 'discordEventId is required' }, { status: 400 })
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
    return NextResponse.json({ attendees: [] })
  }

  // Match against crew DB by discordId
  const discordIds = rawAttendees.map(a => BigInt(a.user.id))
  const crewRows = await db.select({ discordId: users.discordId, ifcName: users.ifcName })
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
    }
  })

  return NextResponse.json({ attendees })
}
