import { Box, Heading, Container, VStack } from '@chakra-ui/react';

import DatabaseViewer from '@/components/admin/DatabaseViewer';
import EventsManager from '@/components/admin/EventsManager';
import { fetchFleetModule } from '../../pireps/file/fleetModule';


export default async function FleetDatabasePage() {

    let initialFleetData = '';
    try {
        initialFleetData = await fetchFleetModule('multipliers');
    } catch (error) {
        console.error("Error fetching initial multipliers data on server:", error);
        initialFleetData = 'Error loading multipliers data.';
    }

    let initialEventsData = [];
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/events`);
        if (response.ok) {
            initialEventsData = await response.json();
        } else {
            console.error("Error fetching initial events data on server:", response.status);
            initialEventsData = [];
        }
    } catch (error) {
        console.error("Error fetching initial events data on server:", error);
        initialEventsData = [];
    }

    return (
        <Box p={{ base: 4, md: 6 }} minH="100vh">
            <Container maxW="100%" py={{ base: 4, md: 8 }}>
                <VStack spacing={6} align="stretch">
                    <Heading size="xl" color="fg">
                        Multipliers, Rotw & Events
                    </Heading>
                    <DatabaseViewer initialModuleData={initialFleetData} moduleName="multipliers" />
                    <EventsManager initialEventsData={initialEventsData} moduleName="events" />
                </VStack>
            </Container>
        </Box>
    );
}
