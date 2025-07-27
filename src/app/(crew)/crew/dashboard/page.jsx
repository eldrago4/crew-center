import { auth } from '@/auth'
import {
  Box,
  Flex,
  Container,
  Text,
} from '@chakra-ui/react'
import SidebarComponent from '@/components/SideBar'
import ProfileContainer from '@/components/dashboard/ProfileContainer'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/crew');
  }

  // Redirect to IFC Name page if needed
  if (session.user.redirectToIfcName) {
    const params = new URLSearchParams({
      callsign: session.user.callsign,
      discordId: session.user.discordId
    }).toString();
    redirect(`/ifc-name?${params}`);
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
      <Box p={0} marginTop="36px" flex="1">
        <Box minH="100vh">
          <ProfileContainer user={session?.user} />
        </Box>
      </Box>
    </>
  );
}

