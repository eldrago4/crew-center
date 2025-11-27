// app/components/dashboard/ProfileContainer.jsx
import BasicInfo from './BasicInfo'
import PirepsTable from './PirepsTable'
import Notams from './Notams'
import { Grid, Box, Stack, Heading, Text, Button, Link, Badge, HStack, Container } from '@chakra-ui/react'
import SignupOrFileButton from './SignupOrFileButton'
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
      {/* Promotional box above PIREPs */}
      <Container maxW="100%" py="8" px="4">
        <Box
          borderRadius="xl"
          overflow="hidden"
          position="relative"
          minH={{ base: '220px', md: '160px' }}
          bgGradient={user.image ? undefined : 'linear-gradient(135deg, rgba(99,102,241,0.9), rgba(139,92,246,0.85))'}
          backgroundImage={`url(/fedex.png)`}
          backgroundSize="cover"
          backgroundPosition="center"
          boxShadow="lg"
        >
          <Box position="absolute" inset={0} bg="linear-gradient(180deg, rgba(0,0,0,0.45), rgba(0,0,0,0.25))" />

          <Box position="relative" py={{ base: 4, md: 8 }} pl={{ base: 6, md: 12 }} pr={{ base: 4, md: 8 }} color="white">
            <Stack spacing={3} maxW={{ base: 'full', md: '60%' }}>
              <Heading as="h3" size="md" lineHeight={1.05} letterSpacing="tight">
                INVA Mid-Marathon Hop
              </Heading>
              <Box pb={11}>
                <Badge
                  variant="surface"
                  px={3}
                  py={2}
                  fontSize="sm"
                  borderRadius="md"
                  borderColor="rgba(204, 47, 47, 1)"
                  colorPalette="rgba(204, 47, 47, 1)"
                  display="inline-flex"
                >
                  VECC-VTBS
                </Badge>
              </Box>

              <HStack spacing={4} align="center">
                <Box textAlign="center">
                  <Text fontSize="xs" opacity={0.85}>Multiplier</Text>
                  <Text fontSize={{ base: 'xl', md: '3xl' }} fontWeight="800" lineHeight={1}>
                    4.5x
                  </Text>
                </Box>

                <SignupOrFileButton
                  pushbackIso={'2025-11-29T18:30:00+05:30'}
                  flightNumber={'AIH322'}
                  departureIcao={'VECC'}
                  arrivalIcao={'VTBS'}
                  aircraft={'A320'}
                  signupUrl={'https://discord.com/events/1246895842581938276/1442932626049466418'}
                />
              </HStack>
            </Stack>
          </Box>
          <Box position="absolute" bottom={{ base: 2, md: 6 }} right={{ base: 2, md: 6 }} zIndex={3} display="flex" flexDirection="column" gap={1} alignItems="flex-end">
            <Badge
              colorPalette="purple"
              variant="subtle"
              px={{ base: 1, md: 3 }}
              py={{ base: 0.5, md: 2 }}
              fontSize={{ base: '2xs', md: 'sm' }}
              borderRadius="md"
              display="inline-flex"
              whiteSpace="nowrap"
              overflow="hidden"
              textOverflow="ellipsis"
              maxW="max-content"
            >
              A320 (Air India) · 2.4 hours
            </Badge>

            <Badge
              colorPalette="purple"
              variant="subtle"
              px={{ base: 1, md: 3 }}
              py={{ base: 0.5, md: 2 }}
              fontSize={{ base: '2xs', md: 'sm' }}
              borderRadius="md"
              display="inline-flex"
              whiteSpace="nowrap"
              overflow="hidden"
              textOverflow="ellipsis"
              maxW="max-content"
            >
              Pushback: Sat, Nov 29 · 18:30 PM IST
            </Badge>
          </Box>

        </Box>
      </Container>
      <PirepsTable pireps={userData.pireps} />
    </>
  )
}
