'use client'

import { SessionProvider } from 'next-auth/react'
import { CareerProvider as ChakraProvider } from '@/components/ui/career-provider'
import { Toaster } from '@/components/ui/toaster'
import CareerNavBar from '@/components/CareerNavBar'
import { Box } from '@chakra-ui/react'

// The client half of the old server-side CareerProviders: same tree, but the
// session comes in as a prop (the layout already resolved it) instead of being
// awaited here.
export default function CareerChromeInner({ session, children }) {
  return (
    <SessionProvider session={session} refetchWhenOffline={false} refetchOnWindowFocus={false}>
      <ChakraProvider>
        <CareerNavBar />
        <Box>{children}</Box>
        <Toaster />
      </ChakraProvider>
    </SessionProvider>
  )
}
