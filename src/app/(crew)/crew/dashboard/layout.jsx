import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import ResponsiveCrewLayout from "@/components/ResponsiveCrewLayout";
import { SidebarProvider } from '@/components/SidebarContext';
export default async function RootLayout({ children }) {
  const session = await auth();

  if (!session) {
    redirect('/crew');
  }

  if (session.user.redirectToIfcName) {
    const params = new URLSearchParams({
      callsign: session.user.callsign,
      discordId: session.user.discordId || ''
    }).toString();
    redirect(`/ifc-name?${params}`);
  }
  const career = !['Yuvraj', 'Rajkumar', null].includes(session.user.rank);
  const isCEO = session.user.permissions?.includes("ceo") || false;
  const isAdmin = session.user.permissions?.length > 0 || false;

  return (<SidebarProvider>
    <ResponsiveCrewLayout 
      callsign={session.user.callsign}
      isAdmin={isAdmin}
      ceo={isCEO}
      careerMode={career}
    >
      {children}
    </ResponsiveCrewLayout>
  </SidebarProvider>);
}
