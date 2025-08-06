import { auth } from '@/auth'
import ProfileContainer from '@/components/dashboard/ProfileContainer'

export default async function DashboardPage() {
  const session = await auth();



  return (
    <ProfileContainer user={session.user} />
  );
}

