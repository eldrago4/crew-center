import { auth } from '@/auth'
import DashNav from "@/components/DashNav";
import SidebarComponent from "@/components/SideBar";
import { redirect } from 'next/navigation'
import { Box, Flex } from "@chakra-ui/react";


export default async function RootLayout({ children }) {
  const session = await auth();


  if (!session) {
    redirect('/crew');
  }

  // Only redirect if auth logic says so
  if (session.user.redirectToIfcName) {
    const params = new URLSearchParams({
      callsign: session.user.callsign,
      discordId: session.user.discordId || ''
    }).toString();
    redirect(`/ifc-name?${params}`);
  }

  return (
    <Flex>
      {/* DashNav - positioned above sidebar with higher z-index */}
      <Box
        position="fixed"
        top="0"
        left="0"
        width="100vw"
        zIndex={10}
        marginBottom={10}
      >
        <DashNav callsign={session.user.callsign} />
      </Box>

      {/* Sidebar */}
      <Box
        position="fixed"
        top="0"
        left="0"
        height="100vh"
        width="13rem"
        zIndex={1}
      >
        {session.user.permissions?.length > 0 ? (
          () => {
            const isCEO = session.user.permissions.includes("ceo");
            return <SidebarComponent isAdmin={true} ceo={isCEO} />;
          }
        )() : (
          <SidebarComponent isAdmin={false} />
        )}
      </Box>

      {/* Main content area */}
      <Box
        marginLeft="13rem"
        marginTop="60px"
        flex="1"
      >
        {children}
      </Box>
    </Flex>
  );
}
