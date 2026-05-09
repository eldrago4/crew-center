import { NextResponse } from 'next/server'
import { auth } from '@/auth'

const GUILD_ID = process.env.DISCORD_GUILD_ID
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN

// Round role colors (match the client ROUND_COLORS array)
const ROUND_COLORS = [0x22c55e, 0x3b82f6, 0xeab308, 0xec4899, 0xa855f7]

async function getGuildRoles() {
  const res = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/roles`, {
    headers: { Authorization: `Bot ${BOT_TOKEN}` },
  })
  if (!res.ok) throw new Error(`Failed to fetch guild roles: ${res.status}`)
  return res.json()
}

async function createRole(name, color) {
  const res = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/roles`, {
    method: 'POST',
    headers: { Authorization: `Bot ${BOT_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, color: color ?? 0, permissions: '0', hoist: false, mentionable: true }),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Failed to create role "${name}": ${res.status} ${txt.slice(0, 100)}`)
  }
  return (await res.json()).id
}

async function getOrCreateRole(existingRoles, name, color) {
  const found = existingRoles.find(r => r.name === name)
  if (found) return { id: found.id, created: false }
  const id = await createRole(name, color)
  return { id, created: true }
}

async function assignRole(discordId, roleId) {
  const attempt = async () => {
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}/roles/${roleId}`,
      { method: 'PUT', headers: { Authorization: `Bot ${BOT_TOKEN}`, 'Content-Length': '0' } }
    )
    if (res.status === 204 || res.status === 200) return
    if (res.status === 429) {
      const data = await res.json().catch(() => ({}))
      await new Promise(r => setTimeout(r, ((data.retry_after ?? 1) * 1000) + 200))
      // one retry
      const r2 = await fetch(
        `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}/roles/${roleId}`,
        { method: 'PUT', headers: { Authorization: `Bot ${BOT_TOKEN}`, 'Content-Length': '0' } }
      )
      if (r2.status === 204 || r2.status === 200) return
      throw new Error(`Rate-limit retry failed (${r2.status})`)
    }
    const txt = await res.text()
    throw new Error(`Assign role failed (${res.status}): ${txt.slice(0, 80)}`)
  }
  return attempt()
}

// Run tasks with a concurrency cap
async function withConcurrency(fns, limit = 5) {
  const results = new Array(fns.length)
  let idx = 0
  const workers = Array.from({ length: Math.min(limit, fns.length) }, async () => {
    while (idx < fns.length) {
      const i = idx++
      results[i] = await fns[i]().then(
        v => ({ status: 'fulfilled', value: v }),
        e => ({ status: 'rejected', reason: e })
      )
    }
  })
  await Promise.all(workers)
  return results
}

export async function POST(request) {
  const session = await auth()
  if (!session?.user?.permissions?.includes('staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { eventTitle, attendees, roundByDiscordId = {}, roundCount = 0 } = await request.json()

  if (!eventTitle || !attendees?.length) {
    return NextResponse.json({ error: 'eventTitle and attendees are required' }, { status: 400 })
  }

  const safeTitle = eventTitle.slice(0, 100)
  const rounds = Math.max(0, Math.min(5, Number(roundCount) || 0))

  // Fetch current guild roles once
  const existingRoles = await getGuildRoles()

  // Create / find event role + round roles in parallel
  const [eventRoleResult, ...roundRoleResults] = await Promise.all([
    getOrCreateRole(existingRoles, safeTitle, 0x6366f1),
    ...Array.from({ length: rounds }, (_, i) =>
      getOrCreateRole(existingRoles, `R${i + 1}`, ROUND_COLORS[i % ROUND_COLORS.length])
    ),
  ])

  const rolesCreated = []
  if (eventRoleResult.created) rolesCreated.push(safeTitle)
  roundRoleResults.forEach((r, i) => { if (r.created) rolesCreated.push(`R${i + 1}`) })

  const roundRoleIds = roundRoleResults.map(r => r.id)

  // Build one assignment task per (attendee × role)
  const tasks = attendees.flatMap(({ discordId }) => {
    const fns = [() => assignRole(discordId, eventRoleResult.id)]
    const round = roundByDiscordId[discordId]
    if (rounds > 0 && round && roundRoleIds[round - 1]) {
      fns.push(() => assignRole(discordId, roundRoleIds[round - 1]))
    }
    return fns
  })

  const results = await withConcurrency(tasks, 5)

  const failed = []
  let assigned = 0
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      assigned++
    } else {
      // Map task index back to discordId (each attendee has 1 or 2 tasks)
      let taskIdx = 0
      for (const { discordId } of attendees) {
        const hasRound = rounds > 0 && roundByDiscordId[discordId] && roundRoleIds[roundByDiscordId[discordId] - 1]
        const taskCount = hasRound ? 2 : 1
        if (i >= taskIdx && i < taskIdx + taskCount) {
          failed.push({ discordId, error: r.reason?.message })
          break
        }
        taskIdx += taskCount
      }
    }
  })

  return NextResponse.json({ assigned, rolesCreated, failed })
}
