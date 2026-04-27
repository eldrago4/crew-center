import { Box } from '@chakra-ui/react'
import { FreshPirepForm } from '@/components/pireps/file/FreshPirepForm'
import { fetchFleetModule } from '@/app/(crew)/crew/pireps/file/fleetModule.js'
import { auth } from '@/auth';

export const dynamic = 'force-dynamic'; // Disable static optimization and always render fresh
export const revalidate = 0; // Disable all caching

export default async function FilePirepPage() {
    const session = await auth();
    let fleetData, operatorsData, multipliersData, ifatcMultipliersData;

    try {
        // Add timestamp to force fresh data fetching
        const timestamp = Date.now();
        console.log(`[PIREP PAGE] Fetching data at timestamp: ${timestamp}`);

        [ fleetData, operatorsData, multipliersData, ifatcMultipliersData ] = await Promise.all([
            fetchFleetModule('fleet'),
            fetchFleetModule('operators'),
            fetchFleetModule('multipliers', true), // Force refresh multipliers
            fetchFleetModule('ifatcMultipliers')
        ]);

        console.log(`[PIREP PAGE] Data fetched successfully:`);
        console.log(`  - Fleet: ${fleetData?.length || 0} items`);
        console.log(`  - Operators: ${operatorsData?.length || 0} items`);
        console.log(`  - Multipliers: ${multipliersData?.length || 0} items`);
        console.log(`  - IFATC Multipliers: ${ifatcMultipliersData?.length || 0} items`);
        console.log(`[PIREP PAGE] Sample multiplier:`, multipliersData?.[ 0 ]);
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
