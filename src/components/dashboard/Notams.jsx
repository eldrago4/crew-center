// src/components/dashboard/Notams.jsx

import { Table, Box } from "@chakra-ui/react";

export default function Notams({ notams = [] }) {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Box
      maxH="320px"
      overflowY="auto"
      overflowX="hidden"
      rounded="md"
      width="100%"
      position="relative"
      ml="3"
      mt="8"

    >
      <Table.Root
        borderWidth="1px"
        width="100%"         
        tableLayout="fixed"   
      >
        <Table.Header
          position="sticky"
          top="0"
          bg="white"
          zIndex="10"         // 🔥 sticky header won’t clip under body
        >
          <Table.Row>
            <Table.ColumnHeader colSpan={3} textAlign="center">
              NOTAMS
            </Table.ColumnHeader>
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
              .sort((a, b) => new Date(b.issued) - new Date(a.issued))
              .map((notam) => {
                const isExpired = new Date(notam.expiresOn) < new Date();
                return (
                  <Table.Row
                    key={notam.issued}
                    textDecoration={isExpired ? "line-through" : "none"}
                  >
                    <Table.Cell>{formatDate(notam.issued)}</Table.Cell>
                    <Table.Cell
                      whiteSpace="normal"
                      overflow="hidden"
                      textOverflow="ellipsis"
                    >
                      {notam.desc}
                    </Table.Cell>
                    <Table.Cell>{formatDate(notam.expiresOn)}</Table.Cell>
                  </Table.Row>
                );
              })
          )}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
