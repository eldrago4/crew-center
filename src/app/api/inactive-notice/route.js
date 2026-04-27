import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import db from '@/db/client'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request) {
  const session = await auth()
  if (!session?.user?.permissions?.includes('staff')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { callsign } = await request.json()
    if (!callsign) {
      return NextResponse.json({ error: 'Missing callsign' }, { status: 400 })
    }

    const result = await db
      .select({ discordId: users.discordId, lastActive: users.lastActive })
      .from(users)
      .where(eq(users.id, callsign))
      .limit(1)

    if (result.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { discordId, lastActive } = result[0]
    if (!discordId) {
      return NextResponse.json({ error: 'User has no linked Discord account' }, { status: 422 })
    }

    const botApiUrl = process.env.BOT_API_URL
    const botApiKey = process.env.BOT_API_KEY
    if (!botApiUrl || !botApiKey) {
      return NextResponse.json({ error: 'Bot API not configured' }, { status: 503 })
    }

    const botRes = await fetch(`${botApiUrl}/inactive-notice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${botApiKey}`,
      },
      body: JSON.stringify({
        discord_id: discordId.toString(),
        callsign,
        last_active: lastActive
          ? new Date(lastActive).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
          : null,
      }),
      signal: AbortSignal.timeout(10000),
    })

    const botData = await botRes.json()
    if (!botRes.ok) {
      return NextResponse.json({ error: botData.error || 'Bot request failed' }, { status: botRes.status })
    }

    return NextResponse.json({ message: `Inactive notice sent to ${callsign}` })
  } catch (error) {
    console.error('Error sending inactive notice:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
