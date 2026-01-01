// src/components/dashboard/Notams.jsx

import { Table, Box, Text } from "@chakra-ui/react";

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
        bg="bg.subtle"
      >
        <Table.Header
          position="sticky"
          top="0"
          bg="bg.muted"
          zIndex="10"
        >
          <Table.Row>
            <Table.ColumnHeader colSpan={3} textAlign="center" color="fg">
              NOTAMS
            </Table.ColumnHeader>
          </Table.Row>

          <Table.Row>
            <Table.ColumnHeader width="15%" color="fg">Issued</Table.ColumnHeader>
            <Table.ColumnHeader width="70%" color="fg">Notice</Table.ColumnHeader>
            <Table.ColumnHeader width="15%" color="fg">Valid until</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {notams.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={3} textAlign="center" py={4}>
                <Text color="fg.muted">No NOTAMs available</Text>
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
                    <Table.Cell color="fg.muted">{formatDate(notam.issued)}</Table.Cell>
                    <Table.Cell
                      whiteSpace="normal"
                      overflow="hidden"
                      textOverflow="ellipsis"
                      color="fg"
                    >
                      {notam.desc}
                    </Table.Cell>
                    <Table.Cell color="fg.muted">{formatDate(notam.expiresOn)}</Table.Cell>
                  </Table.Row>
                );
              })
          )}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}

