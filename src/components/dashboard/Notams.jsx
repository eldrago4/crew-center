// src/components/dashboard/Notams.jsx

import { Table, Box, Text } from "@chakra-ui/react";

export default function Notams({ notams = [] }) {
  const getValidDate = (dateString) => {
    if (!dateString) return null;
    const value = String(dateString).trim();
    if (!value || value.toLowerCase() === "n/a" || value.toLowerCase() === "na") return null;

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const formatDate = (dateString) => {
    const date = getValidDate(dateString);
    if (!date) return "N/A";

    return date.toLocaleDateString("en-US", {
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
                const expiresOn = getValidDate(notam.expiresOn);
                const isExpired = expiresOn ? expiresOn < new Date() : false;

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
