import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import ResponsiveCrewLayout from "@/components/ResponsiveCrewLayout";

export default async function RootLayout({ children }) {
  const session = await auth();

  if (!session) {
    redirect('/crew');
  }

  // Only redirect if auth logic says so
  if (session.user.redirectToIfcName) {
    const params = new URLSearchParams({
      callsign: session.user.callsign,
      discordId: session.user.discordId || ''
    }).toString();
    redirect(`/ifc-name?${params}`);
  }

  const isCEO = session.user.permissions?.includes("ceo") || false;
  const isAdmin = session.user.permissions?.length > 0 || false;

  return (
    <ResponsiveCrewLayout 
      callsign={session.user.callsign}
      isAdmin={isAdmin}
      ceo={isCEO}
    >
      {children}
    </ResponsiveCrewLayout>
  );
}
