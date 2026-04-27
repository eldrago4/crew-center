'use client'
import { useState, useEffect } from 'react'
import {
    Box, Flex, Grid, Heading, Text,
    VStack, HStack, Spinner,
} from '@chakra-ui/react'
import CountUp from 'react-countup'
import {
    FaClipboardList, FaClock, FaUsers, FaCalendarWeek,
    FaPlane, FaGasPump, FaRoute, FaUserGroup, FaChartBar,
} from 'react-icons/fa6'

// ── Constants ────────────────────────────────────────────────
const CC = 'linear-gradient(135deg, #5A67D8 0%, #7F9CF5 100%)'
const CM = 'linear-gradient(135deg, #C05621 0%, #ED8936 100%)'
const MEDALS = ['🥇', '🥈', '🥉']

function fmt(n) {
    return Number(n).toLocaleString('en-IN')
}

// ── Reusable components ──────────────────────────────────────

function StatCard({ icon, label, value, prefix = '', suffix = '', gradient }) {
    return (
        <Box
            bg="white"
            rounded="2xl"
            border="1px solid"
            borderColor="gray.100"
            shadow="sm"
            p={5}
            position="relative"
            overflow="hidden"
        >
            {/* accent bar */}
            <Box
                position="absolute"
                left={0} top={0} bottom={0}
                w="3px"
                style={{ background: gradient }}
            />
            <VStack align="start" gap={1.5} pl={3}>
                <Box color="gray.300" fontSize="lg">{icon}</Box>
                <Text
                    fontSize={{ base: '2xl', md: '3xl' }}
                    fontWeight="black"
                    letterSpacing="tight"
                    lineHeight={1}
                    style={{ background: gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                >
                    {prefix}
                    <CountUp end={Number(value) || 0} duration={2} separator="," />
                    {suffix}
                </Text>
                <Text fontSize="xs" fontWeight="semibold" color="gray.400" textTransform="uppercase" letterSpacing="widest">
                    {label}
                </Text>
            </VStack>
        </Box>
    )
}

function SectionLabel({ children, gradient }) {
    return (
        <HStack gap={2.5} mb={6}>
            <Box w="4px" h={6} rounded="full" style={{ background: gradient }} flexShrink={0} />
            <Heading
                as="h2"
                fontSize={{ base: '2xl', md: '3xl' }}
                fontWeight="black"
                letterSpacing="tight"
                style={{ background: gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
                {children}
            </Heading>
        </HStack>
    )
}

function Leaderboard({ title, items, nameKey, valueKey, valuePrefix = '', valueSuffix = '', gradient }) {
    if (!items?.length) return null
    return (
        <Box bg="white" rounded="2xl" border="1px solid" borderColor="gray.100" shadow="sm" p={5} h="full">
            <Text
                fontSize="xs" fontWeight="semibold" textTransform="uppercase"
                letterSpacing="widest" mb={4}
                style={{ background: gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
                {title}
            </Text>
            <VStack align="stretch" gap={1}>
                {items.map((item, i) => (
                    <HStack
                        key={i}
                        justify="space-between"
                        px={3} py={2.5}
                        rounded="lg"
                        bg={i < 3 ? 'gray.50' : 'transparent'}
                    >
                        <HStack gap={3}>
                            <Text fontSize="lg" w={6} textAlign="center" lineHeight={1}>
                                {MEDALS[i] ?? `${i + 1}.`}
                            </Text>
                            <Text fontSize="sm" fontWeight={i < 3 ? 'semibold' : 'normal'} color="gray.700">
                                {item[nameKey]}
                            </Text>
                        </HStack>
                        <Text fontSize="sm" fontWeight="bold" color="gray.600">
                            {valuePrefix}{typeof item[valueKey] === 'number' ? fmt(item[valueKey]) : item[valueKey]}{valueSuffix}
                        </Text>
                    </HStack>
                ))}
            </VStack>
        </Box>
    )
}

function HighlightCard({ label, main, sub }) {
    return (
        <Box bg="white" rounded="2xl" border="1px solid" borderColor="gray.100" shadow="sm" p={5}>
            <Text fontSize="xs" fontWeight="semibold" color="gray.400" textTransform="uppercase" letterSpacing="widest" mb={2}>
                {label}
            </Text>
            <HStack justify="space-between" align="baseline">
                <Text fontSize="xl" fontWeight="black" color="gray.800">{main}</Text>
                {sub && <Text fontSize="sm" color="gray.400">{sub}</Text>}
            </HStack>
        </Box>
    )
}

// ── Page ─────────────────────────────────────────────────────
export default function StatsPage() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/stats?format=json')
            .then(r => r.ok ? r.json() : null)
            .then(d => { setData(d); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    const cc = data?.crewCenter
    const cm = data?.careerMode

    return (
        <Box position="relative" minH="100vh">
            <Box position="fixed" inset={0} zIndex={-1} bgGradient="linear(to-br, orange.50, white, blue.50)" />

            <Box maxW="7xl" mx="auto" px={{ base: 4, lg: 8 }} py={14}>

                {/* ── Hero ── */}
                <Box textAlign="center" mb={16}>
                    <HStack
                        display="inline-flex"
                        bg="whiteAlpha.800"
                        backdropFilter="blur(4px)"
                        px={4} py={1.5}
                        rounded="full"
                        shadow="sm"
                        mb={5}
                        gap={2}
                    >
                        <Box color="#ff6b35"><FaChartBar size="0.85rem" /></Box>
                        <Text color="#ff6b35" fontWeight="semibold" fontSize="sm">Monthly Statistics</Text>
                    </HStack>

                    <Heading
                        as="h1"
                        fontSize={{ base: '5xl', md: '7xl' }}
                        fontWeight="black"
                        letterSpacing="tight"
                        fontFamily="'Playfair Display', serif"
                        mb={6}
                    >
                        {loading ? '—' : (data?.month ?? '—')}
                    </Heading>

                    {!loading && data && (
                        <HStack justify="center" gap={{ base: 4, md: 8 }} flexWrap="wrap">
                            {[
                                { dot: '#5A67D8', val: fmt(cc?.totalPireps ?? 0), label: 'PIREPs filed' },
                                { dot: '#ED8936', val: fmt(cm?.totalFlights ?? 0), label: 'career flights' },
                                { dot: '#38A169', val: fmt((cc?.activePilots ?? 0) + (cm?.activePilots ?? 0)), label: 'active pilots' },
                            ].map(({ dot, val, label }) => (
                                <HStack key={label} gap={2}>
                                    <Box w={2} h={2} rounded="full" bg={dot} flexShrink={0} />
                                    <Text fontSize="sm" color="gray.500">
                                        <Box as="span" fontWeight="bold" color="gray.700">{val}</Box>
                                        {' '}{label}
                                    </Text>
                                </HStack>
                            ))}
                        </HStack>
                    )}
                </Box>

                {loading && (
                    <Flex justify="center" py={24}>
                        <Spinner size="xl" color="orange.400" />
                    </Flex>
                )}

                {!loading && !data && (
                    <Flex justify="center" py={24}>
                        <Text color="gray.400">Failed to load statistics.</Text>
                    </Flex>
                )}

                {!loading && data && (
                    <VStack gap={14} align="stretch">

                        {/* ══════════ CREW CENTER ══════════ */}
                        <Box>
                            <SectionLabel gradient={CC}>Crew Center</SectionLabel>

                            {/* Main stats */}
                            <Grid
                                templateColumns={{ base: '1fr 1fr', md: 'repeat(4, 1fr)' }}
                                gap={4} mb={5}
                            >
                                <StatCard icon={<FaClipboardList />} label="PIREPs Filed"      value={cc?.totalPireps}      gradient={CC} />
                                <StatCard icon={<FaClock />}         label="Hours Flown"        value={cc?.totalHours}       suffix="h" gradient={CC} />
                                <StatCard icon={<FaUsers />}         label="Active Pilots"      value={cc?.activePilots}     gradient={CC} />
                                <StatCard icon={<FaCalendarWeek />}  label="Avg Weekly PIREPs"  value={cc?.avgWeeklyPireps}  gradient={CC} />
                            </Grid>

                            {/* Leaderboard + highlights */}
                            <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={4}>
                                <Leaderboard
                                    title="Top Pilots by PIREPs"
                                    items={cc?.topPilots}
                                    nameKey="ifcName"
                                    valueKey="cnt"
                                    valueSuffix=" PIREPs"
                                    gradient={CC}
                                />
                                <VStack gap={4} align="stretch">
                                    {cc?.topAircraft && (
                                        <HighlightCard
                                            label="Most Popular Aircraft"
                                            main={cc.topAircraft.aircraft}
                                            sub={`${fmt(cc.topAircraft.cnt)} PIREPs`}
                                        />
                                    )}
                                    {cc?.topRoute && (
                                        <HighlightCard
                                            label="Most Popular Route"
                                            main={`${cc.topRoute.departureIcao} → ${cc.topRoute.arrivalIcao}`}
                                            sub={`${fmt(cc.topRoute.cnt)} flights`}
                                        />
                                    )}
                                    {cc?.busiestDay && (
                                        <HighlightCard
                                            label="Busiest Day"
                                            main={new Date(cc.busiestDay.date + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })}
                                            sub={`${fmt(cc.busiestDay.cnt)} PIREPs`}
                                        />
                                    )}
                                </VStack>
                            </Grid>
                        </Box>

                        {/* Divider */}
                        <Box h="1px" bg="gray.200" />

                        {/* ══════════ CAREER MODE ══════════ */}
                        <Box>
                            <SectionLabel gradient={CM}>Career Mode</SectionLabel>

                            {/* Row 1 */}
                            <Grid
                                templateColumns={{ base: '1fr 1fr', md: 'repeat(4, 1fr)' }}
                                gap={4} mb={4}
                            >
                                <StatCard icon={<FaPlane />}       label="Flights"            value={cm?.totalFlights}    gradient={CM} />
                                <StatCard icon={<FaClock />}       label="Hours Flown"        value={cm?.totalHours}      suffix="h" gradient={CM} />
                                <StatCard icon={<FaUsers />}       label="Active Pilots"      value={cm?.activePilots}    gradient={CM} />
                                <StatCard icon={<FaClipboardList/>}label="Sectors Completed"  value={cm?.completedSectors}gradient={CM} />
                            </Grid>

                            {/* Row 2 */}
                            <Grid
                                templateColumns={{ base: '1fr 1fr', md: 'repeat(4, 1fr)' }}
                                gap={4} mb={5}
                            >
                                <StatCard icon={<FaUserGroup />}  label="Passengers"         value={cm?.totalPassengers}  gradient={CM} />
                                <StatCard icon={<FaRoute />}      label="Distance (NM)"      value={cm?.totalDistance}    gradient={CM} />
                                <StatCard icon={<FaGasPump />}    label="Fuel Burnt (kg)"    value={cm?.totalFuelUsed}    gradient={CM} />
                                <StatCard icon={<FaGasPump />}    label="Carry-Over Fuel (kg)"value={cm?.totalFuelExtra}  gradient={CM} />
                            </Grid>

                            {/* Leaderboard + sidebar */}
                            <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={4}>
                                <Leaderboard
                                    title="Top Earners"
                                    items={cm?.topEarners}
                                    nameKey="name"
                                    valueKey="earnings"
                                    valuePrefix="₹"
                                    gradient={CM}
                                />

                                <VStack gap={4} align="stretch">
                                    {/* HR Payout */}
                                    <Box bg="white" rounded="2xl" border="1px solid" borderColor="gray.100" shadow="sm" p={5}>
                                        <Text fontSize="xs" fontWeight="semibold" color="gray.400" textTransform="uppercase" letterSpacing="widest" mb={2}>
                                            HR Payout
                                        </Text>
                                        <Text
                                            fontSize={{ base: '3xl', md: '4xl' }}
                                            fontWeight="black"
                                            letterSpacing="tight"
                                            style={{ background: CM, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                                        >
                                            ₹<CountUp end={cm?.totalEarnings || 0} duration={2.5} separator="," />
                                        </Text>
                                    </Box>

                                    {/* Fleet utilization */}
                                    <Box bg="white" rounded="2xl" border="1px solid" borderColor="gray.100" shadow="sm" p={5}>
                                        <Text fontSize="xs" fontWeight="semibold" color="gray.400" textTransform="uppercase" letterSpacing="widest" mb={3}>
                                            Fleet Utilization
                                        </Text>
                                        <HStack justify="space-between" mb={3} align="baseline">
                                            <Text fontSize="3xl" fontWeight="black" style={{ background: CM, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                                {cm?.fleetUtil}%
                                            </Text>
                                            <Text fontSize="sm" color="gray.400">
                                                {cm?.activeAircraft} of {cm?.totalAircraft} active
                                            </Text>
                                        </HStack>
                                        <Box bg="gray.100" rounded="full" h={2} overflow="hidden">
                                            <Box
                                                h="full"
                                                rounded="full"
                                                style={{ width: `${cm?.fleetUtil || 0}%`, background: CM, transition: 'width 1.2s ease' }}
                                            />
                                        </Box>
                                    </Box>

                                    {cm?.mostFlownAircraft && (
                                        <HighlightCard
                                            label="Most Flown Aircraft"
                                            main={cm.mostFlownAircraft.name}
                                            sub={`${fmt(cm.mostFlownAircraft.count)} flights`}
                                        />
                                    )}

                                    <HighlightCard
                                        label="Avg Fuel Efficiency"
                                        main={`${fmt(cm?.avgFuelEfficiency)} kg/h`}
                                    />
                                </VStack>
                            </Grid>
                        </Box>
                    </VStack>
                )}
            </Box>
        </Box>
    )
}
