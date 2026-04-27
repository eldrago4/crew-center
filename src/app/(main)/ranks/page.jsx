'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Box, Grid, Heading, Text, HStack, VStack, Flex } from '@chakra-ui/react'

// ── Design tokens ────────────────────────────────────────────
const PRIMARY  = '#2b4bee'
const SAFFRON  = '#FF9933'
const BRONZE   = '#CD7F32'
const GOLD     = '#D4AF37'
const AMBER    = '#f59e0b'

// ── Data ─────────────────────────────────────────────────────
const ranks = [
    {
        name: 'Yuvraj',
        hours: '0 Hours',
        desc: 'Your wings are born. Command regional jets across domestic sectors and lay the foundation of your career.',
        cardBg: 'linear-gradient(135deg, #ffedd5 0%, #fff7ed 100%)',
        icon: '🎖️',
        accent: BRONZE,
        aircraft: ['A220', 'A320', 'Dash 8', 'E-Jets', 'CRJ'],
        wp: { x: 25, y: 32 },
    },
    {
        name: 'Rajkumar',
        hours: '80 Hours',
        desc: 'Step onto the mainline. The B737 and A321 open up high-frequency trunk routes across the subcontinent.',
        cardBg: 'linear-gradient(135deg, #eff6ff 0%, #f1f5f9 100%)',
        icon: '🪙',
        accent: '#64748b',
        accentBar: PRIMARY,
        aircraft: ['B38M', 'B737', 'A321'],
        wp: { x: 75, y: 28 },
    },
    {
        name: 'Rajvanshi',
        hours: '160 Hours',
        desc: 'Your first widebody clearance. Cross oceans and continents aboard the A330 and B787 Dreamliner family.',
        cardBg: 'linear-gradient(135deg, #fff7ed 0%, #e2e8f0 100%)',
        icon: '🥈',
        accent: '#64748b',
        accentBar: SAFFRON,
        aircraft: ['B767', 'B757', 'A333', 'A339', 'B788'],
        wp: { x: 62, y: 40 },
    },
    {
        name: 'Rajdhiraj',
        hours: '450 Hours',
        desc: 'Master of the Dreamliner. The B789 and B787-10 represent the pinnacle of modern long-haul efficiency.',
        cardBg: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)',
        icon: '🏆',
        accent: GOLD,
        aircraft: ['B789', 'B787-10'],
        wp: { x: 30, y: 65 },
    },
    {
        name: 'Maharaja',
        hours: '900 Hours',
        desc: 'Command the legends. The 777 and classic 747 take you to the farthest corners of the globe in true wide-body style.',
        cardBg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fef3c7 100%)',
        icon: '👑',
        accent: '#b45309',
        aircraft: ['B77L', 'B77W', 'B744', 'A340'],
        wp: { x: 70, y: 30 },
    },
    {
        name: 'Samrat',
        hours: '1500 Hours',
        desc: 'The Queen of the Skies is yours. The B748 is the ultimate evolution of the iconic 747 — reserved only for elite hands.',
        cardBg: 'linear-gradient(135deg, #eef2ff 0%, #dbeafe 100%)',
        icon: '💎',
        accent: PRIMARY,
        aircraft: ['A359', 'B748'],
        badge: { label: 'ELITE', bg: PRIMARY, color: '#fff' },
        club: {
            name: 'Rajamatya Club',
            desc: '1.25× Flight Hour Multiplier unlocked.',
        },
        wp: { x: 28, y: 72 },
    },
    {
        name: 'Chhatrapati',
        hours: '2000+ Hours',
        desc: 'The A380 — the world\'s largest passenger aircraft. Only the most decorated pilots earn the right to command this flying city.',
        cardBg: 'linear-gradient(135deg, #fde68a 0%, #fef3c7 50%, #fde68a 100%)',
        icon: '🛡️',
        accent: '#d97706',
        aircraft: ['AIRBUS A380'],
        badge: { label: 'LEGENDARY', bg: AMBER, color: '#fff' },
        club: {
            name: 'Akasharatha Club',
            desc: '1.5× Multiplier & Priority Sequence at 2500 hrs.',
            shimmer: true,
        },
        wide: true,
        wp: { x: 42, y: 50 },
    },
]

// ── Path helper ───────────────────────────────────────────────
function buildPath(pts) {
    if (!pts || pts.length < 2) return ''
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
    for (let i = 1; i < pts.length; i++) {
        const p  = pts[i - 1]
        const c  = pts[i]
        const mx = ((p.x + c.x) / 2).toFixed(1)
        d += ` C ${mx} ${p.y.toFixed(1)}, ${mx} ${c.y.toFixed(1)}, ${c.x.toFixed(1)} ${c.y.toFixed(1)}`
    }
    return d
}

// ── Sub-components ───────────────────────────────────────────

function AircraftTag({ label }) {
    return (
        <Box
            as="span"
            fontSize="10px"
            fontWeight="bold"
            px={2} py={1}
            rounded="md"
            border="1px solid"
            borderColor={PRIMARY + '22'}
            color={PRIMARY}
            bg={PRIMARY + '0d'}
            letterSpacing="wide"
        >
            {label}
        </Box>
    )
}

function ClubBadge({ club, accent }) {
    return (
        <Box
            mt={3} p={3}
            rounded="xl"
            bg={accent + '12'}
            border="1px solid"
            borderColor={accent + '30'}
        >
            {club.shimmer && (
                <style>{`
                    @keyframes akasharatha-shimmer {
                        0%   { background-position: -250% center; }
                        100% { background-position: 250% center; }
                    }
                    .akasharatha-shimmer {
                        display: inline-block;
                        background: linear-gradient(
                            90deg,
                            #92400e 0%,
                            #b45309 15%,
                            #d97706 30%,
                            #fbbf24 45%,
                            #fef3c7 50%,
                            #fbbf24 55%,
                            #d97706 70%,
                            #b45309 85%,
                            #92400e 100%
                        );
                        background-size: 250% auto;
                        -webkit-background-clip: text;
                        background-clip: text;
                        -webkit-text-fill-color: transparent;
                        animation: akasharatha-shimmer 7s linear infinite;
                        font-size: 10px;
                        font-weight: bold;
                        text-transform: uppercase;
                        letter-spacing: 0.1em;
                    }
                `}</style>
            )}
            <HStack gap={1.5} mb={1}>
                <Text fontSize="lg">⭐</Text>
                {club.shimmer ? (
                    <span className="akasharatha-shimmer">{club.name}</span>
                ) : (
                    <Text fontSize="10px" fontWeight="bold" color={accent} textTransform="uppercase" letterSpacing="widest">
                        {club.name}
                    </Text>
                )}
            </HStack>
            <Text fontSize="10px" color="gray.600">{club.desc}</Text>
        </Box>
    )
}

function RankPreview({ rank }) {
    return (
        <Box
            h="32"
            w="full"
            mb={6}
            rounded="xl"
            position="relative"
            overflow="hidden"
            style={{ background: rank.cardBg }}
            display="flex"
            alignItems="center"
            justifyContent="center"
        >
            <Text fontSize="5xl" lineHeight={1}>{rank.icon}</Text>
            {rank.accentBar && (
                <Box
                    position="absolute"
                    bottom={0} left={0} right={0}
                    h="3px"
                    style={{ background: rank.accentBar }}
                />
            )}
        </Box>
    )
}

function RankCard({ rank, waypointRef }) {
    const isWide = rank.wide

    return (
        // Outer wrapper — position:relative so waypoint can escape card's overflow:hidden
        <Box
            position="relative"
            gridColumn={isWide ? { base: '1', md: '1 / -1', xl: 'span 2' } : undefined}
        >
            {/* ── Waypoint triangle ── */}
            <div
                ref={waypointRef}
                style={{
                    position: 'absolute',
                    left: `${rank.wp.x}%`,
                    top: `${rank.wp.y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderBottom: '11px solid #ec4899',
                    filter: 'drop-shadow(0 0 5px #ec489999)',
                    zIndex: 10,
                    pointerEvents: 'none',
                }}
            />

            {/* ── Card ── */}
            <Box
                bg="white"
                p={6}
                h="full"
                rounded="xl"
                border="1.5px solid"
                borderColor={rank.badge ? rank.accent + '50' : 'gray.200'}
                shadow={rank.badge ? 'lg' : 'sm'}
                _hover={{ shadow: 'md' }}
                transition="box-shadow 0.2s"
                position="relative"
                overflow="hidden"
            >
                {/* ELITE / LEGENDARY ribbon */}
                {rank.badge && (
                    <Box
                        position="absolute"
                        top={0} right={0}
                        px={3} py={1}
                        borderBottomLeftRadius="lg"
                        fontSize="10px"
                        fontWeight="black"
                        letterSpacing="widest"
                        textTransform="uppercase"
                        color={rank.badge.color}
                        style={{ background: rank.badge.bg }}
                        zIndex={1}
                    >
                        {rank.badge.label}
                    </Box>
                )}

                {isWide ? (
                    /* Wide layout for Chhatrapati */
                    <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
                        <Box
                            minH="160px"
                            rounded="xl"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            position="relative"
                            overflow="hidden"
                            style={{ background: rank.cardBg }}
                        >
                            <Text fontSize="8xl" lineHeight={1}>{rank.icon}</Text>
                        </Box>
                        <Flex direction="column" justify="center">
                            <HStack justify="space-between" align="start" mb={2}>
                                <Heading as="h3" fontSize="2xl" fontWeight="black" fontStyle="italic" color={rank.accent}>
                                    {rank.name}
                                </Heading>
                                <Box
                                    fontSize="11px" fontWeight="bold" px={3} py={1}
                                    rounded="full" bg="#fef3c7" color="#d97706"
                                >
                                    {rank.hours}
                                </Box>
                            </HStack>
                            <Text fontSize="sm" color="gray.600" mb={5}>{rank.desc}</Text>
                            <VStack align="start" gap={3}>
                                <Box>
                                    <Text fontSize="10px" fontWeight="bold" color={rank.accent} textTransform="uppercase" letterSpacing="widest" mb={2}>
                                        The Fleet Jewel
                                    </Text>
                                    <Box
                                        as="span"
                                        fontSize="sm"
                                        fontWeight="black"
                                        px={4} py={1.5}
                                        rounded="md"
                                        color="white"
                                        shadow="sm"
                                        style={{ background: rank.accent }}
                                    >
                                        {rank.aircraft[0]}
                                    </Box>
                                </Box>
                                {rank.club && <ClubBadge club={rank.club} accent={rank.accent} />}
                            </VStack>
                        </Flex>
                    </Grid>
                ) : (
                    /* Standard card layout */
                    <>
                        <RankPreview rank={rank} />
                        <HStack justify="space-between" align="start" mb={1}>
                            <Heading as="h3" fontSize="xl" fontWeight="bold">{rank.name}</Heading>
                            <Box
                                fontSize="10px" fontWeight="bold" px={2} py={1}
                                rounded="md" bg="gray.100" color="gray.600"
                                textTransform="uppercase" whiteSpace="nowrap"
                            >
                                {rank.hours}
                            </Box>
                        </HStack>
                        <Text fontSize="xs" color="gray.600" mb={4}>{rank.desc}</Text>
                        <VStack align="start" gap={2}>
                            <Text fontSize="10px" fontWeight="bold" color={PRIMARY} textTransform="uppercase" letterSpacing="widest">
                                Unlocked Aircraft
                            </Text>
                            <HStack flexWrap="wrap" gap={1.5}>
                                {rank.aircraft.map(a => <AircraftTag key={a} label={a} />)}
                            </HStack>
                            {rank.club && <ClubBadge club={rank.club} accent={rank.accent} />}
                        </VStack>
                    </>
                )}
            </Box>
        </Box>
    )
}

// ── Page ─────────────────────────────────────────────────────
export default function RanksPage() {
    const gridRef = useRef(null)
    const wpRefs  = useRef(ranks.map(() => ({ current: null })))
    const [pts,   setPts]   = useState([])
    const [svgH,  setSvgH]  = useState(0)

    const measure = useCallback(() => {
        if (!gridRef.current) return
        const cr = gridRef.current.getBoundingClientRect()
        const points = wpRefs.current.map(r => {
            if (!r.current) return null
            const br = r.current.getBoundingClientRect()
            return {
                x: br.left + br.width  / 2 - cr.left,
                y: br.top  + br.height / 2 - cr.top,
            }
        }).filter(Boolean)
        setPts(points)
        setSvgH(cr.height)
    }, [])

    useEffect(() => {
        measure()
        const ro = new ResizeObserver(measure)
        if (gridRef.current) ro.observe(gridRef.current)
        return () => ro.disconnect()
    }, [measure])

    const pathD     = buildPath(pts)
    const gradStart = pts[0]                  ?? { x: 0,   y: 0   }
    const gradEnd   = pts[pts.length - 1]     ?? { x: 100, y: 100 }

    return (
        <Box minH="100vh" bg="#f6f6f8" fontFamily="Inter, sans-serif">
            <Box maxW="7xl" mx="auto" px={{ base: 4, lg: 8 }} py={12}>

                {/* Hero */}
                <Box mb={12}>
                    <Heading
                        as="h1"
                        fontSize={{ base: '4xl', md: '5xl' }}
                        fontWeight="black"
                        letterSpacing="tight"
                        mb={4}
                    >
                        Pilot Rank Showcase
                    </Heading>
                    <Text color="gray.500" fontSize="lg" maxW="2xl" lineHeight="relaxed">
                        Master the skies of India. Progress through our prestigious ranks to unlock
                        specialized long-haul aircraft and exclusive club memberships.
                    </Text>
                </Box>

                {/* Grid wrapper — SVG overlay lives here */}
                <Box position="relative" ref={gridRef}>

                    {/* ── Flight route SVG ── */}
                    {pathD && (
                        <svg
                            aria-hidden="true"
                            style={{
                                position: 'absolute',
                                top: 0, left: 0,
                                width: '100%',
                                height: svgH,
                                pointerEvents: 'none',
                                overflow: 'visible',
                                zIndex: 3,
                            }}
                        >
                            <defs>
                                <linearGradient
                                    id="routeGrad"
                                    gradientUnits="userSpaceOnUse"
                                    x1={gradStart.x} y1={gradStart.y}
                                    x2={gradEnd.x}   y2={gradEnd.y}
                                >
                                    <stop offset="0%"   stopColor="#60a5fa" />
                                    <stop offset="35%"  stopColor="#a855f7" />
                                    <stop offset="70%"  stopColor="#f97316" />
                                    <stop offset="100%" stopColor="#f59e0b" />
                                </linearGradient>
                                <filter id="routeGlow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
                                    <feMerge>
                                        <feMergeNode in="blur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>
                            {/* Wide glow halo */}
                            <path
                                d={pathD}
                                fill="none"
                                stroke="url(#routeGrad)"
                                strokeWidth="10"
                                opacity="0.18"
                                filter="url(#routeGlow)"
                            />
                            {/* Thin dashed route line */}
                            <path
                                d={pathD}
                                fill="none"
                                stroke="url(#routeGrad)"
                                strokeWidth="1.5"
                                strokeDasharray="8 5"
                                opacity="0.85"
                            />
                        </svg>
                    )}

                    {/* Rank cards */}
                    <Grid
                        templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' }}
                        gap={6}
                        position="relative"
                        zIndex={2}
                    >
                        {ranks.map((rank, i) => (
                            <RankCard
                                key={rank.name}
                                rank={rank}
                                waypointRef={wpRefs.current[i]}
                            />
                        ))}
                    </Grid>
                </Box>

                {/* Footer stats */}
                <Box mt={20} borderTop="1px solid" borderColor="gray.200" pt={10}>
                    <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={8} textAlign="center">
                        {[
                            { val: '160+', label: 'Active Pilots' },
                            { val: '141k', label: 'Flight Hours Logged' },
                            { val: '2,153', label: 'Global Destinations' },
                        ].map(({ val, label }) => (
                            <Box key={label}>
                                <Text fontSize="3xl" fontWeight="black" color={PRIMARY}>{val}</Text>
                                <Text fontSize="sm" color="gray.400" fontWeight="semibold" textTransform="uppercase" letterSpacing="widest" mt={1}>
                                    {label}
                                </Text>
                            </Box>
                        ))}
                    </Grid>
                </Box>

            </Box>
        </Box>
    )
}
