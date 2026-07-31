'use client'

import { Box, Heading, Container, VStack } from '@chakra-ui/react';
import DatabaseViewer from '@/components/admin/DatabaseViewer';

export default function ServerConfigView({ initialStaffData }) {
    return (
        <Box p={{ base: 4, md: 6 }} minH="100vh">
            <Container maxW="100%" py={{ base: 4, md: 8 }}>
                <VStack spacing={6} align="stretch">
                    <Heading size="xl" color="fg">
                        [CEO] Server Configuration
                    </Heading>
                    <DatabaseViewer initialModuleData={initialStaffData} moduleName="staff" redis={true} />
                </VStack>
            </Container>
        </Box>
    );
}
