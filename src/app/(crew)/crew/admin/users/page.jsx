
'use client'
import { useState, useEffect } from 'react'
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
    const { data: session, status } = useSession();
    const [ users, setUsers ] = useState([])
    const [ filteredUsers, setFilteredUsers ] = useState([])
    const [ loading, setLoading ] = useState(true)
    const [ error, setError ] = useState(null)
    const [ searchTerm, setSearchTerm ] = useState('')
    const [ sortConfig, setSortConfig ] = useState({ key: 'lastActive', direction: 'desc' })
    const [ currentPage, setCurrentPage ] = useState(1)
    const usersPerPage = 15

    // Define handlers for menu actions
    const handleProfile = (userId) => {
        alert(`Profile clicked for user ${userId}`)
    }

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
            setUsers(prevUsers => prevUsers.filter(user => user.id !== userId))
            setFilteredUsers(prevUsers => prevUsers.filter(user => user.id !== userId))
        } catch (error) {
            alert(`Error revoking access: ${error.message}`)
        }
    }

    const handleInactiveNotice = (userId) => {
        alert(`Inactive Notice clicked for user ${userId}`)
    }

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch('/api/users')
                if (!res.ok) throw new Error('Failed to fetch users')
                const json = await res.json()
                const data = json.data || []
                setUsers(data)
                setFilteredUsers(data)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchUsers()
    }, [])

    useEffect(() => {
        let result = [ ...users ]
        if (searchTerm) {
            result = result.filter(
                user =>
                    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.rank.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }
        if (sortConfig.key) {
            result.sort((a, b) => {
                if (sortConfig.key === 'lastActive') {
                    return sortConfig.direction === 'asc'
                        ? new Date(a.lastActive) - new Date(b.lastActive)
                        : new Date(b.lastActive) - new Date(a.lastActive)
                }
                return 0
            })
        }
        setFilteredUsers(result)
        setCurrentPage(1)
    }, [ users, searchTerm, sortConfig ])

    const totalPages = Math.ceil(filteredUsers.length / usersPerPage)
    const indexOfLastUser = currentPage * usersPerPage
    const indexOfFirstUser = indexOfLastUser - usersPerPage
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser)

    const isOldTimestamp = timestamp => {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return new Date(timestamp) < thirtyDaysAgo
    }

    const requestSort = key => {
        setSortConfig({
            key,
            direction: sortConfig.key === key && sortConfig.direction === 'desc' ? 'asc' : 'desc',
        })
    }


    return (
            <Box p={{ base: 4, md: 6 }} minH="100vh">
                <Stack spacing={6}>
                    <Heading size="lg">Pilot Management Console</Heading>
                    <InputGroup maxW="md" startElement={<FiSearch color="fg-subtle" />}>
                        <Input
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
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
                                                                onClick={() => handleRevokeAccess(user.id)}
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
                        count={filteredUsers.length}
                        page={currentPage}
                        pageSize={usersPerPage}
                        onChange={setCurrentPage}
                    >
                        <Stack direction="row" color="fg" justify="flex-end" align="center" gap={2} mt={2}>
                            <Pagination.PrevTrigger aria-label="Previous page">
                                <FiChevronLeft />
                            </Pagination.PrevTrigger>
                            <Pagination.Items
                                render={({ page: pageNumber, isSelected, onClick }) => (
                                    <Button
                                        key={pageNumber}
                                        aria-label={`Go to page ${pageNumber}`}
                                        variant={isSelected ? 'solid' : 'ghost'}
                                        isActive={isSelected}
                                        onClick={onClick}
                                        size="sm"
                                        color="fg"
                                    >
                                        {pageNumber}
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
    );
}

export default AdminUsersPage;
