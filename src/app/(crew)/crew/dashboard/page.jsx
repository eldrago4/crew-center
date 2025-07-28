import ProfileContainer from '@/components/dashboard/ProfileContainer'
import { auth } from '@/auth'

export default async function DashboardPage() {
  const session = await auth();
  return (
    <ProfileContainer user={session.user} />
  );
}

