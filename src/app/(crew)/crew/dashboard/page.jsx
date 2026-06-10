import { auth } from '@/auth'
import ProfileContainer from '@/components/dashboard/ProfileContainer'
import IntroducingBadgesDialog from '@/components/dashboard/IntroducingBadgesDialog'

export default async function DashboardPage() {
  const session = await auth();



  return (
    <>
      <ProfileContainer user={session.user} />
      <IntroducingBadgesDialog />
    </>
  );
}

