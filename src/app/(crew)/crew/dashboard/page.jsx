import { auth } from '@/auth'
import ProfileContainer from '@/components/dashboard/ProfileContainer'

export default async function DashboardPage() {
  const session = await auth();

  if (session.user.redirectToIfcName) {
    const params = new URLSearchParams({
      callsign: session.user.callsign,
      discordId: session.user.discordId
    }).toString();
    redirect(`/ifc-name?${params}`);
  }

  return (
    <ProfileContainer user={session.user} />
  );
}

