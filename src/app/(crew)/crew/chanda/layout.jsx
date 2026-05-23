export const metadata = {
  title: 'Contributions — INVA Crew Center',
  description: 'Support Indian Virtual\'s infrastructure. Keep the skies alive.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { SidebarProvider } from '@/components/SidebarContext';
import ResponsiveCrewLayout from '@/components/ResponsiveCrewLayout';
import { Box } from '@chakra-ui/react';

export default async function ChandaLayout({ children }) {
  const session = await auth();

  if (!session) {
    redirect('/crew');
  }

  const isAdmin = session.user.permissions?.length > 0 || false;
  const careerMode = session.user.careerMode || false;

  return (
    <Box minH="100vh" bg="bg.default">
      <SidebarProvider>
        <ResponsiveCrewLayout
          callsign={session.user.callsign}
          isAdmin={isAdmin}
          careerMode={careerMode}
        >
          {children}
        </ResponsiveCrewLayout>
      </SidebarProvider>
    </Box>
  );
}
