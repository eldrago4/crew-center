import { Suspense } from 'react';
import { unstable_update } from '@/auth';
import db from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import IfcNameForm from './IfcNameForm';

// The page used to call auth() and never read the result — the same dead-auth()
// pattern removed elsewhere. Without it the page prerenders fully static (zero
// function invocations to serve); the form gets callsign/discordId client-side from
// the query string, and the server action below runs only on submit. The Suspense
// boundary is for IfcNameForm's useSearchParams(), which bails out of prerendering
// without one.
async function registerIfcName(formData) {
    "use server";

    const { id, discordId, ifcName } = formData;

    if (!id || !discordId || !ifcName) {
        return { error: "Missing required data for registration." };
    }

    try {
        await db.update(users)
            .set({
                ifcName: ifcName,
                discordId: discordId,
                updatedAt: new Date().toISOString()
            })
            .where(eq(users.id, id))
            .execute();

        await unstable_update({
            user: {
                redirectToIfcName: false
            }
        });
        return { success: true };
    } catch (error) {
        console.error("Server action error during IFC name registration:", error);
        return { error: error.message || "Failed to register IFC Name on the server." };
    }
}

export default function IfcNamePage() {
    return (
        <Suspense fallback={null}>
            <IfcNameForm onSubmitAction={registerIfcName} />
        </Suspense>
    );
}
