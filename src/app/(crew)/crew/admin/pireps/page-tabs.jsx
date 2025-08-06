import { auth } from '@/auth'
import {
    Box,
    Heading,
    Container,
    VStack
} from '@chakra-ui/react'
import { redirect } from 'next/navigation'
import ResponsiveCrewLayout from "@/components/ResponsiveCrewLayout";
import PirepsTabs from '@/components/admin/PirepsTabs'

async function getAllPireps() {
    try {
        const baseUrl = process.env.VERCEL_URL || 'http://localhost:3000';
        const response = await fetch('/api/users/pireps?all=true', {
            cache: 'no-store'
        })

        if (!response.ok) {
            throw new Error('Failed to fetch PIREPs')
        }

        const data = await response.json()
        return {
            pireps: data.data || [],
            total: data.data?.length || 0
        }
    } catch (error) {
        console.error('Error fetching PIREPs:', error)
        return { pireps: [], total: 0 }
    }
}

export default async function AdminPirepsPage() {
    const session = await auth()

    if (!session) {
        redirect('/crew')
    }

    const { pireps: allPireps, total: totalPireps } = await getAllPireps()

    return (
        <ResponsiveCrewLayout isAdmin={true} callsign={session.user.callsign}>
            <Box p={{ base: 4, md: 6 }} minH="100vh">
                <Container maxW="100%" py={{ base: 4, md: 8 }}>
                    <VStack spacing={6} align="stretch">
                        <Heading size="xl" color="fg">
                            Admin PIREP Review
                        </Heading>
                        {/* Client Tabs Component */}
                        <PirepsTabs data={allPireps} />
                    </VStack>
                </Container>
            </Box>
        </ResponsiveCrewLayout>
    )
}
