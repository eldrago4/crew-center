'use client'

import { Box, Heading, Container, VStack } from '@chakra-ui/react';
import MultipliersManager from '@/components/admin/MultipliersManager';
import EventsManager from '@/components/admin/EventsManager';
import NotamsManager from '@/components/admin/NotamsManager';

export default function AdminRotwView({ initialFleetData, initialEventsData, initialNotamsData }) {
    return (
        <Box p={{ base: 4, md: 6 }} minH="100vh">
            <Container maxW="100%" py={{ base: 4, md: 8 }}>
                <VStack spacing={6} align="stretch">
                    <Heading size="xl" color="fg">
                        Multipliers - Regular Flying
                    </Heading>
                    <MultipliersManager initialModuleData={initialFleetData} moduleName="multipliers" />
                    <NotamsManager initialNotams={initialNotamsData} />
                    <EventsManager initialEventsData={initialEventsData} moduleName="events" />
                </VStack>
            </Container>
        </Box>
    );
}
