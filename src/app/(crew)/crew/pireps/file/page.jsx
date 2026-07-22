import { Box } from '@chakra-ui/react'
import { FreshPirepForm } from '@/components/pireps/file/FreshPirepForm'
import { fetchFleetModule } from '@/app/(crew)/crew/pireps/file/fleetModule.js'
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

// No force-dynamic/revalidate=0 here: the layout's auth() already makes the route
// dynamic, and those flags only forbade caching the module data below. All four
// modules are shared (nothing per-user) and come from fleetModule's 5-minute cache
// — multipliers included, which used to be force-refreshed from Postgres on every
// render (and this page is one of the most-invoked routes in the app).

export default async function FilePirepPage() {
    const session = await auth();
    // The layout gates too, but on a soft navigation only this page segment
    // re-renders — an expired session reaches here as null (observed as recurring
    // "Cannot read properties of null (reading 'user')" 500s in production).
    if (!session?.user) redirect('/crew');
    let fleetData, operatorsData, multipliersData, ifatcMultipliersData;

    try {
        [ fleetData, operatorsData, multipliersData, ifatcMultipliersData ] = await Promise.all([
            fetchFleetModule('fleet'),
            fetchFleetModule('operators'),
            fetchFleetModule('multipliers'),
            fetchFleetModule('ifatcMultipliers')
        ]);
    } catch (error) {
        console.error("Failed to fetch PIREP form data:", error);
        fleetData = [];
        operatorsData = [];
        multipliersData = [];
        ifatcMultipliersData = [];
    }

    // fleetData is now [{label, value}] for select fields
    return (
        <>
            <Box p={{ base: 4, md: 4 }} flex="1">
                <Box minH="100vh" bgColor="blackAlpha.200" rounded="md" p={6}>
                    <FreshPirepForm
                        userId={session.user.callsign}
                        session={session}
                        initialAircraft={fleetData}
                        initialOperators={operatorsData}
                        initialMultipliers={multipliersData}
                        initialIfatcMultipliers={ifatcMultipliersData}
                    />
                </Box>
            </Box>
        </>
    )
}
