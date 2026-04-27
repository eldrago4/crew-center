import { NextResponse } from 'next/server';
import db from '@/db/client';
import { users } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

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
        await redis.set('leaderboard:top10', JSON.stringify(topPilots), { ex: 86400 });

        return NextResponse.json({
            success: true,
            message: 'Leaderboard updated successfully',
            count: topPilots.length
        });
    } catch (error) {
        console.error('Error updating leaderboard:', error);
        return NextResponse.json(
            { error: 'Failed to update leaderboard' },
            { status: 500 }
        );
    }
}
