'use client';

import {
    Table,
    Badge,
    Container,
    Box,
    Heading,
    Stack,
    Flex,
    HStack,
    Text,
    IconButton,
    Input,
    Button,
    Center
} from '@chakra-ui/react';
import { useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import PirepDetailModal from '@/components/admin/PirepDetailModal';

const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

const XIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const EyeIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

export default function AdminPirepsTable({ pireps = [], onPirepActioned, searchTerm = '', onSearch }) {
    const [ processingPireps, setProcessingPireps ] = useState(new Set());
    const [ completedPireps, setCompletedPireps ] = useState(new Map());
    const [ errorPireps, setErrorPireps ] = useState(new Map());
    const [ fadingPireps, setFadingPireps ] = useState(new Set());
    const [ selectedPirepId, setSelectedPirepId ] = useState(null);
    const [ isModalOpen, setIsModalOpen ] = useState(false);
    const [ searchOpen, setSearchOpen ] = useState(false);

    const baseGlassyStyle = {
        variant: 'ghost',
        borderRadius: 'full',
        size: 'sm',
        bg: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(12px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        _active: { transform: 'scale(0.98)' },
        _dark: { bg: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.08)' },
    };

    const createGlowShadow = (colorRgb) => ({
        boxShadow: `0 2px 10px -3px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(255,255,255,0.05), 0 0 0 1px rgba(${colorRgb},0.1)`,
        _hover: {
            bg: 'rgba(255,255,255,0.12)',
            borderColor: `rgba(${colorRgb},0.5)`,
            boxShadow: `0 4px 15px -3px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.1), 0 0 0 1px rgba(${colorRgb},0.2)`,
        },
        _active: {
            ...baseGlassyStyle._active,
            boxShadow: `0 1px 5px -1px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(255,255,255,0.03), 0 0 0 1px rgba(${colorRgb},0.15)`,
        },
    });

    const cleanupPirepState = (pirepId) => {
        setProcessingPireps(prev => { const s = new Set(prev); s.delete(pirepId); return s; });
        setCompletedPireps(prev => { const m = new Map(prev); m.delete(pirepId); return m; });
        setFadingPireps(prev => { const s = new Set(prev); s.delete(pirepId); return s; });
        setErrorPireps(prev => { const m = new Map(prev); m.delete(pirepId); return m; });
    };

    const runAction = async (pirepId, action) => {
        setProcessingPireps(prev => new Set(prev).add(pirepId));
        setErrorPireps(prev => { const m = new Map(prev); m.delete(pirepId); return m; });

        try {
            const res = await fetch('/api/users/pireps', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pirepId, action }),
            });
            if (!res.ok) throw new Error(`Failed to ${action} PIREP`);

            setCompletedPireps(prev => new Map(prev).set(pirepId, {
                status: action === 'approve' ? 'approved' : 'rejected',
                color: action === 'approve' ? 'green' : 'red',
            }));

            setTimeout(() => {
                setFadingPireps(prev => new Set(prev).add(pirepId));
                setTimeout(() => {
                    cleanupPirepState(pirepId);
                    onPirepActioned?.();
                }, 1500);
            }, 1000);

        } catch (err) {
            console.error(err);
            setErrorPireps(prev => new Map(prev).set(pirepId, { status: 'Error', color: 'red' }));
            setProcessingPireps(prev => { const s = new Set(prev); s.delete(pirepId); return s; });
        }
    };

    const getStatusBadge = (pirepId) => {
        if (errorPireps.has(pirepId)) {
            const { status, color } = errorPireps.get(pirepId);
            return <Badge colorPalette={color} variant="subtle">{status}</Badge>;
        }
        if (completedPireps.has(pirepId)) {
            const { status, color } = completedPireps.get(pirepId);
            return <Badge colorPalette={color} variant="subtle">{status}</Badge>;
        }
        if (processingPireps.has(pirepId)) {
            return <Badge variant="subtle">Processing...</Badge>;
        }
        return null;
    };

    if (!pireps || pireps.length === 0) {
        return (
            <Container maxW="100%" py="8" px="4">
                <Box bg={{ base: "pink.50", _dark: "whiteAlpha.100" }} borderWidth="1px" borderColor={{ base: "pink.600", _dark: "pink.900" }} rounded="xl" p="8" shadow="sm">
                    <Heading size="md" color="fg" opacity={0.8}>No PIREPs found.</Heading>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxW="100%" py="8" px="4">
            <Box bg={{ base: "pink.50", _dark: "whiteAlpha.100" }} backdropFilter="auto" backdropBlur="8px" borderWidth="1px" borderColor={{ base: "pink.600", _dark: "pink.900" }} rounded="xl" p="8" shadow="sm">
                <Stack spacing="6">
                    <Heading size="lg" color="fg" fontWeight="bold">Admin PIREPs Overview</Heading>
                    <Box overflowX="auto">
                        <Table.Root variant="outline" size="md">
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeader color="fg" fontWeight="semibold" p={searchOpen ? 2 : undefined}>
                                        <HStack justify="space-between" align="center">
                                            <Text fontWeight="semibold">Pilot</Text>
                                            {onSearch && (
                                                <IconButton
                                                    size="xs"
                                                    variant="ghost"
                                                    aria-label="Search pilot"
                                                    color={searchOpen ? 'purple.400' : 'fg.muted'}
                                                    onClick={() => {
                                                        setSearchOpen(o => !o);
                                                        if (searchOpen && searchTerm) onSearch('');
                                                    }}
                                                >
                                                    {searchOpen ? <FiX /> : <FiSearch />}
                                                </IconButton>
                                            )}
                                        </HStack>
                                        {searchOpen && onSearch && (
                                            <Input
                                                size="xs"
                                                mt={1}
                                                placeholder="Search pilot..."
                                                value={searchTerm}
                                                onChange={e => onSearch(e.target.value)}
                                                autoFocus
                                                variant="flushed"
                                            />
                                        )}
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader color="fg" fontWeight="semibold">Route</Table.ColumnHeader>
                                    <Table.ColumnHeader color="fg" fontWeight="semibold">Aircraft</Table.ColumnHeader>
                                    <Table.ColumnHeader color="fg" fontWeight="semibold">Flight Time</Table.ColumnHeader>
                                    <Table.ColumnHeader color="fg" fontWeight="semibold">Details</Table.ColumnHeader>
                                    <Table.ColumnHeader color="fg" fontWeight="semibold">Actions</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {pireps.map((pirep) => (
                                    <Table.Row
                                        key={pirep.pirepId}
                                        opacity={fadingPireps.has(pirep.pirepId) ? 0.3 : 1}
                                        transition="opacity 1.5s ease-in-out"
                                    >
                                        <Table.Cell>
                                            <Flex direction="column">
                                                <Text fontWeight="medium">{pirep.user?.ifcName || 'N/A'}</Text>
                                                <Text fontSize="sm" color="fg.muted">{pirep.user?.rank || 'N/A'}</Text>
                                            </Flex>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Flex direction="column" alignItems="flex-start">
                                                <Badge colorPalette="blue" variant="surface" rounded="full" px="2" py="1" mb="1">{pirep.flightNumber}</Badge>
                                                <Text color="fg">{pirep.flightNumber === 'IFATC' ? pirep.departureIcao : `${pirep.departureIcao} - ${pirep.arrivalIcao}`}</Text>
                                            </Flex>
                                        </Table.Cell>
                                        <Table.Cell color="fg">{pirep.flightNumber === 'IFATC' ? '-' : pirep.aircraft}</Table.Cell>
                                        <Table.Cell color="fg">{pirep.flightTime}</Table.Cell>
                                        <Table.Cell>
                                            <HStack spacing="2">
                                                {pirep.multiplier && <Badge colorPalette="purple" variant="subtle" rounded="full" px="2" py="1">x{pirep.multiplier}</Badge>}
                                                {pirep.comments && (
                                                    <Badge colorPalette="gray" variant="subtle" rounded="full" px="2" py="1">
                                                        {pirep.comments.length > 25 ? pirep.comments.substring(0, 22) + '...' : pirep.comments}
                                                    </Badge>
                                                )}
                                            </HStack>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <HStack spacing="2">
                                                {getStatusBadge(pirep.pirepId) || (
                                                    <>
                                                        <IconButton aria-label="Accept PIREP" onClick={() => runAction(pirep.pirepId, 'approve')} {...baseGlassyStyle} color="green.400" {...createGlowShadow('34,197,94')} disabled={processingPireps.has(pirep.pirepId) || completedPireps.has(pirep.pirepId)}><CheckIcon /></IconButton>
                                                        <IconButton aria-label="Reject PIREP" onClick={() => runAction(pirep.pirepId, 'reject')} {...baseGlassyStyle} color="red.400" {...createGlowShadow('239,68,68')} disabled={processingPireps.has(pirep.pirepId) || completedPireps.has(pirep.pirepId)}><XIcon /></IconButton>
                                                        <IconButton aria-label="View PIREP Details" onClick={() => { setSelectedPirepId(pirep.pirepId); setIsModalOpen(true); }} {...baseGlassyStyle} color="blue.400" {...createGlowShadow('59,130,246')} disabled={processingPireps.has(pirep.pirepId) || completedPireps.has(pirep.pirepId)}><EyeIcon /></IconButton>
                                                    </>
                                                )}
                                            </HStack>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    </Box>
                </Stack>
            </Box>

            <PirepDetailModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setSelectedPirepId(null); }}
                pirepId={selectedPirepId}
                onPirepActionSuccess={(pirepId) => { cleanupPirepState(pirepId); onPirepActioned?.(); }}
            />
        </Container>
    );
}
