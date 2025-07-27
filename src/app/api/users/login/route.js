import { NextResponse } from 'next/server';
import db from '@/db/client';
import { users } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function GET(request) {
    try {
        const rawData = await db
            .select({ callsign: users.id, discordId: users.discordId })
            .from(users)
            .execute();

        const data = rawData.map(user => ({
            callsign: user.callsign,
            discordId: user.discordId != null ? String(user.discordId) : null
        }));

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Error in /api/users/login GET route:', error);
        return NextResponse.json(
            { error: error.message || 'An unknown error occurred while fetching users.' },
            { status: 500 }
        );
    }
}
