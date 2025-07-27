// This is a Server Component, no 'use client' needed here

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
  // Dynamically import auth as it's a server-side module
  const { auth } = await import('@/auth');
  const session = await auth();

  if (!session) {
    redirect('/crew');
  }

  let initialPireps = [];
  let initialTotalPireps = 0;
  const initialPageSize = 8; // Consistent page size for initial fetch

  try {
    const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL || 'http://localhost:3000'; // Replace with your actual domain

    // Fetch only the first page of PIREPs on the server
    const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/users/pireps?id=${session.user.callsign}&page=1&pageSize=${initialPageSize}`, {
      cache: 'no-store' // Ensure fresh data
    });

    if (!response.ok) {
      throw new Error('Failed to fetch initial PIREPs');
    }

    const data = await response.json();
    initialPireps = data.data;
    initialTotalPireps = data.total;
  } catch (error) {
    console.error("Error fetching initial PIREPs:", error);
    // Handle error gracefully, e.g., show an error message or empty state
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
      <Container maxW="container.xl" p="4" marginLeft="13rem" marginTop="20">
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
