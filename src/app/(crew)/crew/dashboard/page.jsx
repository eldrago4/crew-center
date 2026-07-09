import { Container } from '@chakra-ui/react'
import { auth } from '@/auth'
import PageTitle from '@/components/PageTitle'
import ProfileContainer from '@/components/dashboard/ProfileContainer'
import IntroducingBadgesDialog from '@/components/dashboard/IntroducingBadgesDialog'

export default async function DashboardPage() {
  const session = await auth();



  return (
    <>
      <Container maxW="100%" pt="4" px="4">
        <PageTitle>Profile</PageTitle>
      </Container>
      <ProfileContainer user={session.user} />
      <IntroducingBadgesDialog />
    </>
  );
}

