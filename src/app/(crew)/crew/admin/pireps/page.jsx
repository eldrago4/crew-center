import { auth } from '@/auth';
import { Heading, Container, VStack } from '@chakra-ui/react';
import { redirect } from 'next/navigation';
import ResponsiveCrewLayout from "@/components/ResponsiveCrewLayout";

import PirepsTabsClient from '@/components/admin/PirepsTabsClient';

function PirepsTabsWrapper() {
    return <PirepsTabsClient />;
}

export default async function AdminPirepsPage() {
    const session = await auth();
    if (!session) {
        redirect('/crew');
    }
    
    return (
        <ResponsiveCrewLayout isAdmin={true} callsign={session.user.callsign}>
            <Box p={{ base: 4, md: 6 }} minH="100vh">
                <Container maxW="100%" py={{ base: 4, md: 8 }}>
                    <VStack spacing={6} align="stretch">
                        <Heading size="xl" color="fg">
                            Admin PIREP Review
                        </Heading>
                        <PirepsTabsWrapper />
                    </VStack>
                </Container>
            </Box>
        </ResponsiveCrewLayout>
    );
}
