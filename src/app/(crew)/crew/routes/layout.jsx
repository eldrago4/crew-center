import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import ResponsiveCrewLayout from "@/components/ResponsiveCrewLayout";
import { SidebarProvider } from '@/components/SidebarContext';

export default async function RootLayout({ children }) {
  const session = await auth();

  if (!session) {
    redirect('/crew');
  }

  const isAdmin = session.user.permissions?.length > 0 || false;

  return (
    <SidebarProvider>
      <ResponsiveCrewLayout
        callsign={session.user.callsign}
        isAdmin={isAdmin}
      >
        {children}
      </ResponsiveCrewLayout>
    </SidebarProvider>
  );
}
