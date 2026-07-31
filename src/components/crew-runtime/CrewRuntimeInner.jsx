'use client'

import { SessionProvider } from 'next-auth/react'
import { Provider as ChakraProvider } from '@/components/ui/provider'
import { Toaster } from '@/components/ui/toaster'
import { Box } from '@chakra-ui/react'

// Client-only (loaded by CrewRuntime behind ssr:false) — this is where Chakra is
// allowed to appear. The session arrives as a prop from the crew layout's auth()
// instead of being resolved here, so SessionProvider is seeded on first paint
// without a client round trip.
export default function CrewRuntimeInner({ session, children }) {
  return (
    <SessionProvider session={session} refetchWhenOffline={false} refetchOnWindowFocus={false}>
      <ChakraProvider>
        <Box minH="100vh" bg="bg.default">
          {children}
        </Box>
        <Toaster />
      </ChakraProvider>
    </SessionProvider>
  )
}
