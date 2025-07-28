import { auth } from '@/auth';
import { Box, Heading, Container, VStack } from '@chakra-ui/react';
import SidebarComponent from '@/components/SideBar';
import { redirect } from 'next/navigation';

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
            <Box ml="13rem" flex="1">
                <Box mt="20" minH="100vh" p={6}>
                    <Container maxW="100%" py="8">
                        <VStack spacing={6} align="stretch">
                            <Heading size="xl" color="fg">
                                Admin PIREP Review
                            </Heading>
                            <PirepsTabsWrapper />
                        </VStack>
                    </Container>
                </Box>
            </Box>
        </>
    );
}
