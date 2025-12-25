import ResponsiveCrewLayout from "@/components/ResponsiveCrewLayout";
import { auth } from '@/auth';
import { redirect } from "next/navigation";
import { SidebarProvider } from '@/components/SidebarContext';
export default async function RootLayout({ children }) {
  const session = await auth();

  // Handle case where session is null or user doesn't exist
  if (!session?.user) {
    redirect('/crew');
  }

  const isCEO = session.user.permissions?.includes("ceo") || false;
  if (!session.user.permissions?.includes("staff")) {
    redirect('/crew');
  }

  return (<SidebarProvider>
    <ResponsiveCrewLayout isAdmin={true} callsign={session.user.callsign} ceo={isCEO}>
      {children}
    </ResponsiveCrewLayout></SidebarProvider>
  );
}
