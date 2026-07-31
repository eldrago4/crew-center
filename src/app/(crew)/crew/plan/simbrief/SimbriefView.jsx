'use client'

import { Box } from '@chakra-ui/react'
import SimbriefPlanner from '@/components/simbrief/SimbriefPlanner'

// SimbriefPlanner gets the session via useSession, not a prop.
export default function SimbriefView() {
    return (
        <Box p={{ base: 4, md: 4 }} flex="1">
            <Box minH="100vh" bgColor={{ base: 'gray.50', _dark: 'blackAlpha.200' }} rounded="md" p={6}>
                <SimbriefPlanner />
            </Box>
        </Box>
    )
}
