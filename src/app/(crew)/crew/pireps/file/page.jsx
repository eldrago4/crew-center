import { auth } from '@/auth'
import {
    Box,
    Flex,
    Container,
    Text,
} from '@chakra-ui/react'
import SidebarComponent from '@/components/SideBar'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function LogbookPage() {
    const session = await auth()

    if (!session) {
        redirect('/crew')
    }

    return (
        <>
            <Box
                position="relative"
                top="0"
                left="0"
                height="100vh"
                width="13rem"
                zIndex={1}
            >
                {session.user.permissions?.length > 0 && (<SidebarComponent isAdmin={true} />)}
            </Box>
            <Box p={0} marginTop="36px" flex="1">
                <Box minH="100vh">
                    <h1>logbook (ss Component)</h1>
                    <Link href="/crew/pireps/logbook">Go to logbook (CSR)</Link>
                </Box>
            </Box>
        </>
    )
}

