import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { CareerProviders } from "@/components/CareerProviders"
import CareerNavBar from "@/components/CareerNavBar"
import { Box } from "@chakra-ui/react"

export default async function CareerLayout({ children }) {
    const session = await auth()

    if (session?.user?.careerMode) {
        redirect('/api/career-sso-redirect')
    }

    return (
        <CareerProviders>
            <CareerNavBar />
            <Box>
                {children}
            </Box>
        </CareerProviders>
    )
}
