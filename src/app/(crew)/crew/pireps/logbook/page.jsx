
import {
  Box,
  Container,
  Text,
  Heading,
} from '@chakra-ui/react';
import SidebarComponent from '@/components/SideBar';
import { redirect } from 'next/navigation';
import PirepListWithPagination from '@/components/pireps/logbook/PirepListWithPagination'; // Import the new Client Component

export default async function LogbookPage() {
  const { auth } = await import('@/auth');
  const session = await auth();

  let initialPireps = [];
  let initialTotalPireps = 0;
  const initialPageSize = 8; 



  return (
    <>

      <Container maxW="container.xl" p="4" marginLeft="10" marginTop="10">
        <Box>
          <Heading as="h1" size="xl" mb="6">
            Logbook
          </Heading>
          {/* Render the Client Component and pass initial data and user ID */}
          <PirepListWithPagination
            initialPireps={initialPireps}
            initialTotalPireps={initialTotalPireps}
            userId={session.user.callsign}
          />
        </Box>
      </Container>
    </>
  );
}
