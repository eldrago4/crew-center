import { auth } from '@/auth';
import { redirect } from "next/navigation";
import CrewChrome from '@/components/crew-runtime/CrewChrome';

export default async function RootLayout({ children }) {
  const session = await auth();

  // Handle case where session is null or user doesn't exist
  if (!session?.user) {
    redirect('/crew');
  }

  const isCEO = session.user.permissions?.includes("ceo") || false;
  const careerMode = session.user.careerMode || false;
  if (!session.user.permissions?.includes("staff")) {
    redirect('/crew');
  }

  return (
    <CrewChrome isAdmin={true} callsign={session.user.callsign} ceo={isCEO} careerMode={careerMode}>
      {children}
    </CrewChrome>
  );
}
