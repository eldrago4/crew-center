import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import ProfileContainer from '@/components/dashboard/ProfileContainer'

export default async function DashboardPage() {
  const session = await auth();
  // The layout gates too, but on a soft navigation only this page segment
  // re-renders — an expired session reaches here as null (observed as recurring
  // "Cannot read properties of null (reading 'user')" 500s in production).
  if (!session?.user) redirect('/crew');

  return (
    <>
      <ProfileContainer user={session.user} />
      {/* The "Introducing Badges" announcement is parked, not deleted. It still lives
          at @/components/dashboard/IntroducingBadgesDialog — to bring it back, import
          it and render <IntroducingBadgesDialog /> here. It self-limits to one showing
          per browser, so clear the `introducingBadgesSeen` localStorage key to test it. */}
    </>
  );
}

