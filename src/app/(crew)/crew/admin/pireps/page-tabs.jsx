import { auth } from '@/auth'
import {
    Box,
    Heading,
    Container,
    VStack
} from '@chakra-ui/react'
import SidebarComponent from '@/components/SideBar'
import { redirect } from 'next/navigation'
import PirepsTabs from '@/components/admin/PirepsTabs'

async function getAllPireps() {
    try {
        const baseUrl = process.env.VERCEL_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/users/pireps?all=true`, {
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
        <>
            <Box
                position="fixed"
                top="0"
                left="0"
                height="100vh"
                width="13rem"
                zIndex={1}
            >
                {session.user.permissions?.length > 0 && (<SidebarComponent isAdmin={true} />)}
            </Box>
            <Box p={4} ml="13rem" flex="1">
                <Box mt="20" minH="100vh" p={6}>
                    <Container maxW="100%" py="8">
                        <VStack spacing={6} align="stretch">
                            <Heading size="xl" color="fg">
                                Admin PIREP Review
                            </Heading>
                            {/* Client Tabs Component */}
                            <PirepsTabs data={allPireps} />
                        </VStack>
                    </Container>
                </Box>
            </Box>
        </>
    )
}
