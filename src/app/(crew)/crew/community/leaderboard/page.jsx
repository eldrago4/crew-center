'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    Text,
    Table,
    Spinner,
    Alert,
    Heading,
    HStack,
    Icon,
    Badge,
    Skeleton,
    SkeletonCircle,
    SkeletonText,
} from '@chakra-ui/react';
import { FiAward, FiClock } from 'react-icons/fi';
import { DiscordAvatar } from '@/components/DiscordAvatar';

export default function LeaderboardPage() {
    const [ leaderboard, setLeaderboard ] = useState([]);
    const [ userRank, setUserRank ] = useState(null);
    const [ loading, setLoading ] = useState(true);
    const [ error, setError ] = useState(null);

    useEffect(() => {
        fetchLeaderboard();
        fetchUserRank();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/leaderboard');
            if (!response.ok) {
                throw new Error('Failed to fetch leaderboard');
            }
            const data = await response.json();
            setLeaderboard(data.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserRank = async () => {
        try {
            const response = await fetch('/api/user-rank');
            if (response.ok) {
                const data = await response.json();
                setUserRank(data.userRank);
            }
        } catch (err) {
            // Silently fail for user rank - not critical
            console.error('Failed to fetch user rank:', err);
        }
    };

    const formatFlightTime = (interval) => {
        if (!interval) return '0:00';

        // Parse PostgreSQL interval format (e.g., "1234:56:00")
        const match = interval.match(/(\d+):(\d+):(\d+)/);
        if (match) {
            const hours = parseInt(match[ 1 ]);
            const minutes = parseInt(match[ 2 ]);
            return `${hours}:${minutes.toString().padStart(2, '0')}`;
        }

        return interval;
    };



    if (loading) {
        return (
            <Box p={6} maxW="1200px" mx="auto">
                <VStack spacing={6} align="stretch">
                    {/* Header - render directly */}
                    <HStack spacing={3}>
                        <Icon as={FiAward} boxSize={8} color="blue.500" />
                        <Heading size="lg" color="fg">
                            Pilot Leaderboard
                        </Heading>
                    </HStack>

                    {/* Description - render directly */}
                    <Text color="fg.muted" fontSize="md">
                        Top 10 pilots ranked by total flight time
                    </Text>

                    {/* Podium skeleton */}
                    <Box display="flex" justifyContent="center" alignItems="end" gap="1.5rem" mb={8}>
                        {/* #2 - Left skeleton */}
                        <Box
                            bg="bg.subtle"
                            borderRadius="lg"
                            p={4}
                            textAlign="center"
                            minH="120px"
                            w="150px"
                            boxShadow="md"
                        >
                            <SkeletonCircle size="16" mb={2} />
                            <Skeleton height="4" width="80%" mb={1} />
                            <Skeleton height="4" width="90%" mb={1} />
                            <Skeleton height="3" width="60%" />
                        </Box>

                        {/* #1 - Middle skeleton */}
                        <Box
                            bg="bg.subtle"
                            borderRadius="lg"
                            p={4}
                            textAlign="center"
                            minH="160px"
                            w="150px"
                            boxShadow="md"
                        >
                            <SkeletonCircle size="20" mb={2} />
                            <Skeleton height="4" width="80%" mb={1} />
                            <Skeleton height="4" width="90%" mb={1} />
                            <Skeleton height="3" width="60%" />
                        </Box>

                        {/* #3 - Right skeleton */}
                        <Box
                            bg="bg.subtle"
                            borderRadius="lg"
                            p={4}
                            textAlign="center"
                            minH="100px"
                            w="150px"
                            boxShadow="md"
                        >
                            <SkeletonCircle size="12" mb={2} />
                            <Skeleton height="4" width="80%" mb={1} />
                            <Skeleton height="4" width="90%" mb={1} />
                            <Skeleton height="3" width="60%" />
                        </Box>
                    </Box>

                    {/* Table skeleton */}
                    <Box
                        bg="bg.subtle"
                        borderRadius="lg"
                        boxShadow="sm"
                        border="1px"
                        borderColor="border"
                        overflow="hidden"
                    >
                        <Table.Root size="sm" variant="outline">
                            <Table.Header bg="bg.muted">
                                <Table.Row>
                                    <Table.ColumnHeader textAlign="center" width="80px">
                                        <Skeleton height="4" width="12" />
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader>
                                        <Skeleton height="4" width="60px" />
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader>
                                        <Skeleton height="4" width="80px" />
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader textAlign="center">
                                        <Skeleton height="4" width="80px" />
                                    </Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {Array.from({ length: 7 }).map((_, index) => (
                                    <Table.Row key={index}>
                                        <Table.Cell textAlign="center">
                                            <Skeleton height="6" width="8" borderRadius="full" />
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Skeleton height="4" width="50px" />
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Skeleton height="4" width="80px" />
                                        </Table.Cell>
                                        <Table.Cell textAlign="center">
                                            <Skeleton height="4" width="60px" />
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    </Box>
                </VStack>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert.Root status="error">
                <Box>
                    <Alert.Title>Error</Alert.Title>
                    <Alert.Description>{error}</Alert.Description>
                </Box>
            </Alert.Root>
        );
    }

    return (
        <Box p={6} maxW="1200px" mx="auto">
            <VStack spacing={6} align="stretch">
                <HStack spacing={3}>
                    <Icon as={FiAward} boxSize={8} color="blue.500" />
                    <Heading size="lg" color="fg">
                        Pilot Leaderboard
                    </Heading>
                </HStack>

                <Text color="fg.muted" fontSize="md">
                    Top 10 pilots ranked by total flight time
                </Text>

                {/* Podium for top 3 */}
                {leaderboard.length >= 3 && (
                    <Box display="flex" justifyContent="center" alignItems="end" gap="1.5rem" mb={8}>
                        {/* #2 - Left */}
                        <Box
                            bg="bg.subtle"
                            borderRadius="lg"
                            p={4}
                            textAlign="center"
                            minH="120px"
                            w="150px"
                            boxShadow="md"
                        >
                            <DiscordAvatar userId={leaderboard[ 1 ]?.discordId} size="lg" mb={2} />
                            <Text fontSize="sm" color="blue.500">{leaderboard[ 1 ]?.id}</Text>
                            <Text fontSize="sm" color="fg">{leaderboard[ 1 ]?.ifcName}</Text>
                            <Text fontSize="xs" fontFamily="mono" color="fg.muted">{formatFlightTime(leaderboard[ 1 ]?.flightTime)}</Text>
                        </Box>

                        {/* #1 - Middle (Tallest) */}
                        <Box
                            bg="yellow.100"
                            _dark={{ bg: "yellow.900" }}
                            borderRadius="lg"
                            p={4}
                            textAlign="center"
                            minH="160px"
                            w="150px"
                            boxShadow="md"
                        >
                            <DiscordAvatar userId={leaderboard[ 0 ]?.discordId} size="xl" mb={2} />
                            <Text fontSize="sm" color="blue.500">{leaderboard[ 0 ]?.id}</Text>
                            <Text fontSize="sm" color="fg">{leaderboard[ 0 ]?.ifcName}</Text>
                            <Text fontSize="xs" fontFamily="mono" color="fg.muted">{formatFlightTime(leaderboard[ 0 ]?.flightTime)}</Text>
                        </Box>

                        {/* #3 - Right */}
                        <Box
                            bg="bg.subtle"
                            borderRadius="lg"
                            p={4}
                            textAlign="center"
                            minH="100px"
                            w="150px"
                            boxShadow="md"
                        >
                            <DiscordAvatar userId={leaderboard[ 2 ]?.discordId} size="md" mb={2} />
                            <Text fontSize="sm" color="blue.500">{leaderboard[ 2 ]?.id}</Text>
                            <Text fontSize="sm" color="fg">{leaderboard[ 2 ]?.ifcName}</Text>
                            <Text fontSize="xs" fontFamily="mono" color="fg.muted">{formatFlightTime(leaderboard[ 2 ]?.flightTime)}</Text>
                        </Box>
                    </Box>
                )}

                {/* Table for ranks 4-10 */}
                <Box
                    bg="bg.subtle"
                    borderRadius="lg"
                    boxShadow="sm"
                    border="1px"
                    borderColor="border"
                    overflow="hidden"
                >
                    <Table.Root size="sm" variant="outline">
                        <Table.Header bg="bg.muted">
                            <Table.Row>
                                <Table.ColumnHeader textAlign="center" width="80px" color="fg">Rank</Table.ColumnHeader>
                                <Table.ColumnHeader color="fg">Callsign</Table.ColumnHeader>
                                <Table.ColumnHeader color="fg">Pilot Name</Table.ColumnHeader>
                                <Table.ColumnHeader textAlign="center">
                                    <HStack justify="center" spacing={1}>
                                        <Icon as={FiClock} boxSize={4} color="fg" />
                                        <Text color="fg">Flight Time</Text>
                                    </HStack>
                                </Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {leaderboard.slice(3).map((pilot, index) => (
                                <Table.Row
                                    key={pilot.id}
                                    _hover={{ bg: 'bg.muted' }}
                                    bg={userRank && pilot.id === userRank.id ? 'blue.50' : 'transparent'}
                                    _dark={{ bg: userRank && pilot.id === userRank.id ? 'blue.900' : 'transparent' }}
                                >
                                    <Table.Cell textAlign="center">
                                        <Badge
                                            colorPalette="gray"
                                            variant="outline"
                                            borderRadius="full"
                                            px={3}
                                            py={1}
                                        >
                                            #{index + 4}
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell fontWeight="semibold" color="blue.500">
                                        {pilot.id}
                                    </Table.Cell>
                                    <Table.Cell color="fg">{pilot.ifcName}</Table.Cell>
                                    <Table.Cell textAlign="center" fontFamily="mono" color="fg.muted">
                                        {formatFlightTime(pilot.flightTime)}
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>
                </Box>

                {/* User's rank row if not in top 10 */}
                {userRank && userRank.rank > 10 && (
                    <Box
                        bg="blue.50"
                        _dark={{ bg: "blue.900" }}
                        borderRadius="lg"
                        boxShadow="sm"
                        border="1px"
                        borderColor="blue.200"
                        _dark={{ borderColor: "blue.700" }}
                        overflow="hidden"
                        mt={4}
                    >
                        <Table.Root size="sm" variant="outline">
                            <Table.Header bg="blue.100" _dark={{ bg: "blue.900" }}>
                                <Table.Row>
                                    <Table.ColumnHeader textAlign="center" width="80px" color="fg">Your Rank</Table.ColumnHeader>
                                    <Table.ColumnHeader color="fg">Callsign</Table.ColumnHeader>
                                    <Table.ColumnHeader color="fg">Pilot Name</Table.ColumnHeader>
                                    <Table.ColumnHeader textAlign="center">
                                        <HStack justify="center" spacing={1}>
                                            <Icon as={FiClock} boxSize={4} color="fg" />
                                            <Text color="fg">Flight Time</Text>
                                        </HStack>
                                    </Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                <Table.Row>
                                    <Table.Cell textAlign="center">
                                        <Badge
                                            colorPalette="blue"
                                            variant="solid"
                                            borderRadius="full"
                                            px={3}
                                            py={1}
                                        >
                                            #{userRank.rank}
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell fontWeight="semibold" color="blue.500">
                                        {userRank.id}
                                    </Table.Cell>
                                    <Table.Cell color="fg">{userRank.ifcName}</Table.Cell>
                                    <Table.Cell textAlign="center" fontFamily="mono" color="fg.muted">
                                        {formatFlightTime(userRank.flightTime)}
                                    </Table.Cell>
                                </Table.Row>
                            </Table.Body>
                        </Table.Root>
                    </Box>
                )}

                {leaderboard.length === 0 && (
                    <Box textAlign="center" py={8}>
                        <Text color="fg.muted">No leaderboard data available</Text>
                    </Box>
                )}
            </VStack>
        </Box>
    );
}

