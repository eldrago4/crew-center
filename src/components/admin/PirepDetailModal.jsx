'use client';

import {
    Box,
    Text,
    HStack,
    Badge,
    Spinner,
    Center,
    Flex,
    Button,
    IconButton,
    Textarea
} from '@chakra-ui/react';
import { Dialog } from '@chakra-ui/react';
import { Stat } from '@chakra-ui/react';
import { toaster } from '@/components/ui/toaster';
import { useState, useEffect } from 'react';
import { FiUser } from 'react-icons/fi';
import UserProfileModal from '@/components/admin/UserProfileModal';

export default function PirepDetailModal({ isOpen, onClose, pirepId, onPirepActionSuccess }) {
    const [ pirep, setPirep ] = useState(null);
    const [ loading, setLoading ] = useState(true);
    const [ error, setError ] = useState(null);
    const [ adminComments, setAdminComments ] = useState('');
    const [ processingAction, setProcessingAction ] = useState(null);
    const [ profileUserId, setProfileUserId ] = useState(null);

    useEffect(() => {
        if (isOpen && pirepId) {
            fetchPirepDetails();
        }
    }, [ isOpen, pirepId ]);

    const fetchPirepDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/users/pireps/${pirepId}`);
            if (!response.ok) throw new Error('Failed to fetch PIREP details');
            const data = await response.json();
            setPirep(data.data);
            setAdminComments(data.data.adminComments || '');
            setError(null);
        } catch (err) {
            setError(err.message);
            setPirep(null);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadgeProps = (valid) => {
        if (valid === true) return { colorPalette: 'green', text: 'Approved' };
        else if (valid === false) return { colorPalette: 'red', text: 'Rejected' };
        else return { colorPalette: 'yellow', text: 'Pending' };
    };

    const statusBadge = pirep ? getStatusBadgeProps(pirep.valid) : { colorPalette: 'gray', text: 'N/A' };

    // Helper for logbook URL
    const logbookUrl = pirep?.user?.ifcName ? `https://iflytics.app/user/${encodeURIComponent(pirep.user.ifcName)}/flights` : null;

    const handleAccept = async () => {
        setProcessingAction('accept');
        try {
            const response = await fetch('/api/users/pireps', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pirepId,
                    action: 'approve',
                    adminComments: adminComments.trim()
                }),
            });

            if (!response.ok) throw new Error('Failed to approve PIREP');

            toaster.create({
                title: 'PIREP Approved',
                description: 'The PIREP has been successfully approved.',
                type: 'success',
                duration: 3000,
            });

            setPirep(prev => ({ ...prev, valid: true, adminComments: adminComments.trim() }));

            // Notify parent component about the successful action
            if (onPirepActionSuccess) {
                onPirepActionSuccess(pirepId);
            }
            setTimeout(() => onClose(), 1000);
        } catch (error) {
            toaster.create({
                title: 'Error',
                description: 'Failed to approve PIREP. Please try again.',
                type: 'error',
                duration: 5000,
            });
            setError(error.message);
        } finally {
            setProcessingAction(null);
        }
    };

    const handleReject = async () => {
        setProcessingAction('reject');
        try {
            const response = await fetch(`/api/users/pireps`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pirepId,
                    action: 'reject',
                    adminComments: adminComments.trim()
                }),
            });

            if (!response.ok) throw new Error('Failed to reject PIREP');

            toaster.create({
                title: 'PIREP Rejected',
                description: 'The PIREP has been successfully rejected.',
                type: 'success',
                duration: 3000,
            });

            setPirep(prev => ({ ...prev, valid: false, adminComments: adminComments.trim() }));

            // Notify parent component about the successful action
            if (onPirepActionSuccess) {
                onPirepActionSuccess(pirepId);
            }
            setTimeout(() => onClose(), 1000);
        } catch (error) {
            toaster.create({
                title: 'Error',
                description: 'Failed to reject PIREP. Please try again.',
                type: 'error',
                duration: 5000,
            });
            setError(error.message);
        } finally {
            setProcessingAction(null);
        }
    };

    return (
        <Dialog.Root
            open={isOpen}
            onOpenChange={(details) => !details.open && onClose()}
            size="xl"
            placement="center"
            closeOnEscape={true}
            closeOnInteractOutside={true}
            preventScroll={true}
            trapFocus={true}
            restoreFocus={true}
        >
            <Dialog.Backdrop />
            <Dialog.Positioner>
                <Dialog.Content borderRadius="xl" overflow="hidden" shadow="2xl">
                    <Dialog.Header borderBottomWidth="1px" pb={4} fontSize="2xl" fontWeight="bold">
                        <HStack spacing={3} align="center">
                            <Text as="span">PIREP Details - {pirep?.flightNumber || 'Loading...'}</Text>
                            {pirep && (
                                <Badge
                                    colorPalette={statusBadge.colorPalette}
                                    variant="solid"
                                    borderRadius="md"
                                    px={3}
                                    py={1}
                                    fontSize="sm"
                                    textTransform="uppercase"
                                >
                                    {statusBadge.text}
                                </Badge>
                            )}
                            {/* Logbook Button - opens in a new tab */}
                            {logbookUrl && (
                                <Button
                                    as="a"
                                    href={logbookUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    size="sm"
                                    colorPalette="blue"
                                    variant="outline"
                                    ml={2}
                                >
                                    Logbook
                                </Button>
                            )}
                        </HStack>
                    </Dialog.Header>
                    <Dialog.CloseTrigger />

                    <Dialog.Body p={6}>
                        {/* Note: Logbook opens in a new tab; no iframe embed */}
                        {loading && (
                            <Center py={10}>
                                <Spinner size="xl" color="purple.500" thickness="4px" />
                            </Center>
                        )}

                        {error && (
                            <Box color="red.500" textAlign="center" py={10}>
                                <Text fontSize="lg" fontWeight="medium">Error: {error}</Text>
                            </Box>
                        )}

                        {pirep && !loading && !error && (
                            <Flex wrap="wrap" gap={6} justify="center" alignContent="flex-start">
                                {/* Pilot Information */}
                                <Box flex="1 1 300px" p={5} borderWidth="1px" borderRadius="xl" shadow="lg" bg={{ base: "white", _dark: "gray.800" }}>
                                    <Stat.Root>
                                        <Stat.Label fontSize="xs" color={{ base: "gray.500", _dark: "gray.400" }}>Pilot ID: {pirep.user?.id || 'N/A'}</Stat.Label>
                                        <HStack align="center" gap={2}>
                                            <Stat.ValueText fontSize="2xl" fontWeight="bold" color="purple.600">{pirep.user?.ifcName || 'N/A'}</Stat.ValueText>
                                            {pirep.user?.id && (
                                                <IconButton
                                                    size="sm"
                                                    variant="ghost"
                                                    aria-label="View pilot profile"
                                                    color="purple.400"
                                                    onClick={() => setProfileUserId(pirep.user.id)}
                                                >
                                                    <FiUser />
                                                </IconButton>
                                            )}
                                        </HStack>
                                        <Stat.HelpText>
                                            <Badge colorPalette="blue" borderRadius="full" px={3} py={1}>
                                                {pirep.user?.rank || 'N/A'}
                                            </Badge>
                                        </Stat.HelpText>
                                    </Stat.Root>
                                </Box>

                                {/* Route */}
                                <Box flex="1 1 250px" p={5} borderWidth="1px" borderRadius="xl" shadow="lg" bg={{ base: "white", _dark: "gray.800" }}>
                                    <Text fontSize="lg" fontWeight="bold" mb={4}>Route</Text>
                                    <Stat.Root>
                                        <Stat.ValueText fontSize="xl">{pirep.departureIcao} → {pirep.arrivalIcao}</Stat.ValueText>
                                    </Stat.Root>
                                </Box>

                                {/* Aircraft */}
                                <Box flex="1 1 250px" p={5} borderWidth="1px" borderRadius="xl" shadow="lg" bg={{ base: "white", _dark: "gray.800" }}>
                                    <Text fontSize="lg" fontWeight="bold" mb={4}>Aircraft</Text>
                                    <Stat.Root>
                                        <Stat.ValueText fontSize="xl">{pirep.aircraft}</Stat.ValueText>
                                    </Stat.Root>
                                </Box>

                                {/* Flight Time */}
                                <Box flex="1 1 200px" p={5} borderWidth="1px" borderRadius="xl" shadow="lg" bg={{ base: "white", _dark: "gray.800" }}>
                                    <Text fontSize="lg" fontWeight="bold" mb={4}>Flight Duration</Text>
                                    <Stat.Root>
                                        <Stat.ValueText fontSize="xl">{pirep.flightTime}</Stat.ValueText>
                                    </Stat.Root>
                                </Box>

                                {/* Date */}
                                <Box flex="1 1 200px" p={5} borderWidth="1px" borderRadius="xl" shadow="lg" bg={{ base: "white", _dark: "gray.800" }}>
                                    <Text fontSize="lg" fontWeight="bold" mb={4}>PIREP Date</Text>
                                    <Stat.Root>
                                        <Stat.ValueText fontSize="xl">{new Date(pirep.date).toLocaleDateString()}</Stat.ValueText>
                                    </Stat.Root>
                                </Box>

                                {/* Multiplier */}
                                {pirep.multiplier && (
                                    <Box flex="1 1 180px" p={5} borderWidth="1px" borderRadius="xl" shadow="lg" bg={{ base: "white", _dark: "gray.800" }}>
                                        <Text fontSize="lg" fontWeight="bold" mb={4}>Multiplier</Text>
                                        <Stat.Root>
                                            <Stat.ValueText fontSize="xl">x{pirep.multiplier}</Stat.ValueText>
                                        </Stat.Root>
                                    </Box>
                                )}

                                {/* Comments */}
                                {pirep.comments && (
                                    <Box flex="1 1 350px" p={5} borderWidth="1px" borderRadius="xl" shadow="lg" bg={{ base: "white", _dark: "gray.800" }}>
                                        <Text fontSize="lg" fontWeight="bold" mb={4}>Pilot Comments</Text>
                                        <Box bg={{ base: "gray.50", _dark: "gray.700" }} p={3} borderRadius="md" fontSize="sm" lineHeight="tall">
                                            {pirep.comments}
                                        </Box>
                                    </Box>
                                )}

                                {/* Admin Comments */}
                                {pirep.valid === null && (
                                    <Box flex="1 1 350px" p={5} borderWidth="1px" borderRadius="xl" shadow="lg" bg={{ base: "white", _dark: "gray.800" }}>
                                        <Text fontSize="lg" fontWeight="bold" mb={4}>Admin Comments</Text>
                                        <Textarea
                                            value={adminComments}
                                            onChange={(e) => setAdminComments(e.target.value)}
                                            placeholder="Enter admin comments (optional)..."
                                            size="sm"
                                            minHeight="100px"
                                            resize="vertical"
                                        />
                                    </Box>
                                )}

                                {/* Existing Admin Comments */}
                                {pirep.adminComments && pirep.valid !== null && (
                                    <Box flex="1 1 350px" p={5} borderWidth="1px" borderRadius="xl" shadow="lg" bg={{ base: "white", _dark: "gray.800" }}>
                                        <Text fontSize="lg" fontWeight="bold" mb={4}>Admin Comments</Text>
                                        <Box bg={{ base: "blue.50", _dark: "blue.900" }} p={3} borderRadius="md" fontSize="sm" lineHeight="tall">
                                            {pirep.adminComments}
                                        </Box>
                                    </Box>
                                )}
                            </Flex>
                        )}
                    </Dialog.Body>

                    <Dialog.Footer borderTopWidth="1px" pt={4}>
                        <HStack spacing={3} justify="flex-end" w="full">
                            {pirep && pirep.valid === null && (
                                <>
                                    <Button
                                        onClick={handleReject}
                                        colorPalette="red"
                                        variant="outline"
                                        isLoading={processingAction === 'reject'}
                                        loadingText="Rejecting..."
                                    >
                                        Reject
                                    </Button>
                                    <Button
                                        onClick={handleAccept}
                                        colorPalette="green"
                                        isLoading={processingAction === 'accept'}
                                        loadingText="Accepting..."
                                    >
                                        Accept
                                    </Button>
                                </>
                            )}
                            <Button onClick={onClose} colorPalette="purple" variant="outline">
                                Close
                            </Button>
                        </HStack>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>

        <UserProfileModal
            userId={profileUserId}
            onClose={() => setProfileUserId(null)}
        />
    );
}
