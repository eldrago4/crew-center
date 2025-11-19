import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import db from '@/db/client';
import { users } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.callsign) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        // Get user's rank by flightTime
        const userRank = await db
            .select({
                rank: sql`(
                    SELECT COUNT(*) + 1
                    FROM users u2
                    WHERE u2."flightTime" > users."flightTime"
                    OR (u2."flightTime" = users."flightTime" AND u2."id" < users."id")
                )`.as('rank'),
                id: users.id,
                ifcName: users.ifcName,
                flightTime: users.flightTime,
            })
            .from(users)
            .where(sql`${users.id} = ${session.user.callsign}`)
            .execute();

        if (userRank.length === 0) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ userRank: userRank[ 0 ] });
    } catch (error) {
        console.error('Error fetching user rank:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user rank' },
            { status: 500 }
        );
    }
}
