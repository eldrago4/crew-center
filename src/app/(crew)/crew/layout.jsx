
export const metadata = {
    robots: { index: false, follow: false },
}

import { Providers } from "@/components/CrewProviders"
import { Box } from '@chakra-ui/react'

// No auth() here: it used to fetch the session and derive callsign/isAdmin that the
// JSX never used. Gating is done by each section's own layout (dashboard/plan/admin/
// …), and CrewProviders already resolves the session once to seed SessionProvider.
export default function RootLayout({ children }) {
  return (
    <Providers>
      <Box minH="100vh" bg="bg.default">
        {children}
      </Box>
    </Providers>
  )
}

