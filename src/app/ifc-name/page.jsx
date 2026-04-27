import { auth, unstable_update } from '@/auth';
import db from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import IfcNameForm from './IfcNameForm';

export default async function IfcNamePage() {
    const session = await auth();

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

    return <IfcNameForm onSubmitAction={registerIfcName} />;
}
