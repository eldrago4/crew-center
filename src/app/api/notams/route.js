import db from '@/db/client';
import { notams } from '@/db/schema';
import { auth } from '@/auth';
import { eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

function isStaff(session) {
    return session?.user?.permissions?.includes('staff');
}

function normalizeNotamPayload(body) {
    const desc = String(body?.desc || '').trim();
    const issued = body?.issued ? new Date(body.issued) : new Date();
    const expiresOnValue = body?.expiresOn ? String(body.expiresOn).trim() : '';
    const expiresOn = expiresOnValue ? new Date(expiresOnValue) : null;

    if (!desc) {
        return { error: 'Notice text is required' };
    }

    if (Number.isNaN(issued.getTime())) {
        return { error: 'Issued date is invalid' };
    }

    if (expiresOn && Number.isNaN(expiresOn.getTime())) {
        return { error: 'Valid until date is invalid' };
    }

    return {
        value: {
            issued: issued.toISOString(),
            desc,
            expiresOn: expiresOn ? expiresOn.toISOString() : null,
        },
    };
}

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
            cached: notamCount > 0 
        });
    } catch (error) {
        console.error('Error fetching NOTAMs:', error);
        return Response.json({ error: 'Failed to fetch NOTAMs' }, { status: 500 });
    }
}

export async function POST(request) {
    const session = await auth();
    if (!isStaff(session)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const parsed = normalizeNotamPayload(body);
        if (parsed.error) {
            return NextResponse.json({ error: parsed.error }, { status: 400 });
        }

        const inserted = await db.insert(notams).values(parsed.value).returning();
        return NextResponse.json(inserted[0], { status: 201 });
    } catch (error) {
        console.error('Error creating NOTAM:', error);
        return NextResponse.json({ error: 'Failed to create NOTAM' }, { status: 500 });
    }
}

export async function PATCH(request) {
    const session = await auth();
    if (!isStaff(session)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const originalIssued = body?.originalIssued;
        if (!originalIssued) {
            return NextResponse.json({ error: 'Original issued date is required' }, { status: 400 });
        }

        const parsed = normalizeNotamPayload(body);
        if (parsed.error) {
            return NextResponse.json({ error: parsed.error }, { status: 400 });
        }

        const updated = await db
            .update(notams)
            .set(parsed.value)
            .where(eq(notams.issued, originalIssued))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'NOTAM not found' }, { status: 404 });
        }

        return NextResponse.json(updated[0]);
    } catch (error) {
        console.error('Error updating NOTAM:', error);
        return NextResponse.json({ error: 'Failed to update NOTAM' }, { status: 500 });
    }
}

export async function DELETE(request) {
    const session = await auth();
    if (!isStaff(session)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { issued } = await request.json();
        if (!issued) {
            return NextResponse.json({ error: 'Issued date is required' }, { status: 400 });
        }

        const deleted = await db
            .delete(notams)
            .where(eq(notams.issued, issued))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: 'NOTAM not found' }, { status: 404 });
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Error deleting NOTAM:', error);
        return NextResponse.json({ error: 'Failed to delete NOTAM' }, { status: 500 });
    }
}

export const dynamic = 'force-dynamic';
