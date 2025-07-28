import { auth } from '@/auth'
import {
    Box,
} from '@chakra-ui/react'
import SidebarComponent from '@/components/SideBar'
import { redirect } from 'next/navigation'
import PirepForm from '@/components/pireps/file/PirepForm'


export default async function FilePirepPage() {
    const session = await auth()

    if (!session) {
        redirect('/crew')
    }

    return (
        <>

            <Box p={4} ml="10" flex="1">
                <Box mt="20" minH="100vh" bgColor="blackAlpha.200" rounded="md" p={6}>
                    <PirepForm userId={session.user.callsign} />
                </Box>
            </Box>
        </>
    )
}