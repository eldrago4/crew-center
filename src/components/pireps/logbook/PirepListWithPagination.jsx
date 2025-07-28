
// Server wrapper to fetch paginated PIREPs from DB
import db from '@/db/client';
import { pireps } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import dynamic from 'next/dynamic';

const PirepListClient = dynamic(() => import('./PirepListWithPaginationClient'), { ssr: false });

export default async function PirepListWithPagination({ userId }) {
  const pageSize = 8;
  // Fetch first page server-side
  const data = await db
    .select()
    .from(pireps)
    .where(eq(pireps.userId, userId))
    .orderBy(sql`${pireps.updatedAt} DESC`)
    .limit(pageSize);
  const total = await db
    .select({ count: sql`count(*)` })
    .from(pireps)
    .where(eq(pireps.userId, userId));
  const totalPireps = Number(total[ 0 ]?.count || 0);
  return <PirepListClient initialPireps={data} initialTotalPireps={totalPireps} userId={userId} />;
}
