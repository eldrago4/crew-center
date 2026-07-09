
import {
  Box,
  Container,
  Text,
} from '@chakra-ui/react';
import { redirect } from 'next/navigation';
import PageTitle from '@/components/PageTitle';
import PirepListWithPagination from '@/components/pireps/logbook/PirepListWithPagination'; // Import the new Client Component

export default async function LogbookPage() {
  const { auth } = await import('@/auth');
  const session = await auth();

  let initialPireps = [];
  let initialTotalPireps = 0;
  const initialPageSize = 8;

  return (
    <Box>
      <Container maxW="container.xl" p="4">
        <Box>
          <PageTitle>Logbook</PageTitle>
          {/* Render the Client Component and pass initial data and user ID */}
          <PirepListWithPagination
            initialPireps={initialPireps}
            initialTotalPireps={initialTotalPireps}
            userId={session.user.callsign}
          />
        </Box>
      </Container>
    </Box>
  );
}

