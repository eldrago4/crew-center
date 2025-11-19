"use client";
import { useState, useEffect, useMemo } from 'react';
import AircraftSelect from '@/components/admin/AircraftSelect';
import {
    Box, Button, ButtonGroup, Center, Checkbox, Container, CloseButton, Dialog, HStack, Heading, Input, InputGroup, Portal, Select, Spinner, Stack, Text, createListCollection, Field, Pagination, Table,
} from '@chakra-ui/react';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { Toaster, toaster } from '@/components/ui/toaster';

const usePaginatedData = (data, itemsPerPage = 10) => {
    const [ currentPage, setCurrentPage ] = useState(1);
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return data.slice(startIndex, endIndex);
    }, [ data, currentPage, itemsPerPage ]);
    const goToPage = (pageNumber) => setCurrentPage(pageNumber);
    return { currentPage, totalPages, paginatedData, goToPage, setCurrentPage };
};

const filterOptions = createListCollection({
    items: [
        { label: 'Flight Number', value: 'flightNumber' },
        { label: 'Route', value: 'route' },
    ],
});

export default function AdminRoutesClient({ initialFleet }) {
    // Handle input change for dialog form
    const handleInputChange = (index, field, value) => {
        setNewRoutes(prev =>
            prev.map((route, i) => {
                if (i !== index) return route;
                if (field === 'aircraft') {
                    // value is array of ICAOs, store as comma-separated string
                    return { ...route, aircraft: Array.isArray(value) ? value.join(', ') : value };
                }
                return { ...route, [ field ]: value };
            })
        );
    };

    // Edit and delete logic
    const [ editIndex, setEditIndex ] = useState(null);
    const [ editRoute, setEditRoute ] = useState(null);
    const [ isEditDialogOpen, setEditDialogOpen ] = useState(false);
    const [ deleteIndex, setDeleteIndex ] = useState(null);
    const [ isDeleteDialogOpen, setDeleteDialogOpen ] = useState(false);
    // Bulk delete logic
    const [ selectedRoutes, setSelectedRoutes ] = useState([]);
    const [ isBulkDeleteDialogOpen, setBulkDeleteDialogOpen ] = useState(false);

    // Handle bulk delete
    const handleBulkDelete = () => {
        setBulkDeleteDialogOpen(true);
    };

    // Confirm bulk delete
    const handleConfirmBulkDelete = async () => {
        try {
            const deletePromises = selectedRoutes.map(flightNumber =>
                fetch(`/api/routes?flightNumber=${encodeURIComponent(flightNumber)}`, {
                    method: 'DELETE',
                }).then(res => {
                    if (!res.ok) {
                        const errorData = res.json().catch(() => ({}));
                        throw new Error(errorData.error || `Failed to delete route ${flightNumber}`);
                    }
                    return res;
                })
            );
            await Promise.all(deletePromises);
            toaster.create({
                title: 'Success',
                description: `${selectedRoutes.length} routes deleted successfully`,
                type: 'success',
            });
            // Remove the routes from state without refetching
            setRoutes(prev => prev.filter(route => !selectedRoutes.includes(route.flightNumber)));
            setSelectedRoutes([]);
            setBulkDeleteDialogOpen(false);
        } catch (err) {
            toaster.create({
                title: 'Error',
                description: err.message,
                type: 'error',
            });
        }
    };

    // Open edit dialog
    const handleEditRoute = (route, idx) => {
        // For AircraftSelect, convert aircraft string to array
        setEditRoute({
            ...route,
            aircraft: typeof route.aircraft === 'string' ? route.aircraft.split(',').map(s => s.trim()).filter(Boolean) : (route.aircraft || [])
        });
        setEditIndex(idx);
        setEditDialogOpen(true);
    };

    // Save edited route
    const handleSaveEditRoute = async () => {
        try {
            // Always send aircraft as comma-separated string
            const payload = {
                ...editRoute,
                aircraft: Array.isArray(editRoute.aircraft) ? editRoute.aircraft.join(', ') : editRoute.aircraft
            };
            const res = await fetch('/api/routes', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to update route');
            }
            toaster.create({
                title: 'Success',
                description: 'Route updated successfully',
                type: 'success',
            });
            // Update the route in state without refetching
            setRoutes(prev => prev.map(route => route.flightNumber === editRoute.flightNumber ? { ...route, ...editRoute } : route));
            setEditDialogOpen(false);
        } catch (err) {
            toaster.create({
                title: 'Error',
                description: err.message,
                type: 'error',
            });
        }
    };

    // Open delete dialog
    const handleDeleteRoute = (idx) => {
        setDeleteIndex(idx);
        setDeleteDialogOpen(true);
    };

    // Confirm delete
    const handleConfirmDelete = async () => {
        try {
            const route = paginatedData[ deleteIndex ];
            const res = await fetch(`/api/routes?flightNumber=${encodeURIComponent(route.flightNumber)}`, {
                method: 'DELETE',
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to delete route');
            }
            toaster.create({
                title: 'Success',
                description: 'Route deleted successfully',
                type: 'success',
            });
            // Remove the route from state without refetching
            setRoutes(prev => prev.filter(route => route.flightNumber !== paginatedData[ deleteIndex ].flightNumber));
            setDeleteDialogOpen(false);
        } catch (err) {
            toaster.create({
                title: 'Error',
                description: err.message,
                type: 'error',
            });
        }
    };
    // Submit new routes to the API
    const handleSubmitRoutes = async () => {
        try {
            // Always send aircraft as comma-separated string
            const payload = newRoutes.map(route => ({
                ...route,
                aircraft: Array.isArray(route.aircraft) ? route.aircraft.join(', ') : route.aircraft
            }));
            const res = await fetch('/api/routes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to add routes');
            }
            const createdRoutes = await res.json();
            // Update routes state by appending the new routes to avoid refetching
            setRoutes(prev => [ ...prev, ...createdRoutes ].sort((a, b) => b.flightNumber.localeCompare(a.flightNumber)));
            toaster.create({
                title: 'Success',
                description: 'Routes added nigga',
                type: 'success',
            });
            // Clear search fields to show all routes including the new one
            setSearchTerm('');
            setDepartureSearch('');
            setArrivalSearch('');
            setDialogOpen(false);
            setNewRoutes([ { flightNumber: '', departureIcao: '', arrivalIcao: '', flightTime: '', aircraft: [] } ]);
        } catch (err) {
            toaster.create({
                title: 'Error',
                description: err.message,
                type: 'error',
            });
        }
    };
    // Add a new empty route row in the dialog
    const handleAddRouteRow = () => {
        setNewRoutes(prev => ([
            ...prev,
            { flightNumber: '', departureIcao: '', arrivalIcao: '', flightTime: '', aircraft: [] }
        ]));
    };

    // Remove a route row in the dialog
    const handleRemoveRouteRow = (index) => {
        setNewRoutes(prev => prev.filter((_, i) => i !== index));
    };
    // Helper to format time
    const formatTime = (timeString) => {
        if (!timeString) return 'N/A';
        return timeString.substring(0, 5);
    };

    // Helper to normalize aircraft string for display (handles malformed Postgres array/object)
    const formatAircraft = (aircraft) => {
        if (!aircraft) return '';
        // If already a normal comma-separated string, return as is
        if (typeof aircraft === 'string' && !aircraft.trim().startsWith('{')) return aircraft;
        // Try to parse Postgres array-like string: {"A388","A339"}
        if (typeof aircraft === 'string' && aircraft.trim().startsWith('{')) {
            // Remove curly braces and split by comma, then trim and keep double quotes
            return aircraft
                .replace(/^{|}$/g, '')
                .split(',')
                .map(s => s.trim())
                .join(', ');
        }
        return String(aircraft);
    };
    const [ routes, setRoutes ] = useState([]);
    const [ loading, setLoading ] = useState(true);
    const [ isDialogOpen, setDialogOpen ] = useState(false);
    const [ filterType, setFilterType ] = useState('flightNumber');
    const [ searchTerm, setSearchTerm ] = useState('');
    const [ departureSearch, setDepartureSearch ] = useState('');
    const [ arrivalSearch, setArrivalSearch ] = useState('');
    const [ aircraftList, setAircraftList ] = useState(Array.isArray(initialFleet) ? initialFleet : []);
    // For dialog new routes
    const [ newRoutes, setNewRoutes ] = useState([
        { flightNumber: '', departureIcao: '', arrivalIcao: '', flightTime: '', aircraft: [] }
    ]);

    useEffect(() => {
        async function fetchRoutes() {
            setLoading(true);
            try {
                const res = await fetch('/api/routes');
                if (!res.ok) throw new Error('Failed to fetch routes');
                const data = await res.json();
                setRoutes(Array.isArray(data) ? data.sort((a, b) => b.flightNumber.localeCompare(a.flightNumber)) : []);
            } catch (err) {
                setRoutes([]);
            } finally {
                setLoading(false);
            }
        }
        fetchRoutes();
    }, []);

    // Filtering logic
    const filteredRoutes = useMemo(() => {
        if (filterType === 'flightNumber') {
            return routes.filter(route =>
                route.flightNumber.toLowerCase().includes(searchTerm.toLowerCase())
            );
        } else if (filterType === 'route') {
            return routes.filter(route =>
                route.departureIcao.toLowerCase().includes(departureSearch.toLowerCase()) &&
                route.arrivalIcao.toLowerCase().includes(arrivalSearch.toLowerCase())
            );
        }
        return routes;
    }, [ routes, filterType, searchTerm, departureSearch, arrivalSearch ]);

    // Pagination logic
    const { currentPage, totalPages, paginatedData, goToPage } = usePaginatedData(filteredRoutes, 10);

    if (loading) {
        return (
            <Box>
                <Center h="100vh"><Spinner size="xl" /></Center>
            </Box>
        );
    }
    return (
        <Box>
            <Toaster />
            <Dialog.Root open={isDialogOpen} onOpenChange={(e) => setDialogOpen(e.open)} scrollBehavior="inside">
                <Box p={{ base: 4, md: 6 }} flex="1" bg="gray.50" minH="100vh">
                    <Container maxW="7xl">
                        <Stack spacing={6} align="stretch">
                            <Heading size="xl" color="gray.800">Route Management</Heading>
                            <HStack justify="space-between" wrap="wrap" gap={4}>
                                <HStack flex="1" gap={4} wrap="wrap">
                                    {selectedRoutes.length > 0 && (
                                        <Button colorPalette="red" onClick={handleBulkDelete}>Delete Selected ({selectedRoutes.length})</Button>
                                    )}
                                    <Select.Root
                                        collection={filterOptions}
                                        value={[ filterType ]}
                                        onValueChange={(e) => setFilterType(e.value[ 0 ])}
                                        maxW={{ base: 'full', md: '200px' }}
                                    >
                                        <Select.HiddenSelect />
                                        <Select.Control><Select.Trigger><Select.ValueText /></Select.Trigger></Select.Control>
                                        <Portal>
                                            <Select.Positioner>
                                                <Select.Content>
                                                    {filterOptions.items.map((item) => (
                                                        <Select.Item item={item} key={item.value}>{item.label}</Select.Item>
                                                    ))}
                                                </Select.Content>
                                            </Select.Positioner>
                                        </Portal>
                                    </Select.Root>
                                    {filterType === 'flightNumber' ? (
                                        <InputGroup maxW={{ base: 'full', md: '300px' }} startElement={<FiSearch color="gray.300" />}>
                                            <Input
                                                placeholder="Search by Flight Number..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </InputGroup>
                                    ) : (
                                        <HStack gap={2}>
                                            <Input
                                                placeholder="Departure ICAO"
                                                value={departureSearch}
                                                onChange={(e) => setDepartureSearch(e.target.value.toUpperCase())}
                                                maxLength={4}
                                                w="140px"
                                            />
                                            <Input
                                                placeholder="Arrival ICAO"
                                                value={arrivalSearch}
                                                onChange={(e) => setArrivalSearch(e.target.value.toUpperCase())}
                                                maxLength={4}
                                                w="140px"
                                            />
                                        </HStack>
                                    )}
                                </HStack>
                                <Dialog.Trigger asChild>
                                    <Button colorPalette="orange" leftIcon={<FiPlus />}>Add New Routes</Button>
                                </Dialog.Trigger>
                            </HStack>
                            <Box bg="white" rounded="md" shadow="sm">
                                <Table.ScrollArea>
                                    <Table.Root variant="simple">
                                        <Table.Header bg="gray.100">
                                            <Table.Row>
                                                <Table.ColumnHeader>Flight Number</Table.ColumnHeader>
                                                <Table.ColumnHeader>Departure</Table.ColumnHeader>
                                                <Table.ColumnHeader>Arrival</Table.ColumnHeader>
                                                <Table.ColumnHeader>Flight Time</Table.ColumnHeader>
                                                <Table.ColumnHeader>Aircraft</Table.ColumnHeader>
                                            </Table.Row>
                                        </Table.Header>
                                        <Table.Body>
                                            {paginatedData.length > 0 ? (
                                                paginatedData.map((route, idx) => (
                                                    <Table.Row key={route.id || route.flightNumber}>
                                                        <Table.Cell fontWeight="medium">
                                                            <Checkbox.Root
                                                                checked={selectedRoutes.includes(route.flightNumber)}
                                                                mr="10px"
                                                                onCheckedChange={(e) => {
                                                                    if (e.checked) {
                                                                        setSelectedRoutes(prev => [ ...prev, route.flightNumber ]);
                                                                    } else {
                                                                        setSelectedRoutes(prev => prev.filter(fn => fn !== route.flightNumber));
                                                                    }
                                                                }}
                                                            >
                                                                <Checkbox.HiddenInput />
                                                                <Checkbox.Control />
                                                            </Checkbox.Root>
                                                         {route.flightNumber}</Table.Cell>
                                                        <Table.Cell>{route.departureIcao}</Table.Cell>
                                                        <Table.Cell>{route.arrivalIcao}</Table.Cell>
                                                        <Table.Cell>{formatTime(route.flightTime)}</Table.Cell>
                                                        <Table.Cell>{formatAircraft(route.aircraft)}</Table.Cell>
                                                        <Table.Cell>
                                                            <Button size="xs" colorPalette="blue" mr={2} onClick={() => handleEditRoute(route, idx)}>Edit</Button>
                                                            <Button size="xs" colorPalette="red" onClick={() => handleDeleteRoute(idx)}>Delete</Button>
                                                        </Table.Cell>
                                                    </Table.Row>
                                                ))
                                            ) : (
                                                <Table.Row>
                                                    <Table.Cell colSpan={7} textAlign="center" py={10}>
                                                        <Text color="gray.500">No routes found.</Text>
                                                    </Table.Cell>
                                                </Table.Row>
                                            )}
                                        </Table.Body>
                                        {/* Edit Route Dialog */}
                                        <Portal>
                                            <Dialog.Root open={isEditDialogOpen} onOpenChange={(e) => setEditDialogOpen(e.open)}>
                                                <Dialog.Backdrop />
                                                <Dialog.Positioner>
                                                    <Dialog.Content size="lg">
                                                        <Dialog.Header>
                                                            <Dialog.CloseTrigger asChild position="absolute" top="4" right="4"><CloseButton size="sm" /></Dialog.CloseTrigger>
                                                        </Dialog.Header>
                                                        <Dialog.Body>
                                                            {editRoute && (
                                                                <Stack spacing={4}>
                                                                    <Field.Root required>
                                                                        <Field.Label>Flight Number</Field.Label>
                                                                        <Input value={editRoute.flightNumber} onChange={e => setEditRoute({ ...editRoute, flightNumber: e.target.value })} />
                                                                    </Field.Root>
                                                                    <Field.Root required>
                                                                        <Field.Label>Departure ICAO</Field.Label>
                                                                        <Input value={editRoute.departureIcao} onChange={e => setEditRoute({ ...editRoute, departureIcao: e.target.value.toUpperCase() })} />
                                                                    </Field.Root>
                                                                    <Field.Root required>
                                                                        <Field.Label>Arrival ICAO</Field.Label>
                                                                        <Input value={editRoute.arrivalIcao} onChange={e => setEditRoute({ ...editRoute, arrivalIcao: e.target.value.toUpperCase() })} />
                                                                    </Field.Root>
                                                                    <Field.Root>
                                                                        <Field.Label>Flight Time (HH:MM)</Field.Label>
                                                                        <Input value={editRoute.flightTime} onChange={e => setEditRoute({ ...editRoute, flightTime: e.target.value })} />
                                                                    </Field.Root>
                                                                    <Field.Root required>
                                                                        <AircraftSelect
                                                                            value={
                                                                                Array.isArray(editRoute?.aircraft)
                                                                                    ? editRoute.aircraft.filter(val => typeof val === 'string' && val.length > 0 && aircraftList.some(opt => opt.value === val))
                                                                                    : []
                                                                            }
                                                                            onChange={value => setEditRoute({ ...editRoute, aircraft: value })}
                                                                            placeholder="Select aircraft..."
                                                                            aircraftList={aircraftList}
                                                                        />
                                                                    </Field.Root>
                                                                </Stack>
                                                            )}
                                                        </Dialog.Body>
                                                        <Dialog.Footer>
                                                            <ButtonGroup>
                                                                <Button colorPalette="green" onClick={handleSaveEditRoute}>Save</Button>
                                                            </ButtonGroup>
                                                        </Dialog.Footer>
                                                    </Dialog.Content>
                                                </Dialog.Positioner>
                                            </Dialog.Root>
                                        </Portal>

                                        {/* Delete Route Dialog */}
                                        <Portal>
                                            <Dialog.Root open={isDeleteDialogOpen} onOpenChange={(e) => setDeleteDialogOpen(e.open)}>
                                                <Dialog.Backdrop />
                                                <Dialog.Positioner>
                                                    <Dialog.Content size="sm">
                                                        <Dialog.Header>
                                                            <Dialog.CloseTrigger asChild position="absolute" top="4" right="4"><CloseButton size="sm" /></Dialog.CloseTrigger>
                                                        </Dialog.Header>
                                                        <Dialog.Body>
                                                            <Text>Are you sure you want to delete this route?</Text>
                                                        </Dialog.Body>
                                                        <Dialog.Footer>
                                                            <ButtonGroup>
                                                                <Dialog.CloseTrigger asChild><Button variant="ghost">Cancel</Button></Dialog.CloseTrigger>
                                                                <Button colorPalette="red" onClick={handleConfirmDelete}>Delete</Button>
                                                            </ButtonGroup>
                                                        </Dialog.Footer>
                                                    </Dialog.Content>
                                                </Dialog.Positioner>
                                            </Dialog.Root>
                                        </Portal>
                                    </Table.Root>
                                </Table.ScrollArea>
                                {totalPages > 1 && (
                                    <Center p={4}>
                                        <Pagination.Root count={totalPages} page={currentPage} onPageChange={(details) => goToPage(details.page)}>
                                            <ButtonGroup variant="outline" size="sm">
                                                <Pagination.PrevTrigger asChild><Button>Previous</Button></Pagination.PrevTrigger>
                                                <Pagination.Items
                                                    render={(page) => (
                                                        <Button isActive={page.value === currentPage}>{page.value}</Button>
                                                    )}
                                                />
                                                <Pagination.NextTrigger asChild><Button>Next</Button></Pagination.NextTrigger>
                                            </ButtonGroup>
                                        </Pagination.Root>
                                    </Center>
                                )}
                            </Box>
                        </Stack>
                    </Container>
                </Box>
                <Portal>
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                        <Dialog.Content size="2xl">
                            <Dialog.Header>
                                <Dialog.CloseTrigger asChild position="absolute" top="4" right="4"><CloseButton size="sm" /></Dialog.CloseTrigger>
                            </Dialog.Header>
                            <Dialog.Body>
                                <Stack spacing={4} align="stretch">
                                    {newRoutes.map((route, index) => (
                                        <Box key={index} p={4} borderWidth="1px" borderColor="gray.200" rounded="md">
                                            <HStack justify="space-between" mb={4}>
                                                <Text fontWeight="medium">Route {index + 1}</Text>
                                                {newRoutes.length > 1 && (
                                                    <CloseButton size="sm" aria-label="Remove route" onClick={() => handleRemoveRouteRow(index)} />
                                                )}
                                            </HStack>
                                            <Stack spacing={4}>
                                                <Field.Root required>
                                                    <Field.Label>Flight Number</Field.Label>
                                                    <Input value={route.flightNumber} onChange={(e) => handleInputChange(index, 'flightNumber', e.target.value)} placeholder="e.g., AI101" />
                                                </Field.Root>
                                                <HStack spacing={4}>
                                                    <Field.Root required flex={1}>
                                                        <Field.Label>Departure ICAO</Field.Label>
                                                        <Input value={route.departureIcao} onChange={(e) => handleInputChange(index, 'departureIcao', e.target.value.toUpperCase())} placeholder="e.g., VIDP" maxLength={4} />
                                                    </Field.Root>
                                                    <Field.Root required flex={1}>
                                                        <Field.Label>Arrival ICAO</Field.Label>
                                                        <Input value={route.arrivalIcao} onChange={(e) => handleInputChange(index, 'arrivalIcao', e.target.value.toUpperCase())} placeholder="e.g., VABB" maxLength={4} />
                                                    </Field.Root>
                                                </HStack>
                                                <HStack spacing={4}>
                                                    <Field.Root flex={1}>
                                                        <Field.Label>Flight Time (HH:MM)</Field.Label>
                                                        <Input
                                                            type="text"
                                                            placeholder="HH:MM"
                                                            maxLength={5}
                                                            value={route.flightTime}
                                                            onChange={(e) => handleInputChange(index, 'flightTime', e.target.value)}
                                                        />
                                                    </Field.Root>
                                                    <Field.Root required flex={1}>
                                                        <AircraftSelect
                                                            value={typeof route.aircraft === 'string' ? route.aircraft.split(',').map(s => s.trim()).filter(Boolean) : (route.aircraft || [])}
                                                            onChange={(value) => handleInputChange(index, 'aircraft', value)}
                                                            placeholder="Select aircraft..."
                                                            aircraftList={aircraftList}
                                                        />
                                                    </Field.Root>
                                                </HStack>
                                            </Stack>
                                        </Box>
                                    ))}
                                    <Button leftIcon={<FiPlus />} variant="outline" onClick={handleAddRouteRow}>Add Another Route</Button>
                                </Stack>
                            </Dialog.Body>
                            <Dialog.Footer>
                                <ButtonGroup>
                                    <Dialog.CloseTrigger asChild><Button variant="ghost">Cancel</Button></Dialog.CloseTrigger>
                                    <Button colorPalette="green" onClick={handleSubmitRoutes}>Submit Routes</Button>
                                </ButtonGroup>
                            </Dialog.Footer>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>
        </Box>
    );
}
