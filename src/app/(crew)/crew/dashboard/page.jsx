import { auth } from '@/auth'
import ProfileContainer from '@/components/dashboard/ProfileContainer'

export default async function DashboardPage() {
  const session = await auth();

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

