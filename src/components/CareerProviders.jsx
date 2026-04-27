import { CareerProvider as ChakraProvider } from "@/components/ui/career-provider"
import { SessionProvider } from 'next-auth/react'
import { Toaster } from "@/components/ui/toaster"
import { auth } from '@/auth'

export async function CareerProviders({ children }) {
    const session = await auth();

    return (
        <SessionProvider session={session} refetchWhenOffline={false} refetchOnWindowFocus={false}>
            <ChakraProvider>
                {children}
                <Toaster />
            </ChakraProvider>
        </SessionProvider>
    )
}
