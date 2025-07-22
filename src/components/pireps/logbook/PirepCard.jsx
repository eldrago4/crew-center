'use client'; // This directive makes PirepCard a Client Component

import {
  Box,
  Card,
  Heading,
  VStack,
  HStack,
  Icon,
  Badge,
  Separator, // Reverted to Separator for Chakra UI v3.2.2
  Text,
} from '@chakra-ui/react';
import { LuPlane } from 'react-icons/lu';

// A redesigned horizontal Card component that looks like a ticket
const PirepCard = ({ pirep }) => {
  return (
    <Card.Root
      direction="row"
      overflow="hidden"
      variant="outline"
      width="full"
      maxW="3xl" // Increased max-width for the horizontal layout
    >
      <HStack spacing="0" align="stretch">
        {/* Main Flight Details Section (Left) */}
        <VStack align="start" spacing="4" flex="1" p="4">
          <HStack w="full" justify="space-between">
            <Box>
              <Text fontSize="xs" color="fg.muted">Flight</Text>
              <Heading size="md">{pirep.flightNumber}</Heading>
            </Box>
            <Box textAlign="end">
              <Text fontSize="xs" color="fg.muted">Aircraft</Text>
              <Heading size="md">{pirep.aircraft}</Heading>
            </Box>
          </HStack>

          <HStack w="full" justify="space-between" align="center">
            <VStack align="start" gap="0">
              <Text fontSize="xs" color="fg.muted">From</Text>
              <Heading size="2xl">{pirep.departureIcao}</Heading>
            </VStack>
            {/* Correct way to use Icon with a component from react-icons */}
            <Icon boxSize="8" color="fg.subtle"><LuPlane /></Icon>
            <VStack align="end" gap="0">
              <Text fontSize="xs" color="fg.muted">To</Text>
              <Heading size="2xl">{pirep.arrivalIcao}</Heading>
            </VStack>
          </HStack>

          {pirep.comments && (
            <Text fontSize="sm" color="fg.muted" pt="2" w="full" borderTopWidth="1px" borderColor="border">
              "{pirep.comments}"
            </Text>
          )}
        </VStack>

        {/* Separator (using Separator) */}
        <Separator orientation="vertical" variant="dashed" />

        {/* Ticket Stub Section (Right) */}
        <VStack w="140px" justify="space-between" p="4" bg="bg.subtle">
          <VStack gap="0">
            <Text fontSize="xs" color="fg.muted">Flight Time</Text>
            <Text fontSize="2xl" fontWeight="bold">
              {pirep.flightTime.split(':').slice(0, 2).join(':')}
            </Text>
          </VStack>
          <VStack gap="0">
            <Text fontSize="xs" color="fg.muted">Multiplier</Text>
            <Text fontSize="2xl" fontWeight="bold">{pirep.multiplier}x</Text>
          </VStack>
          <Badge
            size="lg"
            colorPalette={pirep.valid ? "green" : "yellow"}
            variant="solid"
            alignSelf="stretch"
            textAlign="center"
          >
            {pirep.valid ? 'Valid' : 'Pending'}
          </Badge>
        </VStack>
      </HStack>
    </Card.Root>
  );
};

export default PirepCard;
