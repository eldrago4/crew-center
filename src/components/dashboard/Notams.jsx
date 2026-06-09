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
    // position:absolute + inset:0 lets the card take its height from the profile
    // card beside it (via the relative GridItem in BasicInfo) without inflating
    // the row, so it stays a fixed-size card with the content scrolling inside.
    <Box
      position="absolute"
      inset="0"
      display="flex"
      flexDirection="column"
      backgroundColor="#FAFAFA"
      _dark={{ backgroundColor: '#1e2022' }}
      borderWidth="1px"
      borderColor="border"
      rounded="2xl"
      shadow="sm"
      overflow="hidden"
    >
      {/* Scroll area — content scrolls here, under the sticky header. */}
      <Box
        flex="1"
        minH="0"
        overflowY="auto"
        overflowX="hidden"
        css={{
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { background: '#555', borderRadius: '8px' },
          '&::-webkit-scrollbar-thumb:hover': { background: '#666' },
          scrollbarWidth: 'thin',
          scrollbarColor: '#555 transparent',
        }}
      >
        <Table.Root width="100%" tableLayout="fixed" backgroundColor="#FAFAFA" _dark={{ backgroundColor: '#1e2022' }}>
          <Table.Header
            position="sticky"
            top="0"
            backgroundColor="#FAFAFA"
            _dark={{ backgroundColor: '#1e2022' }}
            zIndex="10"
          >
            <Table.Row backgroundColor="#FAFAFA" _dark={{ backgroundColor: '#1e2022' }}>
              <Table.ColumnHeader colSpan={3} textAlign="center" color="gray.800" _dark={{ color: 'gray.100' }} borderBottomWidth="0" pb="1">
                NOTAMS
              </Table.ColumnHeader>
            </Table.Row>

            <Table.Row backgroundColor="#FAFAFA" _dark={{ backgroundColor: '#1e2022' }}>
              <Table.ColumnHeader width="15%" color="gray.800" _dark={{ color: 'gray.100' }} pt="1">Issued</Table.ColumnHeader>
              <Table.ColumnHeader width="70%" color="gray.800" _dark={{ color: 'gray.100' }} pt="1">Notice</Table.ColumnHeader>
              <Table.ColumnHeader width="15%" color="gray.800" _dark={{ color: 'gray.100' }} pt="1">Valid until</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {notams.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={3} textAlign="center" py={4}>
                  <Text color="gray.600" _dark={{ color: 'gray.400' }}>No NOTAMs available</Text>
                </Table.Cell>
              </Table.Row>
            ) : (
              [...notams]
                .sort((a, b) => new Date(b.issued) - new Date(a.issued))
                .map((notam) => {
                  const expiresOn = getValidDate(notam.expiresOn);
                  const isExpired = expiresOn ? expiresOn < new Date() : false;

                  return (
                    <Table.Row
                      key={notam.issued}
                      textDecorationLine={isExpired ? "line-through" : "none"}
                      textDecorationColor={isExpired ? "#888" : undefined}
                      _dark={isExpired ? { textDecorationColor: "#cfcfcf" } : undefined}
                    >
                      <Table.Cell color="gray.600" _dark={{ color: 'gray.400' }}>{formatDate(notam.issued)}</Table.Cell>
                      <Table.Cell
                        whiteSpace="normal"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        color={isExpired ? "gray.600" : "gray.800"}
                        _dark={{ color: isExpired ? 'gray.400' : 'gray.100' }}
                      >
                        {notam.desc}
                      </Table.Cell>
                      <Table.Cell color="gray.600" _dark={{ color: 'gray.400' }}>{formatDate(notam.expiresOn)}</Table.Cell>
                    </Table.Row>
                  );
                })
            )}
          </Table.Body>
        </Table.Root>
      </Box>
    </Box>
  );
}
