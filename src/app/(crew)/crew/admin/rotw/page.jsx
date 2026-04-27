import { Box, Heading, Container, VStack } from '@chakra-ui/react';

import DatabaseViewer from '@/components/admin/DatabaseViewer';
import MultipliersManager from '@/components/admin/MultipliersManager';
import EventsManager from '@/components/admin/EventsManager';
import { fetchFleetModule, fetchModuleValue } from '../../pireps/file/fleetModule';


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
        initialEventsData = await fetchModuleValue('events');
        // Ensure it's an array, if not, set to empty array
        initialEventsData = Array.isArray(initialEventsData) ? initialEventsData : [];
        console.log("Initial events data fetched:", initialEventsData.length, "events");
    } catch (error) {
        console.error("Error fetching initial events data on server:", error);
        initialEventsData = [];
    }

    return (
        <Box p={{ base: 4, md: 6 }} minH="100vh">
            <Container maxW="100%" py={{ base: 4, md: 8 }}>
                <VStack spacing={6} align="stretch">
                    <Heading size="xl" color="fg">
                        Multipliers - Regular Flying
                    </Heading>
                    <MultipliersManager initialModuleData={initialFleetData} moduleName="multipliers" />
                    <EventsManager initialEventsData={initialEventsData} moduleName="events" />
                </VStack>
            </Container>
        </Box>
    );
}