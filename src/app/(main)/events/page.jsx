'use client'
import { useState, useEffect } from 'react'
import {
    Box, Flex, Grid, Heading, Text, Badge,
    Spinner, VStack, HStack, Button,
} from '@chakra-ui/react'
import { FaCalendar, FaClock, FaLocationDot, FaUsers, FaDiscord } from 'react-icons/fa6'

// ── Discord timestamp parser ─────────────────────────────────
// Converts <t:UNIX:FORMAT> tokens to readable strings
function parseDiscordTimestamps(text) {
    return text.replace(/<t:(\d+)(?::([tTdDfFR]))?>/g, (_, unix, fmt) => {
        const date = new Date(Number(unix) * 1000)
        switch (fmt) {
            case 't':
                return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            case 'T':
                return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            case 'd':
                return date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })
            case 'D':
                return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
            case 'R': {
                const diff = date - Date.now()
                const abs = Math.abs(diff)
                const future = diff > 0
                if (abs < 60_000) return future ? 'in a few seconds' : 'a few seconds ago'
                if (abs < 3_600_000) return `${future ? 'in ' : ''}${Math.round(abs / 60_000)} min${future ? '' : ' ago'}`
                if (abs < 86_400_000) return `${future ? 'in ' : ''}${Math.round(abs / 3_600_000)} hr${future ? '' : ' ago'}`
                return `${future ? 'in ' : ''}${Math.round(abs / 86_400_000)} days${future ? '' : ' ago'}`
            }
            default: // f / F / undefined — full date + time
                return date.toLocaleString('en-US', {
                    weekday: 'short', day: 'numeric', month: 'short',
                    year: 'numeric', hour: '2-digit', minute: '2-digit',
                })
        }
    })
}

// Renders description text safely as React nodes (no dangerouslySetInnerHTML)
// Handles: Discord timestamps, **bold**, @mentions, line breaks
function DescriptionBody({ raw }) {
    if (!raw) return null
    const withDates = parseDiscordTimestamps(raw)

    // Split on **bold** spans
    const segments = withDates.split(/(\*\*[^*]+\*\*)/)

    return (
        <>
            {segments.map((seg, i) => {
                if (seg.startsWith('**') && seg.endsWith('**')) {
                    return <strong key={i}>{seg.slice(2, -2)}</strong>
                }
                // Within plain text, colour @mentions
                const parts = seg.split(/(@\S+)/)
                return parts.map((p, j) =>
                    p.startsWith('@')
                        ? <Box key={`${i}-${j}`} as="span" color="#5865F2" fontWeight="medium">{p}</Box>
                        : <span key={`${i}-${j}`}>{p}</span>
                )
            })}
        </>
    )
}

const STATUS = {
    1: { label: 'Upcoming', palette: 'green' },
    2: { label: 'Live Now', palette: 'red' },
    3: { label: 'Ended',    palette: 'gray' },
    4: { label: 'Cancelled',palette: 'gray' },
}

// ── Event card ───────────────────────────────────────────────
function EventCard({ event }) {
    const [expanded, setExpanded] = useState(false)

    const imageUrl = event.image
        ? `https://cdn.discordapp.com/guild-events/${event.id}/${event.image}.png?size=1024`
        : null

    const start = new Date(event.scheduled_start_time)
    const end   = event.scheduled_end_time ? new Date(event.scheduled_end_time) : null
    const status = STATUS[event.status] ?? { label: 'Unknown', palette: 'gray' }
    const isLong = (event.description || '').length > 280

    const fmtTime = (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })
    const fmtDate = (d) => d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

    return (
        <Box
            bg="whiteAlpha.800"
            backdropFilter="blur(8px)"
            rounded="2xl"
            shadow="md"
            border="1px solid"
            borderColor="whiteAlpha.700"
            overflow="hidden"
            display="flex"
            flexDirection="column"
            transition="all 0.3s ease"
            _hover={{ shadow: '2xl' }}
        >
            {/* Banner */}
            {imageUrl ? (
                <Box position="relative" h="180px" flexShrink={0}>
                    <img src={imageUrl} alt={event.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <Box position="absolute" inset={0} bgGradient="linear(to-t, blackAlpha.500, transparent)" />
                    {event.status === 2 && (
                        <Badge
                            position="absolute" top={3} left={3}
                            colorPalette="red" variant="solid"
                            rounded="full" px={3} py={1} fontSize="xs"
                        >
                            🔴 LIVE
                        </Badge>
                    )}
                </Box>
            ) : null}

            <Box p={5} flex={1} display="flex" flexDirection="column" gap={3}>
                {/* Badges row */}
                <HStack gap={2} flexWrap="wrap">
                    {!imageUrl && event.status === 2 && (
                        <Badge colorPalette="red" variant="solid" rounded="full" px={3} fontSize="xs">🔴 LIVE</Badge>
                    )}
                    <Badge colorPalette={status.palette} variant="subtle" rounded="full" px={3} fontSize="xs">
                        {status.label}
                    </Badge>
                    {event.user_count != null && (
                        <HStack gap={1} bg="gray.100" px={3} py={0.5} rounded="full" fontSize="xs" color="gray.600">
                            <FaUsers size="0.7rem" />
                            <Text>{event.user_count} interested</Text>
                        </HStack>
                    )}
                </HStack>

                {/* Title */}
                <Heading
                    as="h3"
                    fontSize={{ base: 'md', md: 'lg' }}
                    fontWeight="bold"
                    fontFamily="'Playfair Display', serif"
                    lineHeight="1.35"
                    color="gray.800"
                >
                    {event.name}
                </Heading>

                {/* Meta */}
                <VStack align="start" gap={1.5} fontSize="sm" color="gray.600">
                    <HStack gap={2}>
                        <Box color="#ff6b35" flexShrink={0}><FaCalendar size="0.8rem" /></Box>
                        <Text>{fmtDate(start)}</Text>
                    </HStack>
                    <HStack gap={2}>
                        <Box color="#ff6b35" flexShrink={0}><FaClock size="0.8rem" /></Box>
                        <Text>
                            {fmtTime(start)}
                            {end && ` → ${fmtTime(end)}`}
                        </Text>
                    </HStack>
                    {event.entity_metadata?.location && (
                        <HStack gap={2}>
                            <Box color="#ff6b35" flexShrink={0}><FaLocationDot size="0.8rem" /></Box>
                            <Text>{event.entity_metadata.location}</Text>
                        </HStack>
                    )}
                </VStack>

                {/* Description */}
                {event.description && (
                    <Box mt="auto" pt={2} borderTop="1px solid" borderColor="gray.100">
                        <Box
                            fontSize="sm"
                            color="gray.700"
                            lineHeight="1.75"
                            whiteSpace="pre-wrap"
                            maxH={expanded ? 'none' : '96px'}
                            overflow="hidden"
                        >
                            <DescriptionBody raw={event.description} />
                        </Box>
                        {isLong && (
                            <Button
                                variant="ghost"
                                size="xs"
                                color="#ff6b35"
                                mt={1}
                                px={0}
                                h="auto"
                                onClick={() => setExpanded(v => !v)}
                                _hover={{ bg: 'transparent', textDecoration: 'underline' }}
                            >
                                {expanded ? 'Show less ↑' : 'Show more ↓'}
                            </Button>
                        )}
                    </Box>
                )}
            </Box>
        </Box>
    )
}

// ── Page ─────────────────────────────────────────────────────
export default function EventsPage() {
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetch('/api/discord-events')
            .then(r => r.ok ? r.json() : Promise.reject(r.status))
            .then(data => { setEvents(data); setLoading(false) })
            .catch(e => { setError(String(e)); setLoading(false) })
    }, [])

    return (
        <Box position="relative" minH="100vh" overflowX="hidden">
            {/* Background */}
            <Box position="fixed" inset={0} zIndex={-1}>
                <Box position="absolute" inset={0} bgGradient="linear(to-br, orange.50, white, purple.50)" />
                <Box position="absolute" inset={0} bgGradient="linear(to-t, whiteAlpha.700, transparent)" />
            </Box>

            <Box as="main" maxW="7xl" mx="auto" px={{ base: 4, lg: 8 }} py={12}>
                {/* Header */}
                <VStack mb={12} textAlign="center" gap={3}>
                    <HStack
                        display="inline-flex"
                        bg="whiteAlpha.800"
                        backdropFilter="blur(4px)"
                        px={4} py={2}
                        rounded="full"
                        shadow="md"
                    >
                        <Box color="#5865F2"><FaDiscord size="1rem" /></Box>
                        <Text color="#5865F2" fontWeight="semibold" fontSize="sm">Discord Events</Text>
                    </HStack>

                    <Heading
                        as="h1"
                        fontSize={{ base: '4xl', lg: '5xl' }}
                        fontWeight="black"
                        letterSpacing="tight"
                        fontFamily="'Playfair Display', serif"
                    >
                        Upcoming Events
                    </Heading>
                    <Text color="gray.600" fontSize="lg" maxW="xl" lineHeight="relaxed">
                        Join us in the virtual skies — scheduled flights, multiplier events, and more.
                    </Text>
                </VStack>

                {/* States */}
                {loading && (
                    <Flex justify="center" py={24}>
                        <Spinner size="xl" color="#ff6b35" />
                    </Flex>
                )}

                {error && (
                    <Flex justify="center" py={24}>
                        <Text color="red.500">Failed to load events. Please try again later.</Text>
                    </Flex>
                )}

                {!loading && !error && events.length === 0 && (
                    <Flex direction="column" align="center" justify="center" py={24} gap={3}>
                        <Text fontSize="5xl">✈️</Text>
                        <Text color="gray.500" fontWeight="medium" fontSize="lg">
                            No upcoming events right now. Check back soon!
                        </Text>
                    </Flex>
                )}

                {!loading && !error && events.length > 0 && (
                    <Grid
                        templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }}
                        gap={6}
                        alignItems="start"
                    >
                        {events.map(event => (
                            <EventCard key={event.id} event={event} />
                        ))}
                    </Grid>
                )}
            </Box>
        </Box>
    )
}
