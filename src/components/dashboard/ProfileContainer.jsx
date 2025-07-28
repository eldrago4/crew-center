// app/components/dashboard/ProfileContainer.jsx
import BasicInfo from './BasicInfo'
import PirepsTable from './PirepsTable'
import Notams from './Notams'
import { Grid } from '@chakra-ui/react'
import db from '@/db/client'
import { users, pireps, notams } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

async function getUserData(callsign) {
  try {
    // User details
    const userDetails = await db
      .select({
        id: users.id,
        ifcName: users.ifcName,
        flightTime: users.flightTime,
        careerMode: users.careerMode,
        rank: users.rank,
        updatedAt: users.updatedAt
      })
      .from(users)
      .where(eq(users.id, callsign))
      .limit(1);

    // PIREPs (latest 5)
    const pirepDetails = await db
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
      .limit(5);

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

async function getNotams() {
  try {
    // Get count of NOTAMs
    const countResult = await db.select({ count: sql`count(*)` }).from(notams);
    const notamCount = countResult[ 0 ]?.count || 0;
    // Fetch all NOTAMs ordered by issued date (newest first)
    const allNotams = await db.select().from(notams).orderBy(notams.issued);
    return {
      data: allNotams,
      count: notamCount,
      cached: notamCount > 0
    };
  } catch (error) {
    console.error('Error fetching NOTAMs:', error);
    return { data: [], count: 0, cached: false };
  }
}

export default async function ProfileContainer({ user }) {
  if (!user) return null

  const [ userData, notamsData ] = await Promise.all([
    getUserData(user.callsign),
    getNotams()
  ])

  if (!userData) return null

  return (
    <>
      <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={1}>
        <BasicInfo
          ifcName={userData.ifcName}
          image={user.image}
          flightTime={userData.flightTime}
          rank={userData.rank}
        />
        <Notams notams={notamsData.data} />
      </Grid>
      <PirepsTable pireps={userData.pireps} />
    </>
  )
}
