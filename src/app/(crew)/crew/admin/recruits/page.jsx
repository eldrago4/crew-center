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
    Text,
    Button
} from '@chakra-ui/react'

import { Table } from '@chakra-ui/react'
import { Alert } from '@chakra-ui/react'
import {
    FiSearch,
    FiMoreVertical
} from 'react-icons/fi'

function RecruitsPage() {
    const [ applicants, setApplicants ] = useState([])
    const [ filtered, setFiltered ] = useState([])
    const [ loading, setLoading ] = useState(true)
    const [ error, setError ] = useState(null)
    const [ searchTerm, setSearchTerm ] = useState('')

    useEffect(() => {
        const fetchApplicants = async () => {
            try {
                const res = await fetch('/api/admin/applicants')
                if (!res.ok) throw new Error('Failed to fetch applicants')
                const json = await res.json()
                setApplicants(json.data || [])
                setFiltered(json.data || [])
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchApplicants()
    }, [])

    useEffect(() => {
        if (!searchTerm) return setFiltered(applicants)
        setFiltered(applicants.filter(a => (a.ifcName || '').toLowerCase().includes(searchTerm.toLowerCase()) || (a.id || '').toLowerCase().includes(searchTerm.toLowerCase())))
    }, [ applicants, searchTerm ])

    const handleAccept = async (id) => {
        if (!confirm(`Accept applicant ${id}? This will create a user entry.`)) return
        try {
            const res = await fetch('/api/admin/applicants', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
            if (!res.ok) throw new Error('Accept failed')
            setApplicants(prev => prev.filter(a => a.id !== id))
            setFiltered(prev => prev.filter(a => a.id !== id))
        } catch (err) {
            alert(err.message)
        }
    }

    const handleRemove = async (id) => {
        if (!confirm(`Remove applicant ${id}? This will delete the applicant record.`)) return
        try {
            const res = await fetch(`/api/admin/applicants?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Remove failed')
            setApplicants(prev => prev.filter(a => a.id !== id))
            setFiltered(prev => prev.filter(a => a.id !== id))
        } catch (err) {
            alert(err.message)
        }
    }

    return (
        <Box p={{ base: 4, md: 6 }} minH="100vh">
            <Stack spacing={6}>
                <Heading size="lg">Recruit Management</Heading>
                <InputGroup maxW="md" startElement={<FiSearch color="fg-subtle" />}>
                    <Input placeholder="Search applicants by ID or name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} variant="filled" bg="bg.muted" />
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
                                <Table.ColumnHeader px={2} py={2}>Callsign</Table.ColumnHeader>
                                <Table.ColumnHeader px={2} py={2}>IFC Name</Table.ColumnHeader>
                                <Table.ColumnHeader px={2} py={2}>Discord ID</Table.ColumnHeader>
                                <Table.ColumnHeader px={2} py={2}>Actions</Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {loading ? (
                                Array.from({ length: 8 }).map((_, idx) => (
                                    <Table.Row key={idx}><Table.Cell colSpan={4}><Skeleton height="20px" borderRadius="md" /></Table.Cell></Table.Row>
                                ))
                            ) : filtered.length === 0 ? (
                                <Table.Row><Table.Cell colSpan={4}><Text textAlign="center">No applicants found.</Text></Table.Cell></Table.Row>
                            ) : (
                                filtered.map(app => (
                                    <Table.Row key={app.id}>
                                        <Table.Cell fontWeight="medium" px={2} py={1} fontSize="sm">{app.id}</Table.Cell>
                                        <Table.Cell px={2} py={1} fontSize="sm">{app.ifcName || 'N/A'}</Table.Cell>
                                        <Table.Cell px={2} py={1} fontSize="sm">{app.discordId || 'N/A'}</Table.Cell>
                                        <Table.Cell px={2} py={1}>
                                            <Stack direction="row" spacing={2}>
                                                <Button size="sm" colorScheme="green" onClick={() => handleAccept(app.id)}>Accept</Button>
                                                <Button size="sm" colorScheme="red" onClick={() => handleRemove(app.id)}>Remove</Button>
                                            </Stack>
                                        </Table.Cell>
                                    </Table.Row>
                                ))
                            )}
                        </Table.Body>
                    </Table.Root>
                </Box>
            </Stack>
        </Box>
    )
}

export default RecruitsPage
