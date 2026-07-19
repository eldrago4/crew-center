import { NextResponse } from 'next/server';
import db from '@/db/client';
import { users } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { Redis } from '@upstash/redis';
import { reconcileLotusMembers } from '@/app/api/chanda/_lotus';

let _redis = null
function getRedis() {
  if (!_redis) _redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
})
  return _redis
}

export async function GET() {
    try {
        // Query top 10 users by flightTime
        const topPilotsRaw = await db
            .select({
                id: users.id,
                ifcName: users.ifcName,
                flightTime: users.flightTime,
                rank: users.rank,
                discordId: users.discordId,
            })
            .from(users)
            .where(sql`${users.flightTime} IS NOT NULL`)
            .orderBy(sql`${users.flightTime} DESC`)
            .limit(10)
            .execute();

        // Convert BigInt discordId to string for JSON serialization
        const topPilots = topPilotsRaw.map(pilot => ({
            ...pilot,
            discordId: pilot.discordId ? pilot.discordId.toString() : null,
        }));

        // Cache in Redis with 24 hour TTL (86400 seconds)
        await getRedis().set('leaderboard:top10', JSON.stringify(topPilots), { ex: 86400 });

        // Lotus reconciliation piggybacks on this daily run rather than taking a cron
        // slot of its own (Hobby allows two, and both are already spoken for). It used
        // to run inside getLotusStatus, i.e. on every dashboard load, which turned a
        // page view into Discord role DELETEs and Redis writes — and had every
        // concurrent viewer racing to perform the same ones. Failures here must not
        // fail the leaderboard, so it is caught separately.
        let lotus = null;
        try {
            const result = await reconcileLotusMembers(getRedis());
            lotus = { active: result.members.length, revoked: result.revoked.length };
        } catch (error) {
            console.error('Error reconciling lotus members:', error);
        }

        return NextResponse.json({
            success: true,
            message: 'Leaderboard updated successfully',
            count: topPilots.length,
            lotus
        });
    } catch (error) {
        console.error('Error updating leaderboard:', error);
        return NextResponse.json(
            { error: 'Failed to update leaderboard' },
            { status: 500 }
        );
    }
}
