'use client';

import { Box, Heading, Text, Table, Badge, HStack, VStack, Stack, Alert, SimpleGrid } from '@chakra-ui/react';
import { Chart, useChart } from '@chakra-ui/charts';
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { AKASHARATHA_HOURS } from './constants';

// Flights is always blue and hours always green, in every panel — the hue belongs to
// the measure, so a reader who learns it once carries it down the page.
const FLIGHTS = 'blue.solid';
const HOURS = 'green.solid';

function compact(n) {
    if (n >= 10_000) return `${(n / 1000).toFixed(1)}K`;
    return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

// ── Stat tile ────────────────────────────────────────────────────────────────
function StatTile({ label, value, delta, deltaLabel }) {
    const hasDelta = Number.isFinite(delta) && delta !== 0;
    const up = delta > 0;

    return (
        <Box bg="bg.panel" border="1px solid" borderColor="border" rounded="xl" p="4">
            <Text fontSize="sm" color="fg.muted">{label}</Text>
            <Text fontSize="3xl" fontWeight="semibold" color="fg" lineHeight="1.2" mt="1">
                {value}
            </Text>
            {hasDelta ? (
                <HStack gap="1" mt="1">
                    {/* Direction is stated in the text, not carried by colour alone. */}
                    <Text fontSize="xs" fontWeight="medium" color={up ? 'green.fg' : 'red.fg'}>
                        {up ? '▲' : '▼'} {compact(Math.abs(delta))}
                    </Text>
                    <Text fontSize="xs" color="fg.muted">{deltaLabel}</Text>
                </HStack>
            ) : (
                <Text fontSize="xs" color="fg.muted" mt="1">
                    {delta === 0 ? `No change ${deltaLabel}` : ' '}
                </Text>
            )}
        </Box>
    );
}

// ── Ranked bars ──────────────────────────────────────────────────────────────
// Magnitude comparison across a handful of names, so: bars in a single hue, length
// carrying the value. A table of numbers alone makes the reader do the comparing.
function PilotBar({ pilot, index, max }) {
    const pct = max > 0 ? Math.max((pilot.hours / max) * 100, 1.5) : 0;

    return (
        <Box>
            <HStack justify="space-between" gap="3" mb="1.5" align="baseline">
                <HStack gap="2" minW="0">
                    <Text fontSize="sm" color="fg.muted" fontVariantNumeric="tabular-nums" w="4">{index + 1}</Text>
                    <Text fontSize="sm" fontWeight="medium" color="fg" truncate>{pilot.ifcName}</Text>
                    {pilot.callsign && (
                        <Text fontSize="xs" fontFamily="mono" color="fg.muted" flexShrink="0">{pilot.callsign}</Text>
                    )}
                </HStack>
                <HStack gap="3" flexShrink="0">
                    <Text fontSize="sm" fontWeight="semibold" color="fg" fontVariantNumeric="tabular-nums">
                        {pilot.hours.toFixed(1)} h
                    </Text>
                    <Text fontSize="xs" color="fg.muted" fontVariantNumeric="tabular-nums" minW="14" textAlign="end">
                        {pilot.pireps} {pilot.pireps === 1 ? 'flight' : 'flights'}
                    </Text>
                </HStack>
            </HStack>
            {/* Track is a lighter step of the same hue, so the bar reads against it. */}
            <Box bg="blue.subtle" rounded="sm" h="2" overflow="hidden">
                <Box bg="blue.solid" h="full" w={`${pct}%`} rounded="sm" transition="width 0.3s" />
            </Box>
        </Box>
    );
}

// ── Line chart ───────────────────────────────────────────────────────────────
function ActivityChart({ data, dataKey, label, color, unit }) {
    const chart = useChart({ data, series: [{ name: dataKey, color }] });
    const empty = data.every((d) => !d[dataKey]);

    return (
        <Box>
            <Text fontSize="sm" fontWeight="medium" color="fg.muted" mb="2">{label}</Text>
            <Box position="relative">
                <Chart.Root height="11rem" chart={chart}>
                    <LineChart data={chart.data} margin={{ top: 8, right: 10, bottom: 0, left: -18 }}>
                        <CartesianGrid stroke={chart.color('border')} vertical={false} />
                        <XAxis
                            dataKey={chart.key('label')}
                            axisLine={false}
                            tickLine={false}
                            stroke={chart.color('border')}
                            tick={{ fill: chart.color('fg.muted'), fontSize: 11 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                            width={44}
                            stroke={chart.color('border')}
                            tick={{ fill: chart.color('fg.muted'), fontSize: 11 }}
                        />
                        <Tooltip
                            animationDuration={100}
                            cursor={{ stroke: chart.color('border'), strokeWidth: 1 }}
                            content={<Chart.Tooltip />}
                        />
                        <Line
                            type="monotone"
                            isAnimationActive={false}
                            dataKey={chart.key(dataKey)}
                            stroke={chart.color(color)}
                            strokeWidth={2}
                            dot={{ r: 3.5, fill: chart.color(color), strokeWidth: 0 }}
                            activeDot={{ r: 5 }}
                        />
                    </LineChart>
                </Chart.Root>
                {empty && (
                    <Text
                        position="absolute" inset="0" display="flex" alignItems="center" justifyContent="center"
                        fontSize="sm" color="fg.muted" pointerEvents="none"
                    >
                        No flights in this period
                    </Text>
                )}
            </Box>
        </Box>
    );
}

function Panel({ title, subtitle, children, ...rest }) {
    return (
        <Box bg="bg.panel" border="1px solid" borderColor="border" rounded="xl" p={{ base: '4', md: '6' }} {...rest}>
            <Box mb="4">
                <Heading as="h2" size="md" color="fg">{title}</Heading>
                {subtitle && <Text fontSize="sm" color="fg.muted" mt="1">{subtitle}</Text>}
            </Box>
            {children}
        </Box>
    );
}

function ActivityPanel({ title, subtitle, data }) {
    return (
        <Panel title={title} subtitle={subtitle}>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={{ base: '5', md: '8' }}>
                <ActivityChart data={data} dataKey="flights" label="Flights filed" color={FLIGHTS} />
                <ActivityChart data={data} dataKey="hours" label="Credited hours" color={HOURS} />
            </SimpleGrid>
        </Panel>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function StatisticsClient({ week, summary, delta, topPilots, club, weekly, monthly, failed }) {
    const maxHours = topPilots.reduce((m, p) => Math.max(m, p.hours), 0);
    const weekNote = week.isPreviousWeek ? 'last full week' : 'week to date';

    return (
        <Stack gap="6">
            <Box>
                <Heading as="h1" size="lg" color="fg">Statistics</Heading>
                <Text fontSize="sm" color="fg.muted" mt="1">
                    Approved PIREPs only. Hours are credited hours — flight time × multiplier.
                </Text>
            </Box>

            {failed && (
                <Alert.Root status="error" variant="subtle" rounded="lg">
                    <Alert.Indicator />
                    <Alert.Content>
                        <Alert.Title>Couldn&apos;t load statistics</Alert.Title>
                        <Alert.Description>
                            The database didn&apos;t answer. Everything below is showing empty rather than real
                            figures — reload in a moment.
                        </Alert.Description>
                    </Alert.Content>
                </Alert.Root>
            )}

            <SimpleGrid columns={{ base: 1, sm: 3 }} gap="4">
                <StatTile label="Flights filed" value={compact(summary.flights)} delta={delta.flights} deltaLabel="vs previous week" />
                <StatTile label="Credited hours" value={compact(summary.hours)} delta={delta.hours} deltaLabel="vs previous week" />
                <StatTile label="Pilots flying" value={compact(summary.pilots)} delta={delta.pilots} deltaLabel="vs previous week" />
            </SimpleGrid>

            <Panel title="Top 5 pilots this week" subtitle={`${week.label} · ${weekNote}`}>
                {topPilots.length === 0 ? (
                    <Text color="fg.muted" textAlign="center" py="8">No approved PIREPs in this week yet.</Text>
                ) : (
                    <VStack gap="4" align="stretch">
                        {topPilots.map((p, i) => (
                            <PilotBar key={p.callsign || p.ifcName} pilot={p} index={i} max={maxHours} />
                        ))}
                    </VStack>
                )}
            </Panel>

            {/* Sky-blue scheme sets the club apart from the neutral panels around it. */}
            <Box
                bg={{ base: 'cyan.50', _dark: 'cyan.950' }}
                border="1px solid"
                borderColor={{ base: 'cyan.200', _dark: 'cyan.800' }}
                rounded="xl"
                p={{ base: '4', md: '6' }}
            >
                <HStack justify="space-between" align="start" mb="4" flexWrap="wrap" gap="2">
                    <Box>
                        <Heading as="h2" size="md" color={{ base: 'cyan.900', _dark: 'cyan.100' }}>Akasharatha Club</Heading>
                        <Text fontSize="sm" color={{ base: 'cyan.700', _dark: 'cyan.300' }} mt="1">
                            All-time flight hours above {AKASHARATHA_HOURS.toLocaleString()}
                        </Text>
                    </Box>
                    <Badge bg={{ base: 'cyan.500', _dark: 'cyan.400' }} color={{ base: 'white', _dark: 'cyan.950' }} rounded="md" px="2">
                        {club.length} {club.length === 1 ? 'pilot' : 'pilots'}
                    </Badge>
                </HStack>

                <Table.Root size="sm" variant="line" bg="transparent">
                    <Table.Header>
                        <Table.Row bg="transparent">
                            <Table.ColumnHeader w="12" color={{ base: 'cyan.700', _dark: 'cyan.300' }}>#</Table.ColumnHeader>
                            <Table.ColumnHeader color={{ base: 'cyan.700', _dark: 'cyan.300' }}>Pilot</Table.ColumnHeader>
                            <Table.ColumnHeader textAlign="end" color={{ base: 'cyan.700', _dark: 'cyan.300' }}>All-time hours</Table.ColumnHeader>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {club.length === 0 && (
                            <Table.Row bg="transparent">
                                <Table.Cell colSpan={3} textAlign="center" py="8" color={{ base: 'cyan.700', _dark: 'cyan.300' }}>
                                    No pilots have passed {AKASHARATHA_HOURS.toLocaleString()} hours yet.
                                </Table.Cell>
                            </Table.Row>
                        )}
                        {club.map((p, i) => (
                            <Table.Row key={p.callsign || p.ifcName} bg="transparent">
                                <Table.Cell color={{ base: 'cyan.600', _dark: 'cyan.400' }} fontVariantNumeric="tabular-nums">{i + 1}</Table.Cell>
                                <Table.Cell>
                                    <HStack gap="2">
                                        <Text fontWeight="medium" color={{ base: 'cyan.950', _dark: 'cyan.50' }}>{p.ifcName}</Text>
                                        {p.callsign && (
                                            <Text fontSize="xs" fontFamily="mono" color={{ base: 'cyan.600', _dark: 'cyan.400' }}>{p.callsign}</Text>
                                        )}
                                    </HStack>
                                </Table.Cell>
                                <Table.Cell textAlign="end" fontVariantNumeric="tabular-nums" fontWeight="semibold" color={{ base: 'cyan.950', _dark: 'cyan.50' }}>
                                    {p.hours.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Root>
            </Box>

            <ActivityPanel title="Activity — last 5 weeks" subtitle="Weeks begin Monday" data={weekly} />
            <ActivityPanel title="Activity — last 6 months" subtitle="Calendar months, including the current one" data={monthly} />
        </Stack>
    );
}
