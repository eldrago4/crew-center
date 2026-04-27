import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import db from '@/db/client'
import { users } from '@/db/schema'
import { sql } from 'drizzle-orm'

export async function POST() {
  const session = await auth()
  if (!session?.user?.permissions?.includes('admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const inactiveUsers = await db
      .select({ id: users.id, discordId: users.discordId, lastActive: users.lastActive })
      .from(users)
      .where(sql`${users.discordId} IS NOT NULL AND ${users.lastActive} < ${thirtyDaysAgo.toISOString()}`)

    if (inactiveUsers.length === 0) {
      return NextResponse.json({ message: 'No inactive users found', results: { dm: 0, tagged: 0, failed: 0 } })
    }

    const botApiUrl = process.env.BOT_API_URL
    const botApiKey = process.env.BOT_API_KEY
    if (!botApiUrl || !botApiKey) {
      return NextResponse.json({ error: 'Bot API not configured' }, { status: 503 })
    }

    const payload = inactiveUsers.map(u => ({
      discord_id: u.discordId.toString(),
      callsign: u.id,
      last_active: u.lastActive
        ? new Date(u.lastActive).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : null,
    }))

    const botRes = await fetch(`${botApiUrl}/inactive-notice-all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${botApiKey}`,
      },
      body: JSON.stringify({ users: payload }),
      signal: AbortSignal.timeout(60000),
    })

    const botData = await botRes.json()
    if (!botRes.ok) {
      return NextResponse.json({ error: botData.error || 'Bot request failed' }, { status: botRes.status })
    }

    return NextResponse.json({
      message: `Processed ${inactiveUsers.length} inactive users`,
      results: botData.results,
    })
  } catch (error) {
    console.error('Error sending bulk inactive notices:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
