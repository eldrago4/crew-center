export const metadata = {
  title: 'Contributions — INVA Crew Center',
  description: 'Support Indian Virtual\'s infrastructure. Keep the skies alive.',
  robots: { index: false, follow: false },
};


import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import CrewChrome from '@/components/crew-runtime/CrewChrome';

// The <Box minH="100vh" bg="bg.default"> that used to wrap this is now applied
// once for the whole crew app, inside CrewRuntimeInner — a server file must not
// render Chakra (see CrewRuntime.jsx).
export default async function ChandaLayout({ children }) {
  const session = await auth();

  if (!session) {
    redirect('/crew');
  }

  const isAdmin = session.user.permissions?.length > 0 || false;
  const careerMode = session.user.careerMode || false;

  return (
    <CrewChrome
      callsign={session.user.callsign}
      isAdmin={isAdmin}
      careerMode={careerMode}
    >
      {children}
    </CrewChrome>
  );
}
