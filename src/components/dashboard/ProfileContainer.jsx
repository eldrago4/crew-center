// app/components/dashboard/ProfileContainer.jsx
import BasicInfo from './BasicInfo'
import PirepsTable from './PirepsTable'
import { Box, Stack, Heading, Text, Button, Link, Badge, HStack, Container, Flex } from '@chakra-ui/react'
import SignupOrFileButton from './SignupOrFileButton'
import db from '@/db/client'
import { users, pireps, notams, crewcenter } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { cacheLife, cacheTag } from 'next/cache'
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
// load. 'use cache: remote' (the durable platform cache shared across instances —
// successor to the unstable_cache used before) collapses that to once per window
// for the whole crew. Error fallbacks live OUTSIDE the cached scope so a transient
// DB failure is never pinned for the whole window — a thrown error is not cached.
async function getNotamsCached() {
  'use cache: remote'
  cacheLife({ revalidate: 300, expire: 3600 })
  cacheTag('notams')
  // A count(*) used to run alongside this purely to populate `count`/`cached`,
  // which nothing downstream reads — the rows are the answer.
  const allNotams = await db.select().from(notams).orderBy(notams.issued);
  return { data: allNotams };
}

async function getNotams() {
  try {
    return await getNotamsCached();
  } catch (error) {
    console.error('Error fetching NOTAMs:', error);
    return { data: [] };
  }
}

async function getPromotedEventCached() {
  'use cache: remote'
  cacheLife({ revalidate: 300, expire: 3600 })
  cacheTag('events')
  const result = await db.select().from(crewcenter).where(eq(crewcenter.module, 'events'));
  if (result.length === 0) {
    return null;
  }
  const events = result[ 0 ].value;
  const promotedEvent = events.find(event => event.promoted);
  return promotedEvent || null;
}

async function getPromotedEvent() {
  try {
    return await getPromotedEventCached();
  } catch (error) {
    console.error('Error fetching promoted event:', error);
    return null;
  }
}

export default async function ProfileContainer({ user }) {
  if (!user) return null
  const userDiscordId = user.discordId || user.id

  const [ userData, notamsData, promotedEvent, lotusStatus ] = await Promise.all([
    getUserData(user.callsign),
    getNotams(),
    getPromotedEvent(),
    userDiscordId ? getLotusStatus(userDiscordId).catch(() => null) : null
  ])

  if (!userData) return null

  return (
    <>
      {lotusStatus?.needsPayment && (
        <Container maxW="100%" py="4" px="4">
          <Box
            borderRadius="xl"
            border="1px solid rgba(201,169,110,0.35)"
            bg="linear-gradient(135deg, rgba(201,169,110,0.16), rgba(99,102,241,0.10))"
            px={{ base: 4, md: 6 }}
            py={4}
          >
            <Flex direction={{ base: 'column', md: 'row' }} align={{ base: 'flex-start', md: 'center' }} justify="space-between" gap={3}>
              <Box>
                <Text fontWeight="800" color={{ base: 'gray.900', _dark: 'white' }}>
                  Lotus Privé pledge due for this month
                </Text>
                <Text fontSize="sm" color={{ base: 'gray.700', _dark: 'gray.300' }} mt={1}>
                  Keep your Lotus Privé seat and Discord role active by completing this month&apos;s ₹{lotusStatus.priceRupees} UPI pledge within the first week.
                </Text>
              </Box>
              <Button as={Link} href="/crew/chanda?lotus=pay" colorPalette="yellow" variant="solid" borderRadius="xl" fontWeight="800">
                Pay now
              </Button>
            </Flex>
          </Box>
        </Container>
      )}
      <BasicInfo
        ifcName={userData.ifcName}
        image={user.image}
        flightTime={userData.flightTime}
        rank={userData.rank}
        badgePayload={{ badges: Array.isArray(userData.badges) ? userData.badges : [] }}
        lotusStatus={lotusStatus}
        notams={notamsData.data}
      />
      {/* Promotional box above PIREPs */}
      {promotedEvent && (
        <Container maxW="100%" py="8" px="4">
          <Box
            borderRadius="xl"
            overflow="hidden"
            position="relative"
            minH={{ base: '220px', md: '160px' }}
            bgGradient={user.image ? undefined : 'linear-gradient(135deg, rgba(99,102,241,0.9), rgba(139,92,246,0.85))'}
            backgroundImage={promotedEvent.banner ? `url(${promotedEvent.banner})` : `url(/fedex.png)`}
            backgroundSize="cover"
            backgroundPosition="center"
            boxShadow="lg"
          >
            <Box position="absolute" inset={0} bg="linear-gradient(180deg, rgba(0,0,0,0.45), rgba(0,0,0,0.25))" />

            <Box position="relative" py={{ base: 4, md: 8 }} pl={{ base: 6, md: 12 }} pr={{ base: 4, md: 8 }} color="white">
              <Stack spacing={3} maxW={{ base: 'full', md: '60%' }}>
                <Heading as="h3" size="md" lineHeight={1.05} letterSpacing="tight">
                  {promotedEvent.title}
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
                    {promotedEvent.route}
                  </Badge>
                </Box>

                <HStack spacing={4} align="center">
                  <Box textAlign="center">
                    <Text fontSize="xs" opacity={0.85}>Multiplier</Text>
                    <Text fontSize={{ base: 'xl', md: '3xl' }} fontWeight="800" lineHeight={1}>
                      {promotedEvent.multiplier}x
                    </Text>
                  </Box>

                  <SignupOrFileButton
                    pushbackIso={promotedEvent.pushbackIso}
                    flightNumber={promotedEvent.flightNumber}
                    departureIcao={promotedEvent.departureIcao}
                    arrivalIcao={promotedEvent.arrivalIcao}
                    aircraft={promotedEvent.aircraft}
                    signupUrl={promotedEvent.signupUrl}
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
                {promotedEvent.aircraft} · {promotedEvent.flightTime ? `${promotedEvent.flightTime} hours` : 'TBD'}
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
                Pushback: {promotedEvent.pushbackIso ? new Date(promotedEvent.pushbackIso.replace('+5:30', '')).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'TBD'} · {promotedEvent.pushbackIso ? new Date(promotedEvent.pushbackIso.replace('+5:30', '')).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'TBD'} IST
              </Badge>
            </Box>

          </Box>
        </Container>
      )}
      <PirepsTable pireps={userData.pireps} />
    </>
  )
}
