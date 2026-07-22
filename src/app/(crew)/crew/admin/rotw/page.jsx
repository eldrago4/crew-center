import { Box, Heading, Container, VStack } from '@chakra-ui/react';

import DatabaseViewer from '@/components/admin/DatabaseViewer';
import MultipliersManager from '@/components/admin/MultipliersManager';
import EventsManager from '@/components/admin/EventsManager';
import NotamsManager from '@/components/admin/NotamsManager';
import { fetchFleetModule, fetchModuleValue } from '../../pireps/file/fleetModule';
import { connection } from 'next/server';
import db from '@/db/client';
import { notams } from '@/db/schema';
import { desc } from 'drizzle-orm';


export default async function FleetDatabasePage() {
    // Keep this page request-time: its reads (unstable_cache + a direct notams
    // select) hit Neon, and prerendering at build would either bake build-time
    // data or fail the build when DATABASE_URL isn't a build var. connection()
    // opts out of static generation without needing Cache Components.
    await connection();

    // The three reads are independent — run them in parallel (allSettled keeps each
    // one's own fallback if it fails), instead of three serial round trips.
    const [ fleetRes, eventsRes, notamsRes ] = await Promise.allSettled([
        fetchFleetModule('multipliers'),
        fetchModuleValue('events'),
        db.select().from(notams).orderBy(desc(notams.issued)),
    ]);

    let initialFleetData = 'Error loading multipliers data.';
    if (fleetRes.status === 'fulfilled') initialFleetData = fleetRes.value;
    else console.error("Error fetching initial multipliers data on server:", fleetRes.reason);

    let initialEventsData = [];
    if (eventsRes.status === 'fulfilled') initialEventsData = Array.isArray(eventsRes.value) ? eventsRes.value : [];
    else console.error("Error fetching initial events data on server:", eventsRes.reason);

    let initialNotamsData = [];
    if (notamsRes.status === 'fulfilled') initialNotamsData = notamsRes.value;
    else console.error("Error fetching initial NOTAMs data on server:", notamsRes.reason);

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
