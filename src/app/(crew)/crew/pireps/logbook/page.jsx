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
    const baseUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : process.env.NEXTAUTH_URL || 'https://your-domain.com'; // Replace with your actual domain

    // Fetch only the first page of PIREPs on the server
    const response = await fetch(`${baseUrl}/api/users/pireps?id=${session.user.callsign}&page=1&pageSize=${initialPageSize}`, {
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
        position="fixed"
        top="0"
        left="0"
        height="100vh"
        width="13rem"
        zIndex={1}
      >
        {session.user?.permissions?.length > 0 && (<SidebarComponent isAdmin={true} />)}
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


// [
//     {
//       "pirepId": 1,
//       "flightNumber": "AI101",
//       "date": "2025-06-07 19:03:44.092078",
//       "flightTime": "16:30:00",
//       "departureIcao": "VIDP",
//       "arrivalIcao": "KJFK",
//       "operator": "Indian Virtual",
//       "aircraft": "Airbus A359",
//       "multiplier": "1.5",
//       "comments": "Comments test",
//       "userId": "INVA011",
//       "valid": true,
//       "updatedAt": "2025-07-20 14:41:24"
//     },{
//       "pirepId": 1,
//       "flightNumber": "AI101",
//       "date": "2025-06-07 19:03:44.092078",
//       "flightTime": "16:30:00",
//       "departureIcao": "VIDP",
//       "arrivalIcao": "KJFK",
//       "operator": "Indian Virtual",
//       "aircraft": "Airbus A359",
//       "multiplier": "1.5",
//       "comments": "Comments test",
//       "userId": "INVA011",
//       "valid": true,
//       "updatedAt": "2025-07-20 14:41:24"
//     },{
//       "pirepId": 1,
//       "flightNumber": "AI101",
//       "date": "2025-06-07 19:03:44.092078",
//       "flightTime": "16:30:00",
//       "departureIcao": "VIDP",
//       "arrivalIcao": "KJFK",
//       "operator": "Indian Virtual",
//       "aircraft": "Airbus A359",
//       "multiplier": "1.5",
//       "comments": "Comments test",
//       "userId": "INVA011",
//       "valid": true,
//       "updatedAt": "2025-07-20 14:41:24"
//     },{
//       "pirepId": 1,
//       "flightNumber": "AI101",
//       "date": "2025-06-07 19:03:44.092078",
//       "flightTime": "16:30:00",
//       "departureIcao": "VIDP",
//       "arrivalIcao": "KJFK",
//       "operator": "Indian Virtual",
//       "aircraft": "Airbus A359",
//       "multiplier": "1.5",
//       "comments": "Comments test",
//       "userId": "INVA011",
//       "valid": true,
//       "updatedAt": "2025-07-20 14:41:24"
//     },{
//       "pirepId": 1,
//       "flightNumber": "AI101",
//       "date": "2025-06-07 19:03:44.092078",
//       "flightTime": "16:30:00",
//       "departureIcao": "VIDP",
//       "arrivalIcao": "KJFK",
//       "operator": "Indian Virtual",
//       "aircraft": "Airbus A359",
//       "multiplier": "1.5",
//       "comments": "Comments test",
//       "userId": "INVA011",
//       "valid": true,
//       "updatedAt": "2025-07-20 14:41:24"
//     },{
//       "pirepId": 1,
//       "flightNumber": "AI101",
//       "date": "2025-06-07 19:03:44.092078",
//       "flightTime": "16:30:00",
//       "departureIcao": "VIDP",
//       "arrivalIcao": "KJFK",
//       "operator": "Indian Virtual",
//       "aircraft": "Airbus A359",
//       "multiplier": "1.5",
//       "comments": "Comments test",
//       "userId": "INVA011",
//       "valid": true,
//       "updatedAt": "2025-07-20 14:41:24"
//     },{
//       "pirepId": 1,
//       "flightNumber": "AI101",
//       "date": "2025-06-07 19:03:44.092078",
//       "flightTime": "16:30:00",
//       "departureIcao": "VIDP",
//       "arrivalIcao": "KJFK",
//       "operator": "Indian Virtual",
//       "aircraft": "Airbus A359",
//       "multiplier": "1.5",
//       "comments": "Comments test",
//       "userId": "INVA011",
//       "valid": true,
//       "updatedAt": "2025-07-20 14:41:24"
//     },{
//       "pirepId": 1,
//       "flightNumber": "AI101",
//       "date": "2025-06-07 19:03:44.092078",
//       "flightTime": "16:30:00",
//       "departureIcao": "VIDP",
//       "arrivalIcao": "KJFK",
//       "operator": "Indian Virtual",
//       "aircraft": "Airbus A359",
//       "multiplier": "1.5",
//       "comments": "Comments test",
//       "userId": "INVA011",
//       "valid": true,
//       "updatedAt": "2025-07-20 14:41:24"
//     },{
//       "pirepId": 1,
//       "flightNumber": "AI101",
//       "date": "2025-06-07 19:03:44.092078",
//       "flightTime": "16:30:00",
//       "departureIcao": "VIDP",
//       "arrivalIcao": "KJFK",
//       "operator": "Indian Virtual",
//       "aircraft": "Airbus A359",
//       "multiplier": "1.5",
//       "comments": "Comments test",
//       "userId": "INVA011",
//       "valid": true,
//       "updatedAt": "2025-07-20 14:41:24"
//     },{
//       "pirepId": 1,
//       "flightNumber": "AI101",
//       "date": "2025-06-07 19:03:44.092078",
//       "flightTime": "16:30:00",
//       "departureIcao": "VIDP",
//       "arrivalIcao": "KJFK",
//       "operator": "Indian Virtual",
//       "aircraft": "Airbus A359",
//       "multiplier": "1.5",
//       "comments": "Comments test",
//       "userId": "INVA011",
//       "valid": true,
//       "updatedAt": "2025-07-20 14:41:24"
//     },{
//       "pirepId": 1,
//       "flightNumber": "AI101",
//       "date": "2025-06-07 19:03:44.092078",
//       "flightTime": "16:30:00",
//       "departureIcao": "VIDP",
//       "arrivalIcao": "KJFK",
//       "operator": "Indian Virtual",
//       "aircraft": "Airbus A359",
//       "multiplier": "1.5",
//       "comments": "Comments test",
//       "userId": "INVA011",
//       "valid": true,
//       "updatedAt": "2025-07-20 14:41:24"
//     },{
//       "pirepId": 1,
//       "flightNumber": "AI101",
//       "date": "2025-06-07 19:03:44.092078",
//       "flightTime": "16:30:00",
//       "departureIcao": "VIDP",
//       "arrivalIcao": "KJFK",
//       "operator": "Indian Virtual",
//       "aircraft": "Airbus A359",
//       "multiplier": "1.5",
//       "comments": "Comments test",
//       "userId": "INVA011",
//       "valid": true,
//       "updatedAt": "2025-07-20 14:41:24"
//     }
//   ]