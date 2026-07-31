'use client'

import { Box, Container } from '@chakra-ui/react'
import PageTitle from '@/components/PageTitle'
import PirepListWithPagination from '@/components/pireps/logbook/PirepListWithPagination'

// The list fetches its own page of PIREPs on mount, so there is nothing to seed
// from the server beyond the callsign.
export default function LogbookView({ userId }) {
  return (
    <Box>
      <Container maxW="container.xl" p="4">
        <Box>
          <PageTitle>Logbook</PageTitle>
          <PirepListWithPagination
            initialPireps={[]}
            initialTotalPireps={0}
            userId={userId}
          />
        </Box>
      </Container>
    </Box>
  )
}
