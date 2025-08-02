import { auth } from '@/auth';

import { Box, Heading, Container, VStack } from '@chakra-ui/react';

import { redirect } from 'next/navigation';
import ResponsiveCrewLayout from "@/components/ResponsiveCrewLayout";

import DatabaseViewer from '@/components/admin/DatabaseViewer';
import { fetchFleetModule } from '../../pireps/file/fleetModule';


export default async function FleetDatabasePage() {
    const session = await auth();
    if (!session) {
        redirect('/crew');
    }

    let initialFleetData = '';
    try {
        initialFleetData = await fetchFleetModule('fleet');
    } catch (error) {
        console.error("Error fetching initial fleet data on server:", error);
        initialFleetData = 'Error loading fleet data.';
    }

    return (
        <ResponsiveCrewLayout isAdmin={true} callsign={session.user.callsign}>
            <Box p={{ base: 4, md: 6 }} minH="100vh">
                <Container maxW="100%" py={{ base: 4, md: 8 }}>
                    <VStack spacing={6} align="stretch">
                        <Heading size="xl" color="fg">
                            Fleet Database
                        </Heading>
                        <DatabaseViewer initialModuleData={initialFleetData} moduleName="fleet" />
                    </VStack>
                </Container>
            </Box>
        </ResponsiveCrewLayout>
    );
}
