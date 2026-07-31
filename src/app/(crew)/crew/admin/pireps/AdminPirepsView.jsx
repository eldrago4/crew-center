'use client'

import { Box, Heading, Container, VStack } from '@chakra-ui/react';
import PirepsTabsClient from '@/components/admin/PirepsTabsClient';

export default function AdminPirepsView() {
    return (
        <Box p={{ base: 4, md: 6 }} minH="100vh">
            <Container maxW="100%" py={{ base: 4, md: 8 }}>
                <VStack spacing={6} align="stretch">
                    <Heading size="xl" color="fg">
                        Admin PIREP Review
                    </Heading>
                    <PirepsTabsClient />
                </VStack>
            </Container>
        </Box>
    );
}
