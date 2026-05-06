import React from 'react';
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
  const careerMode = session.user.careerMode || false;

  return (<SidebarProvider>
    <ResponsiveCrewLayout
      callsign={session.user.callsign}
      isAdmin={isAdmin}
      careerMode={careerMode}
    >
      {React.Children.map(children, child => 
        React.cloneElement(child, { session })
      )}
    </ResponsiveCrewLayout>
  </SidebarProvider>);
}
