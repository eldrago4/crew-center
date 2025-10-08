import ResponsiveCrewLayout from "@/components/ResponsiveCrewLayout";
import { auth } from '@/auth';
import { redirect } from "next/navigation";

export default async function RootLayout({ children }) {
  const session = await auth();
  const isCEO = session.user.permissions?.includes("ceo") || false;
  if (!session.user.permissions?.includes("staff")) {
    redirect('/crew');
  }

  return (
    <ResponsiveCrewLayout isAdmin={true} callsign={session.user.callsign} ceo={isCEO}>
      {children}
    </ResponsiveCrewLayout>
  );
}
