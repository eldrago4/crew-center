'use client'

import { Provider as ChakraProvider } from "@/components/ui/provider"
import { SessionProvider } from 'next-auth/react'
import { Toaster } from "@/components/ui/toaster"

export function Providers({ children }) {
  return (
    <SessionProvider>
      <ChakraProvider>
        {children}
        <Toaster />
      </ChakraProvider>
    </SessionProvider>
  )
}