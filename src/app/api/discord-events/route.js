import { NextResponse } from 'next/server'

const GUILD_ID = process.env.DISCORD_GUILD_ID
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN

// 5-minute cache — events change more often than monthly stats
const cache = { data: null, expiresAt: 0 }
const CACHE_TTL = 5 * 60 * 1000

export async function GET() {
    if (cache.data && Date.now() < cache.expiresAt) {
        return NextResponse.json(cache.data)
    }

    try {
        const res = await fetch(
            `https://discord.com/api/v10/guilds/${GUILD_ID}/scheduled-events?with_user_count=true`,
            { headers: { Authorization: `Bot ${BOT_TOKEN}` } }
        )

        if (!res.ok) {
            return NextResponse.json({ error: 'Discord API error' }, { status: res.status })
        }

        const all = await res.json()
        const events = all
            .filter(e => e.status === 1 || e.status === 2) // scheduled or live only
            .sort((a, b) => new Date(a.scheduled_start_time) - new Date(b.scheduled_start_time))

        cache.data = events
        cache.expiresAt = Date.now() + CACHE_TTL

        return NextResponse.json(events)
    } catch (error) {
        console.error('Discord events fetch error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
