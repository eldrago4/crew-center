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
            <Box
        position="relative"
        top="0"
        left="0"
        height="100vh"
        width="13rem"
        zIndex={1}
      >
        {session.user.permissions?.length > 0 ? (
          <SidebarComponent isAdmin={true} />
        ) : (
          <SidebarComponent isAdmin={false} />
        )}
      </Box>
            <Box p={4} ml="13rem" flex="1">
                <Box mt="20" minH="100vh" bgColor="blackAlpha.200" rounded="md" p={6}>
                    <PirepForm userId={session.user.callsign} />
                </Box>
            </Box>
        </>
    )
}