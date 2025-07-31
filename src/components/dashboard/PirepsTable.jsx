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
                        No PIREPs submitted yet
                    </Heading>
                </Box>
            </Container>
        )
    }

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
                <Stack spacing="6">
                    <Heading size="lg" color="fg" fontWeight="bold">
                        Recent PIREPs
                    </Heading>

                    <Box overflowX="auto">
                        <Table.Root variant="simple" size="md">
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeader color="fg" fontWeight="semibold">Flight #</Table.ColumnHeader>
                                    <Table.ColumnHeader color="fg" fontWeight="semibold">Departure</Table.ColumnHeader>
                                    <Table.ColumnHeader color="fg" fontWeight="semibold">Arrival</Table.ColumnHeader>
                                    <Table.ColumnHeader color="fg" fontWeight="semibold">Flight Time</Table.ColumnHeader>
                                    <Table.ColumnHeader color="fg" fontWeight="semibold">Aircraft</Table.ColumnHeader>
                                    <Table.ColumnHeader color="fg" fontWeight="semibold">Status</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {pireps.map((pirep) => (
                                    <Table.Row key={pirep.pirepId}>
                                        <Table.Cell fontWeight="medium">{pirep.flightNumber}</Table.Cell>
                                        <Table.Cell>{pirep.departureIcao}</Table.Cell>
                                        <Table.Cell>{pirep.arrivalIcao}</Table.Cell>
                                        <Table.Cell>{pirep.flightTime}</Table.Cell>
                                        <Table.Cell>{pirep.aircraft}</Table.Cell>
                                        <Table.Cell>
                                            <Badge
                                                colorScheme={pirep.approved ? 'green' : 'yellow'}
                                                variant="subtle"
                                                rounded="full"
                                                px="2"
                                                py="1"
                                            >
                                                {pirep.approved ? 'Approved' : 'Pending'}
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