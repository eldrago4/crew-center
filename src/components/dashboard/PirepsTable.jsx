// app/components/dashboard/PirepsTable.jsx
'use client'

import {
    Table,
    Badge,
    Container,
    Box,
    Heading,
    Stack
} from '@chakra-ui/react'

export default function PirepsTable({ pireps }) {
    if (!pireps || pireps.length === 0) {
        return (
            <Container maxW="100%" pt="4" pb="8" px="4">
                <Box
                    bg="bg.subtle"
                    borderWidth="1px"
                    borderColor="border"
                    rounded="2xl"
                    p="8"
                    shadow="sm"
                >
                    <Heading size="md" color="fg" opacity={0.8}>
                        No PIREPs submitted yet
                    </Heading>
                </Box>
            </Container>
        )
    }

    return (
        <Container maxW="100%" pt="4" pb="8" px="4">
            <Box
                bg="bg.subtle"
                borderWidth="1px"
                borderColor="border"
                rounded="2xl"
                p="8"
                shadow="sm"
            >
                <Stack spacing="6">
                    <Heading size="lg" color="fg" fontWeight="bold">
                        Recent PIREPs
                    </Heading>

                    <Box overflowX="auto">
                        <Table.Root variant="simple" size="md">
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeader color="fg" fontWeight="semibold" textAlign="center">Flight No.</Table.ColumnHeader>
                                    <Table.ColumnHeader color="fg" fontWeight="semibold" textAlign="center">Date</Table.ColumnHeader>
                                    <Table.ColumnHeader color="fg" fontWeight="semibold" textAlign="center">Departure</Table.ColumnHeader>
                                    <Table.ColumnHeader color="fg" fontWeight="semibold" textAlign="center">Arrival</Table.ColumnHeader>
                                    <Table.ColumnHeader color="fg" fontWeight="semibold" textAlign="center">Flight Time</Table.ColumnHeader>
                                    <Table.ColumnHeader color="fg" fontWeight="semibold" textAlign="center">Aircraft</Table.ColumnHeader>
                                    <Table.ColumnHeader color="fg" fontWeight="semibold" textAlign="center">Status</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {pireps.map((pirep) => (
                                    <Table.Row key={pirep.pirepId}>
                                        <Table.Cell fontWeight="medium" color="fg" textAlign="center">{pirep.flightNumber}</Table.Cell>
                                        <Table.Cell color="fg.muted" whiteSpace="nowrap" textAlign="center">
                                            {pirep.date ? new Date(pirep.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                                        </Table.Cell>
                                        <Table.Cell color="fg.muted" textAlign="center">{pirep.departureIcao}</Table.Cell>
                                        <Table.Cell color="fg.muted" textAlign="center">{pirep.arrivalIcao}</Table.Cell>
                                        <Table.Cell color="fg.muted" textAlign="center">{pirep.flightTime}</Table.Cell>
                                        <Table.Cell color="fg.muted" textAlign="center">{pirep.aircraft}</Table.Cell>
                                        <Table.Cell textAlign="center">
                                            <Badge
                                                colorPalette={
                                                    pirep.approved === true
                                                        ? 'green'
                                                        : pirep.approved === null
                                                            ? 'yellow'
                                                            : 'red'
                                                }
                                                variant="subtle"
                                                rounded="full"
                                                px="2"
                                                py="1"
                                            >
                                                {
                                                    pirep.approved === true
                                                        ? 'Approved'
                                                        : pirep.approved === null
                                                            ? 'Pending'
                                                            : 'Rejected'
                                                }
                                            </Badge>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    </Box>
                </Stack>
            </Box>
        </Container>
    )
}

