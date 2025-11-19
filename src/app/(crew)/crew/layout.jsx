import { Providers } from "@/components/CrewProviders"
import { SidebarProvider } from "@/components/SidebarContext"
import { Box } from '@chakra-ui/react'
import DashNav from "@/components/DashNav";
import SidebarComponent from "@/components/SideBar";
import { auth } from '@/auth'

export default async function RootLayout({ children }) {
  const session = await auth();
  const isAdmin = session?.user?.permissions?.length > 0 || false;

  return (
    <Providers>
      <SidebarProvider>
        <Box minH="100vh">
          {/* Fixed DashNav at top */}
          <Box
            position="fixed"
            top="0"
            left="0"
            width="100vw"
            zIndex={20}
          >
            <DashNav callsign={session?.user?.callsign} />
          </Box>

          {/* Sidebar - renders both desktop and mobile versions */}
          <Box
            position="fixed"
            top="50px"
            left="0"
            height="calc(100vh - 60px)"
            zIndex={10}
          >
            <SidebarComponent isAdmin={isAdmin} />
          </Box>

          {/* Main content area */}
          <Box
            // Add top padding for DashNav and mobile sidebar
            pt={{
              base: "170px",  // 60px for DashNav + ~70px for mobile sidebar
              md: 0      // No padding on desktop - content starts right after navbar
            }}
            pr={{ base: 0, md: 4 }}
            pb={8}
            minH="calc(100vh - 60px)"
          >
            {children}
          </Box>
        </Box>
      </SidebarProvider>
    </Providers>
  )
}
