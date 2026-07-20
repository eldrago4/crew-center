import { Box } from '@chakra-ui/react'
import SimbriefPlanner from '@/components/simbrief/SimbriefPlanner'

export const metadata = { title: 'SimBrief Dispatch | Indian Virtual' }

// Login gating is handled by plan/layout.jsx (redirect('/crew')); this page had a
// duplicate auth() + redirect('/login') (a path that doesn't exist). SimbriefPlanner
// is a client component and gets the session via useSession, not a prop.
export default function SimbriefPage() {
    return (
        <Box p={{ base: 4, md: 4 }} flex="1">
            <Box minH="100vh" bgColor={{ base: 'gray.50', _dark: 'blackAlpha.200' }} rounded="md" p={6}>
                <SimbriefPlanner />
            </Box>
        </Box>
    )
}
