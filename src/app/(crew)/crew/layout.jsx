
export const metadata = {
    robots: { index: false, follow: false },
}

import { Providers } from "@/components/CrewProviders"
import { Box } from '@chakra-ui/react'
import { auth } from '@/auth'

export default async function RootLayout({ children }) {
  const session = await auth();
  const callsign = session?.user?.id || "000"
  const isAdmin = session?.user?.permissions?.length > 0 || false;

  return (
    <Providers>
      <Box minH="100vh" bg="bg.default">
        {children}
      </Box>
    </Providers>
  )
}

