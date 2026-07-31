import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { loadDashboard } from '@/components/dashboard/dashboardData'
import CrewPage from '@/components/crew-runtime/CrewPage'

export default async function DashboardPage() {
  const session = await auth();
  // The layout gates too, but on a soft navigation only this page segment
  // re-renders — an expired session reaches here as null (observed as recurring
  // "Cannot read properties of null (reading 'user')" 500s in production).
  if (!session?.user) redirect('/crew');

  // Reads run on the Worker; the UI (DashboardView) renders client-only through
  // the CrewPage registry. See src/components/crew-runtime/CrewRuntime.jsx.
  const data = await loadDashboard(session.user);

  return <CrewPage id="dashboard" data={data} />;
  /* The "Introducing Badges" announcement is parked, not deleted. It still lives
     at @/components/dashboard/IntroducingBadgesDialog — to bring it back, render
     it inside DashboardView. It self-limits to one showing per browser, so clear
     the `introducingBadgesSeen` localStorage key to test it. */
}
