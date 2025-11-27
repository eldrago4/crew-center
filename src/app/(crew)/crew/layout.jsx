import { Providers } from "@/components/CrewProviders"
import { Box } from '@chakra-ui/react'
import { auth } from '@/auth'

export default async function RootLayout({ children }) {
  const session = await auth();
  const isAdmin = session?.user?.permissions?.length > 0 || false;

  return (
    <Providers>
        <Box minH="100vh">
          {/* Fixed DashNav at top */}



          {/* Main content area */}
          <Box
            // Add top padding for DashNav and mobile sidebar
            pt={{
              base: "60px",  // 60px for DashNav + ~70px for mobile sidebar
              md: 0      // No padding on desktop - content starts right after navbar
            }}
            pr={{ base: 0, md: 4 }}
            pb={8}
            minH="calc(100vh - 60px)"
          >
            {children}
          </Box>
        </Box>
    </Providers>
  )
}
