// Server-side data for /crew/dashboard. Split out of the old ProfileContainer so
// the page can fetch on the Worker and hand plain JSON to DashboardView, which
// renders client-only. See src/components/crew-runtime/CrewRuntime.jsx.
import db from '@/db/client'
import { users, pireps, notams, crewcenter } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { unstable_cache } from 'next/cache'
import { getLotusStatus } from '@/app/api/chanda/_lotus'

async function getUserData(callsign) {
  try {
    // The two reads only depend on the callsign, not on each other, so they go out
    // together rather than one after the other.
    const [ userDetails, pirepDetails ] = await Promise.all([
      db
        .select({
          id: users.id,
          ifcName: users.ifcName,
          flightTime: users.flightTime,
          badges: users.badges,
          careerMode: users.careerMode,
          rank: users.rank,
          updatedAt: users.updatedAt
        })
        .from(users)
        .where(eq(users.id, callsign))
        .limit(1),
      // PIREPs (latest 5)
      db
        .select({
          pirepId: pireps.pirepId,
          flightNumber: pireps.flightNumber,
          date: pireps.date,
          flightTime: pireps.flightTime,
          departureIcao: pireps.departureIcao,
          arrivalIcao: pireps.arrivalIcao,
          aircraft: pireps.aircraft,
          multiplier: pireps.multiplier,
          approved: pireps.valid,
          comments: pireps.comments,
          updatedAt: pireps.updatedAt
        })
        .from(pireps)
        .where(eq(pireps.userId, callsign))
        .orderBy(sql`${pireps.updatedAt} DESC`)
        .limit(5),
    ]);

    if (!userDetails || userDetails.length === 0) {
      return null;
    }

    return {
      ...userDetails[ 0 ],
      pireps: pirepDetails
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

// NOTAMs and the promoted event are the same for every pilot, but the dashboard is
// auth-gated and therefore dynamic, so each of these ran once per pilot per page
// load. Caching them here collapses that to once per window for the whole crew.
const getNotams = unstable_cache(
  async () => {
    try {
      // A count(*) used to run alongside this purely to populate `count`/`cached`,
      // which nothing downstream reads — the rows are the answer.
      const allNotams = await db.select().from(notams).orderBy(notams.issued);
      return { data: allNotams };
    } catch (error) {
      console.error('Error fetching NOTAMs:', error);
      return { data: [] };
    }
  },
  [ 'dashboard-notams' ],
  { revalidate: 300, tags: [ 'notams' ] },
);

const getPromotedEvent = unstable_cache(
  async () => {
    try {
      const result = await db.select().from(crewcenter).where(eq(crewcenter.module, 'events'));
      if (result.length === 0) {
        return null;
      }
      const events = result[ 0 ].value;
      const promotedEvent = events.find(event => event.promoted);
      return promotedEvent || null;
    } catch (error) {
      console.error('Error fetching promoted event:', error);
      return null;
    }
  },
  [ 'dashboard-promoted-event' ],
  { revalidate: 300, tags: [ 'events' ] },
);

// Everything the dashboard renders, as one plain object ready to cross the RSC
// boundary. Returns null when the pilot has no row (the old container rendered
// nothing in that case).
export async function loadDashboard(user) {
  if (!user) return null;
  const userDiscordId = user.discordId || user.id;

  const [ userData, notamsData, promotedEvent, lotusStatus ] = await Promise.all([
    getUserData(user.callsign),
    getNotams(),
    getPromotedEvent(),
    userDiscordId ? getLotusStatus(userDiscordId).catch(() => null) : null
  ]);

  if (!userData) return null;

  return {
    ifcName: userData.ifcName,
    image: user.image ?? null,
    flightTime: userData.flightTime,
    rank: userData.rank,
    badges: Array.isArray(userData.badges) ? userData.badges : [],
    pireps: userData.pireps,
    notams: notamsData.data,
    promotedEvent,
    lotusStatus,
  };
}
