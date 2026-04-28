import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Box } from '@chakra-ui/react'
import SimbriefPlanner from '@/components/simbrief/SimbriefPlanner'

export const metadata = { title: 'SimBrief Dispatch | Indian Virtual' }

export default async function SimbriefPage() {
    const session = await auth()
    if (!session?.user) redirect('/login')

    return (
        <Box p={{ base: 4, md: 4 }} flex="1">
            <Box minH="100vh" bgColor={{ base: 'gray.50', _dark: 'blackAlpha.200' }} rounded="md" p={6}>
                <SimbriefPlanner />
            </Box>
        </Box>
    )
}
