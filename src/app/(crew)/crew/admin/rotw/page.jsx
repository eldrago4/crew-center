import { auth } from '@/auth';

import { Box, Heading, Container, VStack } from '@chakra-ui/react';

import SidebarComponent from '@/components/SideBar';

import { redirect } from 'next/navigation';

import DatabaseViewer from '@/components/admin/DatabaseViewer';
import { fetchFleetModule } from '../../pireps/file/fleetModule';


export default async function FleetDatabasePage() {
    const session = await auth();
    if (!session) {
        redirect('/crew');
    }

    let initialFleetData = '';
    try {
        initialFleetData = await fetchFleetModule('multipliers');
    } catch (error) {
        console.error("Error fetching initial multipliers data on server:", error);
        initialFleetData = 'Error loading multipliers data.';
    }

    return (
        <>
            <Box
                position="relative"
                top="0"
                left="0"
                height="100vh"
                width="13rem"
                zIndex={1}
            >
                {session.user.permissions?.length > 0 ? (
                    <SidebarComponent isAdmin={true} />
                ) : (
                    <SidebarComponent isAdmin={false} />
                )}
            </Box>
            <Box ml="4" flex="1">
                <Box mt="10" minH="100vh" p={6}>
                    <Container maxW="100%" py="8">
                        <VStack spacing={6} align="stretch">
                            <Heading size="xl" color="fg">
                                Multipliers, Rotw & Events
                            </Heading>
                            <DatabaseViewer initialModuleData={initialFleetData} moduleName="multipliers" />
                        </VStack>
                    </Container>
                </Box>
            </Box>
        </>
    );
}
