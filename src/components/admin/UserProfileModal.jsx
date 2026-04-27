'use client'
import { useEffect, useState } from 'react'
import {
    Badge,
    Box,
    Dialog,
    Heading,
    HStack,
    Skeleton,
    Stack,
    Table,
    Text,
} from '@chakra-ui/react'

const RANKS = [
    { name: 'Yuvraj',      min: 0    },
    { name: 'Rajkumar',    min: 80   },
    { name: 'Rajvanshi',   min: 160  },
    { name: 'Rajdhiraj',   min: 450  },
    { name: 'Maharaja',    min: 900  },
    { name: 'Samrat',      min: 1500 },
    { name: 'Chhatrapati', min: 2000 },
]

function parseHours(interval) {
    if (!interval) return 0
    const parts = String(interval).split(':')
    return parseInt(parts[0] || 0) + parseInt(parts[1] || 0) / 60
}

function formatHours(interval) {
    if (!interval) return '0h 0m'
    const parts = String(interval).split(':')
    return `${parseInt(parts[0])}h ${parseInt(parts[1])}m`
}

function getRankProgression(totalHours) {
    const currentIdx = [...RANKS].reverse().findIndex(r => totalHours >= r.min)
    const current = currentIdx === -1 ? RANKS[0] : [...RANKS].reverse()[currentIdx]
    const currentRankIdx = RANKS.indexOf(current)
    const next = RANKS[currentRankIdx + 1] ?? null

    if (!next) return { current, next: null, progress: 100, hoursIn: totalHours - current.min, hoursNeeded: 0 }

    const hoursIn = totalHours - current.min
    const span = next.min - current.min
    const progress = Math.min(100, (hoursIn / span) * 100)
    return { current, next, progress, hoursIn, hoursNeeded: next.min - totalHours }
}

function PirepStatusBadge({ valid }) {
    if (valid === true)  return <Badge colorPalette="green"  size="sm">Approved</Badge>
    if (valid === false) return <Badge colorPalette="red"    size="sm">Rejected</Badge>
    return                      <Badge colorPalette="yellow" size="sm">Pending</Badge>
}

function Stat({ label, value }) {
    return (
        <Stack gap={0} align="center">
            <Text fontSize="xl" fontWeight="bold">{value}</Text>
            <Text fontSize="xs" color="fg.muted">{label}</Text>
        </Stack>
    )
}

export default function UserProfileModal({ userId, onClose }) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!userId) return
        setLoading(true)
        setError(null)
        setData(null)
        fetch(`/api/admin/profile?id=${userId}`)
            .then(r => r.json())
            .then(json => {
                if (json.error) throw new Error(json.error)
                setData(json.data)
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false))
    }, [userId])

    const isInactive = data?.lastActive
        ? new Date(data.lastActive) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        : true

    const totalHours = data ? parseHours(data.flightTime) : 0
    const prog = data ? getRankProgression(totalHours) : null

    return (
        <Dialog.Root open={!!userId} onOpenChange={({ open }) => { if (!open) onClose() }} size="lg">
            <Dialog.Backdrop />
            <Dialog.Positioner>
                <Dialog.Content>
                    <Dialog.CloseTrigger />

                    <Dialog.Header pb={0}>
                        {loading ? (
                            <Skeleton height="24px" width="200px" />
                        ) : error ? (
                            <Text color="fg.error">{error}</Text>
                        ) : (
                            <Stack gap={1}>
                                <HStack gap={2} flexWrap="wrap">
                                    <Heading size="md">{data.ifcName}</Heading>
                                    <Text color="fg.muted" fontSize="sm" fontFamily="mono">{data.id}</Text>
                                    <Badge colorPalette={isInactive ? 'orange' : 'green'} variant="subtle" size="sm">
                                        {isInactive ? 'Inactive' : 'Active'}
                                    </Badge>
                                    {data.careerMode && (
                                        <Badge colorPalette="blue" variant="subtle" size="sm">Career Mode</Badge>
                                    )}
                                </HStack>
                                {data.discordId ? (
                                    <Text fontSize="sm" color="fg.muted">
                                        Discord:{' '}
                                        <a
                                            href={`https://discord.com/users/${data.discordId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: '#5865F2', textDecoration: 'underline' }}
                                        >
                                            View profile &amp; send DM →
                                        </a>
                                    </Text>
                                ) : (
                                    <Text fontSize="sm" color="fg.muted">Discord not linked</Text>
                                )}
                            </Stack>
                        )}
                    </Dialog.Header>

                    <Dialog.Body>
                        {loading ? (
                            <Stack gap={3}>
                                <Skeleton height="60px" borderRadius="md" />
                                <Skeleton height="40px" borderRadius="md" />
                                <Skeleton height="160px" borderRadius="md" />
                            </Stack>
                        ) : error ? null : (
                            <Stack gap={5}>
                                {/* Stats row */}
                                <HStack
                                    justify="space-around"
                                    bg="bg.muted"
                                    borderRadius="md"
                                    p={4}
                                >
                                    <Stat label="Total Hours" value={formatHours(data.flightTime)} />
                                    <Box h="40px" w="1px" bg="border.muted" />
                                    <Stat label="Rank" value={data.rank ?? '—'} />
                                    <Box h="40px" w="1px" bg="border.muted" />
                                    <Stat
                                        label="Last Active"
                                        value={data.lastActive
                                            ? new Date(data.lastActive).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                                            : '—'}
                                    />
                                </HStack>

                                {/* Rank progression */}
                                {prog && (
                                    <Stack gap={1}>
                                        <HStack justify="space-between">
                                            <Text fontSize="xs" color="fg.muted" fontWeight="medium">
                                                Rank Progression
                                            </Text>
                                            {prog.next ? (
                                                <Text fontSize="xs" color="fg.muted">
                                                    {Math.round(prog.hoursNeeded)}h to {prog.next.name}
                                                </Text>
                                            ) : (
                                                <Text fontSize="xs" color="fg.muted">Max rank reached</Text>
                                            )}
                                        </HStack>
                                        <Box bg="bg.muted" borderRadius="full" h="6px" overflow="hidden">
                                            <Box
                                                bg={isInactive ? 'orange.400' : 'green.400'}
                                                h="100%"
                                                w={`${prog.progress}%`}
                                                borderRadius="full"
                                                transition="width 0.4s ease"
                                            />
                                        </Box>
                                        <HStack justify="space-between">
                                            <Text fontSize="xs" color="fg.subtle">{prog.current.name} ({prog.current.min}h)</Text>
                                            {prog.next && <Text fontSize="xs" color="fg.subtle">{prog.next.name} ({prog.next.min}h)</Text>}
                                        </HStack>
                                    </Stack>
                                )}

                                {/* Recent PIREPs */}
                                <Stack gap={2}>
                                    <Text fontSize="sm" fontWeight="semibold" color="fg.muted">Recent PIREPs</Text>
                                    {data.pireps?.length === 0 ? (
                                        <Text fontSize="sm" color="fg.muted">No PIREPs on record.</Text>
                                    ) : (
                                        <Box overflowX="auto" borderWidth="1px" borderRadius="md">
                                            <Table.Root size="sm" variant="simple">
                                                <Table.Header bg="bg.muted">
                                                    <Table.Row>
                                                        <Table.ColumnHeader>Date</Table.ColumnHeader>
                                                        <Table.ColumnHeader>Flight</Table.ColumnHeader>
                                                        <Table.ColumnHeader>Route</Table.ColumnHeader>
                                                        <Table.ColumnHeader>Aircraft</Table.ColumnHeader>
                                                        <Table.ColumnHeader>Hours</Table.ColumnHeader>
                                                        <Table.ColumnHeader>Status</Table.ColumnHeader>
                                                    </Table.Row>
                                                </Table.Header>
                                                <Table.Body>
                                                    {data.pireps.map(p => (
                                                        <Table.Row key={p.pirepId}>
                                                            <Table.Cell whiteSpace="nowrap">
                                                                {new Date(p.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                                                            </Table.Cell>
                                                            <Table.Cell fontFamily="mono" fontSize="xs">{p.flightNumber}</Table.Cell>
                                                            <Table.Cell fontFamily="mono" fontSize="xs">
                                                                {p.departureIcao} → {p.arrivalIcao}
                                                            </Table.Cell>
                                                            <Table.Cell fontSize="xs">{p.aircraft}</Table.Cell>
                                                            <Table.Cell fontSize="xs" whiteSpace="nowrap">
                                                                {formatHours(p.flightTime)}
                                                                {p.multiplier && Number(p.multiplier) !== 1 &&
                                                                    <Text as="span" color="fg.muted"> ×{p.multiplier}</Text>
                                                                }
                                                            </Table.Cell>
                                                            <Table.Cell><PirepStatusBadge valid={p.valid} /></Table.Cell>
                                                        </Table.Row>
                                                    ))}
                                                </Table.Body>
                                            </Table.Root>
                                        </Box>
                                    )}
                                </Stack>
                            </Stack>
                        )}
                    </Dialog.Body>
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>
    )
}
