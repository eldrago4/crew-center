import db from '@/db/client';
import { notams } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
    try {
        // Get count of NOTAMs in table
        const countResult = await db.select({ count: sql`count(*)` }).from(notams);
        const notamCount = countResult[ 0 ]?.count || 0;

        // Fetch all NOTAMs ordered by issued date (newest first)
        const allNotams = await db.select().from(notams).orderBy(notams.issued);

        return Response.json({
            data: allNotams,
            count: notamCount,
            cached: notamCount > 0 // Simple cache indicator based on count
        });
    } catch (error) {
        console.error('Error fetching NOTAMs:', error);
        return Response.json({ error: 'Failed to fetch NOTAMs' }, { status: 500 });
    }
}
