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
    ButtonGroup,
    // Pagination, // Removed direct import as it's accessed via dot notation
    Button,
    VStack,
    Divider,
    Spinner,
    Center
} from '@chakra-ui/react';
// Corrected import for Pagination as a single object, assuming its sub-components are accessed via dot notation.
import { Pagination } from '@chakra-ui/react';
import { Dialog } from '@chakra-ui/react'; // Assuming Dialog is imported this way
import { useState } from 'react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import PirepDetailModal from '@/components/admin/PirepDetailModal';

// Reverted icons to original stroke width
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

/**
 * AdminPirepsTable component displays a table of PIREPs for administrative review.
 * It includes columns for IFC Name, Rank, Route (with Flight #), Aircraft, Flight Time,
 * Multiplier, Comments, and action buttons (Accept, Reject, View).
 *
 * @param {object} props - Component props.
 * @param {Array<object>} props.pireps - An array of PIREP objects to display.
 * @param {number} props.totalPireps - Total number of PIREPs for pagination.
 */
export default function AdminPirepsTable({ pireps: initialPireps, totalPireps: initialTotalPireps }) {
    const [pireps, setPireps] = useState(initialPireps);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPireps, setTotalPireps] = useState(initialTotalPireps);
    const [processingPireps, setProcessingPireps] = useState(new Set());
    const [completedPireps, setCompletedPireps] = useState(new Map());
    const [errorPireps, setErrorPireps] = useState(new Map());
    const [fadingPireps, setFadingPireps] = useState(new Set());
    const [selectedPirep, setSelectedPirep] = useState(null); // This state is not currently used for modal, can be removed if not needed elsewhere
    const [loadingPirep, setLoadingPirep] = useState(false); // This state is not currently used for modal, can be removed if not needed elsewhere
    const [selectedPirepId, setSelectedPirepId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const pageSize = 10; // Max 10 PIREPs per page

    // Base style for the liquid glass effect, to be extended by each button.
    const baseGlassyStyle = {
        variant: 'ghost',
        borderRadius: 'full',
        size: 'sm',
        bg: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(12px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        _active: {
            transform: 'scale(0.98)',
        },
    };

    // Creates a multi-layered shadow for depth and a colored glow.
    const createGlowShadow = (colorRgb) => ({
        boxShadow: `0 2px 10px -3px rgba(0, 0, 0, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.05), 0 0 0 1px rgba(${colorRgb}, 0.1)`,
        _hover: {
            bg: 'rgba(255, 255, 255, 0.12)',
            borderColor: `rgba(${colorRgb}, 0.5)`,
            boxShadow: `0 4px 15px -3px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(${colorRgb}, 0.2)`,
        },
        _active: {
            ...baseGlassyStyle._active,
            boxShadow: `0 1px 5px -1px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.03), 0 0 0 1px rgba(${colorRgb}, 0.15)`,
        },
    });

    // Calculate visible items for current page
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const visiblePireps = pireps.slice(startIndex, endIndex);

    const handlePageChange = (details) => {
        setCurrentPage(details.page);
    };

    // Function to handle PIREP removal from the table, called by both direct actions and modal actions
    const removePirepFromTable = (pirepIdToRemove) => {
        setPireps(prev => prev.filter(p => p.pirepId !== pirepIdToRemove));
        setTotalPireps(prev => prev - 1);
        
        // Adjust current page if needed after removal
        const newTotalPages = Math.ceil((totalPireps - 1) / pageSize);
        if (currentPage > newTotalPages && newTotalPages > 0) {
            setCurrentPage(newTotalPages);
        }

        // Clean up processing/completed/fading states for the removed PIREP
        setProcessingPireps(prev => {
            const newSet = new Set(prev);
            newSet.delete(pirepIdToRemove);
            return newSet;
        });
        setCompletedPireps(prev => {
            const newMap = new Map(prev);
            newMap.delete(pirepIdToRemove);
            return newMap;
        });
        setFadingPireps(prev => {
            const newSet = new Set(prev);
            newSet.delete(pirepIdToRemove);
            return newSet;
        });
        setErrorPireps(prev => {
            const newMap = new Map(prev);
            newMap.delete(pirepIdToRemove);
            return newMap;
        });
    };

    const handleAccept = async (pirepId) => {
        setProcessingPireps(prev => new Set(prev).add(pirepId));
        setErrorPireps(prev => {
            const newMap = new Map(prev);
            newMap.delete(pirepId);
            return newMap;
        });
        
        try {
            const response = await fetch(`/api/users/pireps`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
                body: JSON.stringify({
                    pirepId,
                    action: 'approve',
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to approve PIREP');
            }

            const result = await response.json(); // Assuming result might be used, though not directly in this snippet
            
            // Show success status briefly before fading
            setCompletedPireps(prev => new Map(prev).set(pirepId, { status: 'approved', color: 'green' }));
            
            // Wait for status to be visible, then start fade
            setTimeout(() => {
                setFadingPireps(prev => new Set(prev).add(pirepId));
                
                // Remove from list after fade animation
                setTimeout(() => {
                    removePirepFromTable(pirepId); // Use the new common function
                }, 1500);
            }, 1000);
            
        } catch (error) {
            console.error('Error approving PIREP:', error);
            setErrorPireps(prev => new Map(prev).set(pirepId, { 
                status: 'Error', 
                color: 'red',
                message: 'Failed to approve' 
            }));
            setProcessingPireps(prev => {
                const newSet = new Set(prev);
                newSet.delete(pirepId);
                return newSet;
            });
        }
    };

    const handleReject = async (pirepId) => {
        setProcessingPireps(prev => new Set(prev).add(pirepId));
        setErrorPireps(prev => {
            const newMap = new Map(prev);
            newMap.delete(pirepId);
            return newMap;
        });
        
        try {
            const response = await fetch(`/api/users/pireps`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
                body: JSON.stringify({
                    pirepId,
                    action: 'reject',
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to reject PIREP');
            }

            const result = await response.json(); // Assuming result might be used, though not directly in this snippet
            
            // Show success status briefly before fading
            setCompletedPireps(prev => new Map(prev).set(pirepId, { status: 'rejected', color: 'red' }));
            
            // Wait for status to be visible, then start fade
            setTimeout(() => {
                setFadingPireps(prev => new Set(prev).add(pirepId));
                
                // Remove from list after fade animation
                setTimeout(() => {
                    removePirepFromTable(pirepId); // Use the new common function
                }, 1500);
            }, 1000);
            
        } catch (error) {
            console.error('Error rejecting PIREP:', error);
            setErrorPireps(prev => new Map(prev).set(pirepId, { 
                status: 'Error', 
                color: 'red',
                message: 'Failed to reject' 
            }));
            setProcessingPireps(prev => {
                const newSet = new Set(prev);
                newSet.delete(pirepId);
                return newSet;
            });
        }
    };

    const handleView = (pirepId) => {
        setSelectedPirepId(pirepId);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedPirepId(null);
    };

    // This function will be passed to PirepDetailModal
    const handlePirepActionSuccess = (actionedPirepId) => {
        // Trigger the removal logic in AdminPirepsTable
        removePirepFromTable(actionedPirepId);
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

    // Handle the case where no PIREPs are provided or the array is empty.
    if (!pireps || pireps.length === 0) {
        return (
            <Container maxW="100%" py="8" px="4">
                <Box
                    bg="whiteAlpha.200"
                    backdropFilter="auto"
                    backdropBlur="8px"
                    borderWidth="1px"
                    borderColor="whiteAlpha.300"
                    rounded="xl"
                    p="8"
                    shadow="sm"
                >
                    <Heading size="md" color="fg" opacity={0.8}>
                        No PIREPs submitted yet for admin review.
                    </Heading>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxW="100%" py="8" px="4">
            <Box
                bg="pink.50"
                backdropFilter="auto"
                backdropBlur="8px"
                borderWidth="1px"
                borderColor="pink.600"
                rounded="xl"
                p="8"
                shadow="sm"
            >
                <Stack spacing="6">
                    <Heading size="lg" color="fg" fontWeight="bold">
                        Admin PIREPs Overview
                    </Heading>

                    <Box overflowX="auto">
                        <Table.Root variant="outline" size="md">
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeader color="fg" fontWeight="semibold">Pilot</Table.ColumnHeader>
                                    <Table.ColumnHeader color="fg" fontWeight="semibold">Route</Table.ColumnHeader>
                                    <Table.ColumnHeader color="fg" fontWeight="semibold">Aircraft</Table.ColumnHeader>
                                    <Table.ColumnHeader color="fg" fontWeight="semibold">Flight Time</Table.ColumnHeader>
                                    <Table.ColumnHeader color="fg" fontWeight="semibold">Details</Table.ColumnHeader>
                                    <Table.ColumnHeader color="fg" fontWeight="semibold">Actions</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {visiblePireps.map((pirep) => (
                                    <Table.Row 
                                        key={pirep.pirepId}
                                        opacity={fadingPireps.has(pirep.pirepId) ? 0.3 : 1}
                                        transition="opacity 1.5s ease-in-out"
                                    >
                                        <Table.Cell>
                                            <Flex direction="column">
                                                <Text fontWeight="medium">{pirep.user?.ifcName || 'N/A'}</Text>
                                                <Text fontSize="sm" color="gray.400">{pirep.user?.rank || 'N/A'}</Text>
                                            </Flex>
                                        </Table.Cell>

                                        <Table.Cell>
                                            <Flex direction="column" alignItems="flex-start">
                                                <Badge
                                                    colorPalette="blue"
                                                    variant="surface"
                                                    rounded="full"
                                                    px="2"
                                                    py="1"
                                                    mb="1"
                                                >
                                                    {pirep.flightNumber}
                                                </Badge>
                                                <Text>
                                                    {pirep.flightNumber === 'IFATC' ? pirep.departureIcao : `${pirep.departureIcao} - ${pirep.arrivalIcao}`}
                                                </Text>
                                            </Flex>
                                        </Table.Cell>

                                        <Table.Cell>{pirep.flightNumber === 'IFATC' ? '-' : pirep.aircraft}</Table.Cell>
                                        <Table.Cell>{pirep.flightTime}</Table.Cell>

                                        <Table.Cell>
                                            <HStack spacing="2">
                                                {pirep.multiplier && (
                                                    <Badge colorPalette="purple" variant="subtle" rounded="full" px="2" py="1">
                                                        x{pirep.multiplier}
                                                    </Badge>
                                                )}
                                                {pirep.comments && (
                                                    <Badge colorPalette="gray" variant="subtle" rounded="full" px="2" py="1">
                                                        {pirep.comments.length > 25
                                                            ? pirep.comments.substring(0, 22) + '...'
                                                            : pirep.comments}
                                                    </Badge>
                                                )}
                                            </HStack>
                                        </Table.Cell>

                                        <Table.Cell>
                                            <HStack spacing="2">
                                                {getStatusBadge(pirep.pirepId) || (
                                                    <>
                                                        <IconButton
                                                            aria-label="Accept PIREP"
                                                            onClick={() => handleAccept(pirep.pirepId)}
                                                            {...baseGlassyStyle}
                                                            color="green.400"
                                                            {...createGlowShadow('34, 197, 94')}
                                                            isDisabled={processingPireps.has(pirep.pirepId) || completedPireps.has(pirep.pirepId) || errorPireps.has(pirep.pirepId)}
                                                        ><CheckIcon /></IconButton>
                                                        <IconButton
                                                            aria-label="Reject PIREP"
                                                            onClick={() => handleReject(pirep.pirepId)}
                                                            {...baseGlassyStyle}
                                                            color="red.400"
                                                            {...createGlowShadow('239, 68, 68')}
                                                            isDisabled={processingPireps.has(pirep.pirepId) || completedPireps.has(pirep.pirepId) || errorPireps.has(pirep.pirepId)}
                                                        ><XIcon /></IconButton>

                                                        <IconButton
                                                            aria-label="View PIREP Details"
                                                            onClick={() => handleView(pirep.pirepId)}
                                                            {...baseGlassyStyle}
                                                            color="blue.400"
                                                            {...createGlowShadow('59, 130, 246')}
                                                            isDisabled={processingPireps.has(pirep.pirepId) || completedPireps.has(pirep.pirepId) || errorPireps.has(pirep.pirepId)}
                                                        ><EyeIcon /></IconButton>
                                                    </>
                                                )}
                                            </HStack>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    </Box>

                    {totalPireps > pageSize && (
                        <Box mt="8" w="full" display="flex" justifyContent="center">
                            <Pagination.Root
                                count={totalPireps}
                                pageSize={pageSize}
                                page={currentPage}
                                onPageChange={handlePageChange}
                                siblingCount={1}
                            >
                                <ButtonGroup variant="ghost" size="md">
                                    <Pagination.PrevTrigger asChild>
                                        <IconButton aria-label="Previous Page">
                                            <LuChevronLeft />
                                        </IconButton>
                                    </Pagination.PrevTrigger>

                                    <Pagination.Items
                                        render={(page) => (
                                            <IconButton
                                                aria-label={`Page ${page.value}`}
                                                variant={{ base: "ghost", _selected: "outline" }}
                                            >
                                                {page.value}
                                            </IconButton>
                                        )}
                                    />

                                    <Pagination.NextTrigger asChild>
                                        <IconButton aria-label="Next Page">
                                            <LuChevronRight />
                                        </IconButton>
                                    </Pagination.NextTrigger>
                                </ButtonGroup>
                            </Pagination.Root>
                        </Box>
                    )}
                </Stack>
            </Box>
            
            <PirepDetailModal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                pirepId={selectedPirepId} 
                onPirepActionSuccess={handlePirepActionSuccess} // Pass the new callback
            />
        </Container>
    );
}
