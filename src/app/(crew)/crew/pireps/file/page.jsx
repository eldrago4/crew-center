import { Box } from '@chakra-ui/react'
import { PirepForm } from '@/components/pireps/file/PirepForm'
import { fetchFleetModule } from '@/app/(crew)/crew/pireps/file/fleetModule.js'
import { auth } from '@/auth';

export default async function FilePirepPage() {
    const session = await auth();
    let fleetData, operatorsData, multipliersData, ifatcMultipliersData;

    try {
        [ fleetData, operatorsData, multipliersData, ifatcMultipliersData ] = await Promise.all([
            fetchFleetModule('fleet'),
            fetchFleetModule('operators'),
            fetchFleetModule('multipliers', true), // Force refresh multipliers
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
                    <PirepForm
                        userId={session.user.callsign}
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
