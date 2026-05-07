import { Box, Flex, Grid, Heading, Text, Badge, HStack, Stack, Icon } from '@chakra-ui/react'
import { TbCalendarEvent, TbClock, TbPlane, TbArrowRight, TbStar } from 'react-icons/tb'
import { fetchModuleValue } from '@/app/(crew)/crew/pireps/file/fleetModule'
import SignupOrFileButton from '@/components/dashboard/SignupOrFileButton'

function fmtPushback(iso) {
    if (!iso) return null
    try {
        const d = new Date(iso.replace('+5:30', ''))
        return {
            date: d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }),
            time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }) + ' IST',
        }
    } catch {
        return null
    }
}

function EventCard({ event, featured = false }) {
    const pb = fmtPushback(event.pushbackIso)

    return (
        <Box
            borderRadius="2xl"
            overflow="hidden"
            bg={{ base: 'white', _dark: 'gray.800' }}
            borderWidth="1px"
            borderColor={{ base: event.promoted ? 'purple.200' : 'gray.150', _dark: event.promoted ? 'purple.700' : 'whiteAlpha.100' }}
            shadow={event.promoted ? 'lg' : 'sm'}
            display="flex"
            flexDirection="column"
            h="100%"
            position="relative"
            _dark={{ shadow: 'none' }}
        >
            {/* Banner */}
            <Box
                position="relative"
                h={featured ? { base: '220px', md: '300px' } : '200px'}
                overflow="hidden"
                flexShrink={0}
            >
                {event.banner ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={event.banner}
                        alt={event.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                ) : (
                    <Box
                        w="100%" h="100%"
                        bgGradient="linear(135deg, {colors.purple.600}, {colors.blue.500})"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Icon as={TbCalendarEvent} boxSize={16} color="whiteAlpha.300" />
                    </Box>
                )}
                {/* Gradient overlay */}
                <Box
                    position="absolute"
                    inset={0}
                    bgGradient="linear(to-t, blackAlpha.800 0%, blackAlpha.300 40%, transparent 70%)"
                />

                {/* Promoted badge */}
                {event.promoted && (
                    <HStack
                        position="absolute"
                        top={3}
                        left={3}
                        bg="purple.500"
                        px={3}
                        py={1}
                        borderRadius="full"
                        gap={1.5}
                    >
                        <Icon as={TbStar} boxSize={3} color="white" />
                        <Text fontSize="xs" fontWeight="bold" color="white" letterSpacing="wider" textTransform="uppercase">
                            Featured
                        </Text>
                    </HStack>
                )}

                {/* Multiplier badge */}
                {event.multiplier && Number(event.multiplier) > 1 && (
                    <Box
                        position="absolute"
                        top={3}
                        right={3}
                        bg="amber.400"
                        color="gray.900"
                        px={3}
                        py={1}
                        borderRadius="full"
                        fontSize="sm"
                        fontWeight="black"
                    >
                        {event.multiplier}×
                    </Box>
                )}

                {/* Title over image */}
                <Box position="absolute" bottom={0} left={0} right={0} px={5} pb={4}>
                    <Text
                        fontSize={featured ? { base: 'xl', md: '2xl' } : 'lg'}
                        fontWeight="bold"
                        color="white"
                        lineHeight="1.2"
                        letterSpacing="tight"
                        noOfLines={2}
                    >
                        {event.title}
                    </Text>
                </Box>
            </Box>

            {/* Body */}
            <Stack gap={4} p={5} flex={1}>
                {/* Route pill */}
                <HStack
                    gap={2}
                    bg={{ base: 'gray.50', _dark: 'whiteAlpha.50' }}
                    px={3}
                    py={2}
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor={{ base: 'gray.100', _dark: 'whiteAlpha.100' }}
                    alignSelf="flex-start"
                    flexWrap="wrap"
                >
                    <Text fontFamily="mono" fontWeight="bold" fontSize="sm" color="fg">
                        {event.departureIcao || '—'}
                    </Text>
                    <Icon as={TbArrowRight} boxSize={4} color="purple.500" />
                    <Text fontFamily="mono" fontWeight="bold" fontSize="sm" color="fg">
                        {event.arrivalIcao || '—'}
                    </Text>
                    {event.route && (
                        <Text fontSize="xs" color="fg.muted" fontFamily="mono">{event.route}</Text>
                    )}
                </HStack>

                {/* Metadata grid */}
                <Grid templateColumns="1fr 1fr" gap={3}>
                    {event.flightNumber && (
                        <Stack gap={0}>
                            <Text fontSize="9px" fontWeight="bold" color="fg.muted" textTransform="uppercase" letterSpacing="widest">Flight</Text>
                            <Text fontSize="sm" fontWeight="semibold" fontFamily="mono" color="fg">{event.flightNumber}</Text>
                        </Stack>
                    )}
                    {event.aircraft && (
                        <Stack gap={0}>
                            <Text fontSize="9px" fontWeight="bold" color="fg.muted" textTransform="uppercase" letterSpacing="widest">Aircraft</Text>
                            <HStack gap={1}>
                                <Icon as={TbPlane} boxSize={3.5} color="purple.500" />
                                <Text fontSize="sm" fontWeight="semibold" fontFamily="mono" color="fg">{event.aircraft}</Text>
                            </HStack>
                        </Stack>
                    )}
                    {event.flightTime && (
                        <Stack gap={0}>
                            <Text fontSize="9px" fontWeight="bold" color="fg.muted" textTransform="uppercase" letterSpacing="widest">Flight Time</Text>
                            <HStack gap={1}>
                                <Icon as={TbClock} boxSize={3.5} color="purple.500" />
                                <Text fontSize="sm" fontWeight="semibold" color="fg">{event.flightTime} hrs</Text>
                            </HStack>
                        </Stack>
                    )}
                    {event.multiplier && Number(event.multiplier) > 1 && (
                        <Stack gap={0}>
                            <Text fontSize="9px" fontWeight="bold" color="fg.muted" textTransform="uppercase" letterSpacing="widest">Multiplier</Text>
                            <Text fontSize="sm" fontWeight="black" color="amber.500">{event.multiplier}× XP Boost</Text>
                        </Stack>
                    )}
                </Grid>

                {/* Pushback */}
                {pb && (
                    <Box
                        bg={{ base: 'purple.50', _dark: 'purple.950' }}
                        borderRadius="lg"
                        px={3}
                        py={2.5}
                        borderWidth="1px"
                        borderColor={{ base: 'purple.100', _dark: 'purple.800' }}
                    >
                        <Text fontSize="9px" fontWeight="bold" color="purple.500" textTransform="uppercase" letterSpacing="widest" mb={0.5}>Pushback</Text>
                        <Text fontSize="sm" fontWeight="semibold" color={{ base: 'purple.800', _dark: 'purple.200' }}>{pb.date}</Text>
                        <Text fontSize="xs" color={{ base: 'purple.600', _dark: 'purple.400' }}>{pb.time}</Text>
                    </Box>
                )}

                {/* CTA */}
                <Box mt="auto">
                    <SignupOrFileButton
                        pushbackIso={event.pushbackIso}
                        flightNumber={event.flightNumber}
                        departureIcao={event.departureIcao}
                        arrivalIcao={event.arrivalIcao}
                        aircraft={event.aircraft}
                        signupUrl={event.signupUrl}
                    />
                </Box>
            </Stack>
        </Box>
    )
}

export default async function EventsPage() {
    let events = []
    try {
        const data = await fetchModuleValue('events')
        events = Array.isArray(data) ? data : []
    } catch { events = [] }

    // Promoted first, then sort by pushback date ascending
    const sorted = [...events].sort((a, b) => {
        if (a.promoted && !b.promoted) return -1
        if (!a.promoted && b.promoted) return 1
        return new Date(a.pushbackIso || 0) - new Date(b.pushbackIso || 0)
    })

    const featured = sorted.find(e => e.promoted)
    const rest = sorted.filter(e => !e.promoted)

    return (
        <Box px={{ base: 4, md: 6 }} py={8} maxW="1400px" mx="auto">
            {/* Header */}
            <Stack gap={1} mb={8}>
                <Heading size="2xl" fontWeight="bold" letterSpacing="tight" color="fg">Events</Heading>
                <Text color="fg.muted" fontSize="sm">
                    Scheduled flights, multiplier events and community operations · {sorted.length} active
                </Text>
            </Stack>

            {sorted.length === 0 && (
                <Flex direction="column" align="center" justify="center" h="40vh" gap={3}>
                    <Icon as={TbCalendarEvent} boxSize={16} color="fg.subtle" />
                    <Text color="fg.muted" fontWeight="medium">No events right now. Check back soon.</Text>
                </Flex>
            )}

            {/* Featured event — full row */}
            {featured && (
                <Box mb={6}>
                    <EventCard event={featured} featured />
                </Box>
            )}

            {/* Remaining events */}
            {rest.length > 0 && (
                <Grid
                    templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }}
                    gap={5}
                    alignItems="start"
                >
                    {rest.map(event => (
                        <EventCard key={event.id || event.title} event={event} />
                    ))}
                </Grid>
            )}
        </Box>
    )
}
