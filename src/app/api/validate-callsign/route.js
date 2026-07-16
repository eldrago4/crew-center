import { NextResponse } from 'next/server';
import db from '@/db/client';
import { applicants, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Two callers with opposite needs share this route:
//   - /crew sends a full "INVA136" and reads `valid` as "this crew member exists,
//     let them log in".
//   - /apply sends the three digits and reads `available` as "nobody holds this
//     number yet, safe to claim".
// Input is normalised so either form works, and both answers are returned.
export async function POST(request) {
    try {
        const { callsign } = await request.json();
        const digits = String(callsign ?? '').replace(/\D/g, '');
        if (digits.length !== 3) {
            return NextResponse.json({ valid: false, available: false, error: 'Callsign must be three digits' }, { status: 400 });
        }
        const id = `INVA${digits}`;

        const [ userRow ] = await db
            .select({ ifcName: users.ifcName })
            .from(users)
            .where(eq(users.id, id))
            .limit(1);
        const [ applicantRow ] = await db
            .select({ id: applicants.id })
            .from(applicants)
            .where(eq(applicants.id, id))
            .limit(1);

        // An 'NA' ifcName is a reserved-but-unclaimed slot, matching the rule the
        // applicant-auth route already applies.
        const heldByUser = Boolean(userRow) && userRow.ifcName !== 'NA';

        return NextResponse.json({
            valid: Boolean(userRow),
            available: !heldByUser && !applicantRow,
        });
    } catch (e) {
        return NextResponse.json({ valid: false, available: false, error: e.message }, { status: 500 });
    }
}
