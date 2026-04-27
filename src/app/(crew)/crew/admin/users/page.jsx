
'use client'
import { useState, useEffect, useRef } from 'react'
import UserProfileModal from '@/components/admin/UserProfileModal'
import {
    Box,
    Heading,
    Input,
    InputGroup,
    Skeleton,
    Stack,
    IconButton,
    Menu,
    Text,
    Button
} from '@chakra-ui/react'

import { Table } from '@chakra-ui/react'
import { Alert } from '@chakra-ui/react'
import { Pagination } from '@chakra-ui/react'
import {
    FiSearch,
    FiMoreVertical,
    FiChevronUp,
    FiChevronDown,
    FiChevronLeft,
    FiChevronRight,
} from 'react-icons/fi'


function AdminUsersPage() {
    const [ users, setUsers ] = useState([])
    const [ loading, setLoading ] = useState(true)
    const [ error, setError ] = useState(null)
    const [ searchTerm, setSearchTerm ] = useState('')
    const [ debouncedSearch, setDebouncedSearch ] = useState('')
    const [ sortConfig, setSortConfig ] = useState({ key: 'lastActive', direction: 'desc' })
    const [ currentPage, setCurrentPage ] = useState(1)
    const [ totalUsers, setTotalUsers ] = useState(0)
    const [ bulkNoticing, setBulkNoticing ] = useState(false)
    const [ profileUserId, setProfileUserId ] = useState(null)
    const usersPerPage = 15
    const abortRef = useRef(null)

    const handleProfile = (userId) => setProfileUserId(userId)

    const handleRevokeAccess = async (userId) => {
        try {
            const res = await fetch(`/api/users?id=${userId}`, {
                method: 'DELETE'
            })
            if (!res.ok) {
                const errorData = await res.json()
                alert(`Failed to revoke access: ${errorData.error || res.statusText}`)
                return
            }
            alert(`User ${userId} revoked successfully`)
            // Refresh current page after delete to keep pagination accurate
            setUsers(prevUsers => prevUsers.filter(user => user.id !== userId))
            // Force a refetch by touching the debouncedSearch state (will trigger useEffect)
            setDebouncedSearch(s => s)
        } catch (error) {
            alert(`Error revoking access: ${error.message}`)
        }
    }

    const handleBulkInactiveNotice = async () => {
        if (!confirm('Send inactive notice to ALL pilots with no flight in the last 30 days?')) return
        setBulkNoticing(true)
        try {
            const res = await fetch('/api/inactive-notice/all', { method: 'POST' })
            const data = await res.json()
            if (!res.ok) {
                alert(`Failed: ${data.error || res.statusText}`)
                return
            }
            const { dm = 0, tagged = 0, failed = 0 } = data.results || {}
            alert(`Done — ${dm} DM'd, ${tagged} tagged in server, ${failed} failed.`)
        } catch (error) {
            alert(`Error: ${error.message}`)
        } finally {
            setBulkNoticing(false)
        }
    }

    const handleInactiveNotice = async (userId) => {
        try {
            const res = await fetch('/api/inactive-notice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ callsign: userId }),
            })
            const data = await res.json()
            if (!res.ok) {
                alert(`Failed to send notice: ${data.error || res.statusText}`)
                return
            }
            alert(`Inactive notice sent to ${userId} via Discord DM.`)
        } catch (error) {
            alert(`Error sending inactive notice: ${error.message}`)
        }
    }

    // Debounce searchTerm -> debouncedSearch
    useEffect(() => {
        const id = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300)
        return () => clearTimeout(id)
    }, [ searchTerm ])

    // Fetch users from API whenever page, search, or sort changes
    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true)
            setError(null)

            if (abortRef.current) abortRef.current.abort()
            const controller = new AbortController()
            abortRef.current = controller

            try {
                const params = new URLSearchParams()
                params.set('page', String(currentPage))
                params.set('limit', String(usersPerPage))
                if (debouncedSearch) params.set('name', debouncedSearch)
                if (sortConfig.key) {
                    params.set('sortBy', sortConfig.key)
                    params.set('sortDir', sortConfig.direction)
                }

                const res = await fetch(`/api/users?${params.toString()}`, { signal: controller.signal })
                if (!res.ok) throw new Error('Failed to fetch users')
                const json = await res.json()
                const data = json.data || []
                setUsers(data)
                setTotalUsers(json.pagination?.total ?? data.length)
            } catch (err) {
                if (err.name === 'AbortError') return
                setError(err.message)
                setUsers([])
                setTotalUsers(0)
            } finally {
                setLoading(false)
                abortRef.current = null
            }
        }

        fetchUsers()
    }, [ currentPage, debouncedSearch, sortConfig ])

    const totalPages = Math.ceil(totalUsers / usersPerPage)
    const currentUsers = users

    const isOldTimestamp = timestamp => {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return new Date(timestamp) < thirtyDaysAgo
    }

    const requestSort = key => {
        setCurrentPage(1)
        setSortConfig({
            key,
            direction: sortConfig.key === key && sortConfig.direction === 'desc' ? 'asc' : 'desc',
        })
    }


    return (
        <>
        <Box p={{ base: 4, md: 6 }} minH="100vh">
            <Stack spacing={6}>
                <Stack direction="row" justify="space-between" align="center">
                    <Heading size="lg">Pilot Management Console</Heading>
                    <Button
                        size="sm"
                        colorPalette="orange"
                        variant="subtle"
                        loading={bulkNoticing}
                        loadingText="Sending..."
                        onClick={handleBulkInactiveNotice}
                    >
                        Send Inactive Notice to All
                    </Button>
                </Stack>
                <InputGroup maxW="md" startElement={<FiSearch color="fg-subtle" />}>
                    <Input
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={e => {
                            setSearchTerm(e.target.value)
                            // reset to first page when typing a new query
                            setCurrentPage(1)
                        }}
                        variant="filled"
                        bg="bg.muted"
                    />
                </InputGroup>

                {error && (
                    <Alert.Root status="error" variant="subtle" borderRadius="md">
                        <Alert.Indicator />
                        <Alert.Content>
                            <Alert.Title>Error</Alert.Title>
                            <Alert.Description>{error}</Alert.Description>
                        </Alert.Content>
                    </Alert.Root>
                )}

                <Box overflowX="auto" borderWidth="1px" borderRadius="md" bg="bg.default">
                    <Table.Root variant="simple" minW="600px">
                        <Table.Header bg="bg.muted">
                            <Table.Row>
                                <Table.ColumnHeader px={2} py={2}>Name</Table.ColumnHeader>
                                <Table.ColumnHeader px={2} py={2} cursor="pointer" onClick={() => requestSort('lastActive')}>
                                    <Stack direction="row" align="center" spacing={0.5} fontSize="sm">
                                        <span>Rank</span>
                                    </Stack>
                                </Table.ColumnHeader>
                                <Table.ColumnHeader
                                    px={2}
                                    py={2}
                                    cursor="pointer"
                                    onClick={() => requestSort('lastActive')}
                                >
                                    <Stack direction="row" align="center" spacing={0.5} fontSize="sm">
                                        <span>Last Active</span>
                                        {sortConfig.key === 'lastActive' &&
                                            (sortConfig.direction === 'asc' ? (
                                                <FiChevronUp />
                                            ) : (
                                                <FiChevronDown />
                                            ))}
                                    </Stack>
                                </Table.ColumnHeader>
                                <Table.ColumnHeader px={2} py={2}>Actions</Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {loading ? (
                                Array.from({ length: 15 }).map((_, idx) => (
                                    <Table.Row key={idx}>
                                        <Table.Cell colSpan={4} px={2} py={1}>
                                            <Skeleton height="20px" borderRadius="md" />
                                        </Table.Cell>
                                    </Table.Row>
                                ))
                            ) : currentUsers.length === 0 ? (
                                <Table.Row>
                                    <Table.Cell colSpan={4} px={2} py={1}>
                                        <Text textAlign="center" fontSize="sm">No users found.</Text>
                                    </Table.Cell>
                                </Table.Row>
                            ) : (
                                currentUsers.map(user => (
                                    <Table.Row key={user.id}>
                                        <Table.Cell fontWeight="medium" px={2} py={1} fontSize="sm">{user.name}</Table.Cell>
                                        <Table.Cell px={2} py={1} fontSize="sm">{user.rank}</Table.Cell>
                                        <Table.Cell
                                            color={isOldTimestamp(user.lastActive) ? 'fg.warning' : undefined}
                                            px={2}
                                            py={1}
                                            fontSize="sm"
                                        >
                                            {new Date(user.lastActive).toLocaleString()}
                                        </Table.Cell>
                                        <Table.Cell px={2} py={1}>
                                            <Menu.Root colorPalette="gray">
                                                <Menu.Trigger asChild>
                                                    <IconButton
                                                        color="blue"
                                                        variant="ghost"
                                                        size="sm"
                                                        aria-label="Actions"
                                                    >
                                                        <FiMoreVertical />
                                                    </IconButton>
                                                </Menu.Trigger>
                                                <Menu.Positioner>
                                                    <Menu.Content>
                                                        <Menu.Item cursor="pointer" onClick={() => handleProfile(user.id)}>
                                                            Profile
                                                        </Menu.Item>
                                                        <Menu.Item
                                                            color="fg.error"
                                                            cursor="pointer"
                                                            onClick={async () => {
                                                                await handleRevokeAccess(user.id)
                                                                // After revoke, refetch current page
                                                                setCurrentPage(1)
                                                            }}
                                                        >
                                                            Revoke Access
                                                        </Menu.Item>
                                                        <Menu.Item
                                                            color="fg.warning"
                                                            cursor="pointer"
                                                            onClick={() => handleInactiveNotice(user.id)}
                                                        >
                                                            Inactive Notice
                                                        </Menu.Item>
                                                    </Menu.Content>
                                                </Menu.Positioner>
                                            </Menu.Root>
                                        </Table.Cell>
                                    </Table.Row>
                                ))
                            )}
                        </Table.Body>
                    </Table.Root>
                </Box>

                <Pagination.Root
                    count={totalUsers}
                    page={currentPage}
                    pageSize={usersPerPage}
                    onPageChange={(details) => setCurrentPage(details.page)}
                >
                    <Stack direction="row" color="fg" justify="flex-end" align="center" gap={2} mt={2}>
                        <Pagination.PrevTrigger aria-label="Previous page">
                            <FiChevronLeft />
                        </Pagination.PrevTrigger>
                        <Pagination.Items
                            render={(p) => (
                                <Button
                                    key={p.value}
                                    aria-label={`Go to page ${p.value}`}
                                    variant={p.isSelected ? 'solid' : 'ghost'}
                                    isActive={p.isSelected}
                                    onClick={p.onClick}
                                    size="sm"
                                    color="fg"
                                >
                                    {p.value}
                                </Button>
                            )}
                        />
                        <Pagination.NextTrigger aria-label="Next page">
                            <FiChevronRight />
                        </Pagination.NextTrigger>
                    </Stack>
                </Pagination.Root>
            </Stack>
        </Box>

        <UserProfileModal
            userId={profileUserId}
            onClose={() => setProfileUserId(null)}
        />
        </>
    );
}

export default AdminUsersPage;
