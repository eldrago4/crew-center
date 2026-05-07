'use client'

import { useState, useEffect } from 'react'
import {
    Box, Flex, Stack, HStack, Heading, Text, Badge,
    Icon, Button, Spinner, Separator,
} from '@chakra-ui/react'
import {
    TbCalendarEvent, TbClock, TbPlane, TbArrowRight,
    TbStar, TbUsers, TbExternalLink,
} from 'react-icons/tb'
import SignupOrFileButton from '@/components/dashboard/SignupOrFileButton'

// Extract Discord event ID from URL like https://discord.com/events/GUILD/EVENT_ID
function extractDiscordEventId(url) {
    if (!url) return null
    const m = url.match(/discord\.com\/events\/\d+\/(\d+)/)
    return m ? m[1] : null
}

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

// Parse Discord timestamp tokens to readable strings
function parseDiscordTimestamps(text) {
    if (!text) return text
    return text.replace(/<t:(\d+)(?::([tTdDfFR]))?>/g, (_, unix, fmt) => {
        const date = new Date(Number(unix) * 1000)
        if (fmt === 'R') {
            const diff = date - Date.now()
            const abs = Math.abs(diff)
            const future = diff > 0
            if (abs < 3_600_000) return `${future ? 'in ' : ''}${Math.round(abs / 60_000)} min${future ? '' : ' ago'}`
            if (abs < 86_400_000) return `${future ? 'in ' : ''}${Math.round(abs / 3_600_000)} hr${future ? '' : ' ago'}`
            return `${future ? 'in ' : ''}${Math.round(abs / 86_400_000)} day${Math.round(abs / 86_400_000) !== 1 ? 's' : ''}${future ? '' : ' ago'}`
        }
        return date.toLocaleString('en-US', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    })
}

function EventCard({ event, discordData }) {
    const pb = fmtPushback(event.pushbackIso)
    const description = discordData?.description ? parseDiscordTimestamps(discordData.description) : null
    const userCount = discordData?.user_count ?? null

    return (
        <Box
            borderRadius="2xl"
            overflow="hidden"
            bg={{ base: 'white', _dark: 'gray.900' }}
            borderWidth="1px"
            borderColor={{ base: 'gray.200', _dark: 'whiteAlpha.100' }}
            shadow={{ base: event.promoted ? 'xl' : 'md', _dark: 'none' }}
            transition="box-shadow 0.2s"
            _hover={{ shadow: { base: '2xl', _dark: 'none' } }}
        >
            {/* ── Banner ── */}
            <Box position="relative" h={{ base: '220px', md: '340px' }} overflow="hidden">
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
                        style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)' }}
                        display="flex" alignItems="center" justifyContent="center"
                    >
                        <Icon as={TbCalendarEvent} boxSize={20} color="whiteAlpha.200" />
                    </Box>
                )}
                {/* Scrim */}
                <Box position="absolute" inset={0} style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 45%, transparent 75%)' }} />

                {/* Top badges */}
                <HStack position="absolute" top={4} left={4} gap={2} flexWrap="wrap">
                    {event.promoted && (
                        <HStack bg="purple.500" px={3} py={1.5} borderRadius="full" gap={1.5}>
                            <Icon as={TbStar} boxSize={3} color="white" />
                            <Text fontSize="xs" fontWeight="bold" color="white" textTransform="uppercase" letterSpacing="wider">Featured</Text>
                        </HStack>
                    )}
                    {userCount != null && (
                        <HStack bg="blackAlpha.700" backdropFilter="blur(6px)" px={3} py={1.5} borderRadius="full" gap={1.5}>
                            <Icon as={TbUsers} boxSize={3.5} color="white" />
                            <Text fontSize="xs" fontWeight="semibold" color="white">{userCount} interested</Text>
                        </HStack>
                    )}
                </HStack>

                {/* Multiplier badge top-right */}
                {event.multiplier && Number(event.multiplier) > 1 && (
                    <Box
                        position="absolute" top={4} right={4}
                        bg="amber.400" color="gray.900"
                        px={4} py={1.5} borderRadius="full"
                        fontSize="lg" fontWeight="black" lineHeight="1"
                    >
                        {event.multiplier}×
                    </Box>
                )}

                {/* Title on image */}
                <Box position="absolute" bottom={0} left={0} right={0} px={6} pb={5}>
                    <Text
                        fontSize={{ base: '2xl', md: '3xl' }}
                        fontWeight="bold"
                        color="white"
                        lineHeight="1.15"
                        letterSpacing="tight"
                        noOfLines={2}
                    >
                        {event.title}
                    </Text>
                </Box>
            </Box>

            {/* ── Body ── */}
            <Stack gap={5} p={6}>
                {/* Route + flight meta row */}
                <Flex gap={4} align="center" flexWrap="wrap">
                    <HStack
                        bg={{ base: 'gray.50', _dark: 'whiteAlpha.50' }}
                        px={4} py={2.5}
                        borderRadius="xl"
                        borderWidth="1px"
                        borderColor={{ base: 'gray.150', _dark: 'whiteAlpha.100' }}
                        gap={3}
                    >
                        <Text fontFamily="mono" fontWeight="bold" fontSize="xl" color="fg" letterSpacing="wider">
                            {event.departureIcao || '—'}
                        </Text>
                        <Icon as={TbArrowRight} boxSize={5} color="purple.500" />
                        <Text fontFamily="mono" fontWeight="bold" fontSize="xl" color="fg" letterSpacing="wider">
                            {event.arrivalIcao || '—'}
                        </Text>
                    </HStack>

                    {event.flightNumber && (
                        <Badge colorPalette="purple" variant="subtle" px={3} py={1.5} borderRadius="full" fontSize="sm" fontFamily="mono" fontWeight="bold">
                            {event.flightNumber}
                        </Badge>
                    )}

                    {event.aircraft && (
                        <HStack color="fg.muted" gap={1.5}>
                            <Icon as={TbPlane} boxSize={4} />
                            <Text fontSize="sm" fontWeight="medium">{event.aircraft}</Text>
                        </HStack>
                    )}

                    {event.flightTime && (
                        <HStack color="fg.muted" gap={1.5}>
                            <Icon as={TbClock} boxSize={4} />
                            <Text fontSize="sm" fontWeight="medium">{event.flightTime} hrs</Text>
                        </HStack>
                    )}
                </Flex>

                {/* Pushback */}
                {pb && (
                    <HStack
                        bg={{ base: 'purple.50', _dark: 'purple.950' }}
                        px={4} py={3}
                        borderRadius="xl"
                        borderWidth="1px"
                        borderColor={{ base: 'purple.100', _dark: 'purple.800' }}
                        gap={3}
                    >
                        <Icon as={TbCalendarEvent} boxSize={5} color="purple.500" flexShrink={0} />
                        <Box>
                            <Text fontSize="sm" fontWeight="bold" color={{ base: 'purple.800', _dark: 'purple.200' }}>{pb.date}</Text>
                            <Text fontSize="xs" color={{ base: 'purple.600', _dark: 'purple.400' }}>{pb.time}</Text>
                        </Box>
                    </HStack>
                )}

                {/* Discord description */}
                {description && (
                    <>
                        <Separator borderColor={{ base: 'gray.100', _dark: 'whiteAlpha.100' }} />
                        <Text
                            fontSize="sm"
                            color={{ base: 'gray.700', _dark: 'gray.300' }}
                            lineHeight="1.75"
                            whiteSpace="pre-wrap"
                        >
                            {description}
                        </Text>
                    </>
                )}

                {/* CTA row */}
                <HStack gap={3} pt={1} flexWrap="wrap">
                    <SignupOrFileButton
                        pushbackIso={event.pushbackIso}
                        flightNumber={event.flightNumber}
                        departureIcao={event.departureIcao}
                        arrivalIcao={event.arrivalIcao}
                        aircraft={event.aircraft}
                        signupUrl={event.signupUrl}
                    />
                    {event.signupUrl && (
                        <Button
                            as="a"
                            href={event.signupUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="outline"
                            colorPalette="gray"
                            size="md"
                            borderRadius="full"
                        >
                            <Icon as={TbExternalLink} boxSize={4} />
                            View on Discord
                        </Button>
                    )}
                </HStack>
            </Stack>
        </Box>
    )
}

export default function EventsPage() {
    const [events, setEvents] = useState([])
    const [discordMap, setDiscordMap] = useState({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            // Fetch INVA events
            const evRes = await fetch('/api/crewcenter?module=events').catch(() => null)
            const evData = evRes?.ok ? await evRes.json() : []
            const evList = Array.isArray(evData) ? evData : []

            // Sort: promoted first, then by pushback
            evList.sort((a, b) => {
                if (a.promoted && !b.promoted) return -1
                if (!a.promoted && b.promoted) return 1
                return new Date(a.pushbackIso || 0) - new Date(b.pushbackIso || 0)
            })
            setEvents(evList)

            // Fetch Discord events to cross-reference description + user_count
            const dRes = await fetch('/api/discord-events').catch(() => null)
            const dList = dRes?.ok ? await dRes.json() : []
            const map = {}
            for (const de of (Array.isArray(dList) ? dList : [])) {
                map[de.id] = de
            }
            // Also map by extracting ID from signupUrl for events not already matched
            for (const ev of evList) {
                const id = extractDiscordEventId(ev.signupUrl)
                if (id && map[id]) {
                    // keyed by INVA event id for easy lookup in render
                    map[ev.id] = map[id]
                }
            }
            setDiscordMap(map)
            setLoading(false)
        }
        load()
    }, [])

    return (
        <Box px={{ base: 4, md: 6 }} py={8} maxW="960px" mx="auto">
            {/* Header */}
            <Stack gap={1} mb={8}>
                <Heading size="3xl" fontWeight="bold" letterSpacing="tight" color="fg">Events</Heading>
                <Text color="fg.muted">
                    Multiplier events and community operations · {events.length} active
                </Text>
            </Stack>

            {loading && (
                <Flex justify="center" align="center" h="40vh">
                    <Spinner size="xl" color="purple.500" />
                </Flex>
            )}

            {!loading && events.length === 0 && (
                <Flex direction="column" align="center" justify="center" h="40vh" gap={3}>
                    <Icon as={TbCalendarEvent} boxSize={16} color="fg.subtle" />
                    <Text color="fg.muted" fontWeight="medium">No events right now. Check back soon.</Text>
                </Flex>
            )}

            {!loading && events.length > 0 && (
                <Stack gap={6}>
                    {events.map(event => (
                        <EventCard
                            key={event.id || event.title}
                            event={event}
                            discordData={discordMap[event.id]}
                        />
                    ))}
                </Stack>
            )}
        </Box>
    )
}
