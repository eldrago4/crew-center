import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import CrewChrome from '@/components/crew-runtime/CrewChrome'

export default async function RootLayout({ children }) {
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
