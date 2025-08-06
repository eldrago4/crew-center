import ResponsiveCrewLayout from "@/components/ResponsiveCrewLayout";
import { auth } from '@/auth';

export default async function RootLayout({ children }) {
  const session = await auth();
  const isCEO = session.user.permissions?.includes("ceo") || false;
  if (!session) {
    redirect('/crew');
  }

  return (
    <ResponsiveCrewLayout isAdmin={true} callsign={session.user.callsign} ceo={isCEO}>
      {children}
    </ResponsiveCrewLayout>
  );
}
