'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
    Box,
    Heading,
    Input,
    InputGroup,
    Skeleton,
    Stack,
    IconButton,
    Text,
    Button,
    Spinner,
} from '@chakra-ui/react'

import { Table } from '@chakra-ui/react'
import { Alert } from '@chakra-ui/react'
import {
    FiSearch,
    FiEdit2,
    FiCheck,
    FiX,
} from 'react-icons/fi'

function RecruitsPage() {
    const [ applicants, setApplicants ] = useState([])
    const [ filtered, setFiltered ] = useState([])
    const [ loading, setLoading ] = useState(true)
    const [ error, setError ] = useState(null)
    const [ searchTerm, setSearchTerm ] = useState('')

    // Callsign editing state
    const [ editingId, setEditingId ] = useState(null) // which applicant's callsign is being edited
    const [ editValue, setEditValue ] = useState('')
    const [ validating, setValidating ] = useState(false)
    const [ validationResult, setValidationResult ] = useState(null) // { available, reason }
    const [ saving, setSaving ] = useState(false)
    const debounceRef = useRef(null)

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

    // Validate callsign with debounce
    const validateCallsign = useCallback((value, currentId) => {
        if (debounceRef.current) clearTimeout(debounceRef.current)

        // Quick client-side format check
        if (!/^INVA\d{3}$/.test(value)) {
            setValidationResult({ available: false, reason: 'Must match INVA*** format' })
            setValidating(false)
            return
        }

        if (value === currentId) {
            setValidationResult({ available: true })
            setValidating(false)
            return
        }

        setValidating(true)
        setValidationResult(null)

        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/admin/applicants?validate=${value}&current=${currentId}`)
                const json = await res.json()
                setValidationResult(json)
            } catch {
                setValidationResult({ available: false, reason: 'Validation failed' })
            } finally {
                setValidating(false)
            }
        }, 400)
    }, [])

    const startEditing = (app) => {
        setEditingId(app.id)
        setEditValue(app.id)
        setValidationResult({ available: true }) // current value is valid
    }

    const cancelEditing = () => {
        setEditingId(null)
        setEditValue('')
        setValidationResult(null)
        if (debounceRef.current) clearTimeout(debounceRef.current)
    }

    const handleEditChange = (value, currentId) => {
        const upper = value.toUpperCase()
        setEditValue(upper)
        validateCallsign(upper, currentId)
    }

    const handleSaveCallsign = async (oldId) => {
        if (!validationResult?.available || editValue === oldId) {
            cancelEditing()
            return
        }

        setSaving(true)
        try {
            const res = await fetch('/api/admin/applicants', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldId, newId: editValue }),
            })
            if (!res.ok) {
                const json = await res.json()
                throw new Error(json.error || 'Update failed')
            }

            // Update local state
            setApplicants(prev => prev.map(a => a.id === oldId ? { ...a, id: editValue } : a))
            cancelEditing()
        } catch (err) {
            alert(err.message)
        } finally {
            setSaving(false)
        }
    }

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

    const canSave = validationResult?.available && !validating && !saving && editValue !== editingId

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
                                        <Table.Cell fontWeight="medium" px={2} py={1} fontSize="sm">
                                            {editingId === app.id ? (
                                                <Stack direction="row" align="center" spacing={1}>
                                                    <Box position="relative">
                                                        <Input
                                                            size="sm"
                                                            value={editValue}
                                                            onChange={e => handleEditChange(e.target.value, app.id)}
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter' && canSave) handleSaveCallsign(app.id)
                                                                if (e.key === 'Escape') cancelEditing()
                                                            }}
                                                            maxLength={7}
                                                            w="100px"
                                                            fontFamily="mono"
                                                            borderColor={
                                                                validating ? 'yellow.400' :
                                                                validationResult?.available ? 'green.400' :
                                                                'red.400'
                                                            }
                                                            autoFocus
                                                        />
                                                        {validating && (
                                                            <Box position="absolute" right="2" top="50%" transform="translateY(-50%)">
                                                                <Spinner size="xs" />
                                                            </Box>
                                                        )}
                                                    </Box>
                                                    <IconButton
                                                        size="xs"
                                                        colorScheme="green"
                                                        aria-label="Save"
                                                        onClick={() => handleSaveCallsign(app.id)}
                                                        disabled={!canSave}
                                                    >
                                                        <FiCheck />
                                                    </IconButton>
                                                    <IconButton
                                                        size="xs"
                                                        variant="ghost"
                                                        aria-label="Cancel"
                                                        onClick={cancelEditing}
                                                    >
                                                        <FiX />
                                                    </IconButton>
                                                    {validationResult && !validationResult.available && !validating && (
                                                        <Text fontSize="xs" color="red.400" whiteSpace="nowrap">{validationResult.reason}</Text>
                                                    )}
                                                </Stack>
                                            ) : (
                                                <Stack direction="row" align="center" spacing={1}>
                                                    <Text>{app.id}</Text>
                                                    <IconButton
                                                        size="xs"
                                                        variant="ghost"
                                                        aria-label="Edit callsign"
                                                        onClick={() => startEditing(app)}
                                                    >
                                                        <FiEdit2 />
                                                    </IconButton>
                                                </Stack>
                                            )}
                                        </Table.Cell>
                                        <Table.Cell px={2} py={1} fontSize="sm">{app.ifcName || 'N/A'}</Table.Cell>
                                        <Table.Cell px={2} py={1} fontSize="sm">{app.discordId || 'N/A'}</Table.Cell>
                                        <Table.Cell px={2} py={1}>
                                            <Stack direction="row" spacing={2}>
                                                <Button size="sm" colorScheme="green" onClick={() => handleAccept(app.id)} disabled={editingId === app.id}>Accept</Button>
                                                <Button size="sm" colorScheme="red" onClick={() => handleRemove(app.id)} disabled={editingId === app.id}>Remove</Button>
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
