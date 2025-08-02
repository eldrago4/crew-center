// src/components/dashboard/Notams.jsx

import { Table } from '@chakra-ui/react'

export default function Notams({ notams = [] }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
<Table.ScrollArea maxH="320px" overflowX="hidden" rounded="md">
  <Table.Root mt="8" borderWidth="1px">
    <Table.Header>
      <Table.Row>
        <Table.ColumnHeader colSpan={3} textAlign="center">NOTAMS</Table.ColumnHeader>
      </Table.Row>
      <Table.Row>
        <Table.ColumnHeader width="15%">Issued</Table.ColumnHeader>
        <Table.ColumnHeader width="70%">Notice</Table.ColumnHeader>
        <Table.ColumnHeader width="15%">Valid until</Table.ColumnHeader>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {notams.length === 0 ? (
        <Table.Row>
          <Table.Cell colSpan={3} textAlign="center" py={4}>
            No NOTAMs available
          </Table.Cell>
        </Table.Row>
      ) : (
        notams
          .sort((a, b) => new Date(b.issued) - new Date(a.issued)) // Sort by issued date, latest first
          .map((notam) => {
            const isExpired = new Date(notam.expiresOn) < new Date();
            return (
              <Table.Row key={notam.issued} textDecoration={isExpired ? "line-through" : "none"}>
                <Table.Cell>{formatDate(notam.issued)}</Table.Cell>
                <Table.Cell whiteSpace="normal" overflow="hidden" textOverflow="ellipsis">{notam.desc}</Table.Cell>
                <Table.Cell>{formatDate(notam.expiresOn)}</Table.Cell>
              </Table.Row>
            );
          })
      )}
    </Table.Body>
  </Table.Root>
</Table.ScrollArea>

  )
}
