import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import CrewPage from '@/components/crew-runtime/CrewPage';

// The list is client-fetched, so all this page owes it is the callsign. The UI is
// in ./LogbookView.jsx, loaded client-only through the CrewPage registry — see
// src/components/crew-runtime/CrewRuntime.jsx.
export default async function LogbookPage() {
  const session = await auth();
  if (!session?.user) redirect('/crew');

  return <CrewPage id="pireps-logbook" userId={session.user.callsign} />;
}
