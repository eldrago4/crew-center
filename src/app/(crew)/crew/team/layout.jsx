import { auth } from '@/auth'
import { redirect } from 'next/navigation'

// Deliberately does NOT wrap children in SidebarProvider/ResponsiveCrewLayout like
// the other crew sections (dashboard/layout.jsx etc.) — the profile page shows a
// plain back button instead of the sidebar.
export default async function CrewTeamLayout({ children }) {
  const session = await auth()

  if (!session) {
    redirect('/crew')
  }

  if (session.user.redirectToIfcName) {
    const params = new URLSearchParams({
      callsign: session.user.callsign,
      discordId: session.user.discordId || ''
    }).toString();
    redirect(`/ifc-name?${params}`);
  }

  return children
}
