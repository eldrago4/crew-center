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

const CODESHARE_EMOJI_BASE = '/codeshare-emojis';
const CODESHARE_EMOJI_FILES = {
  '6E': '6E.png',
  '9W': '9W.png',
  AC: 'AC.png',
  AI: 'AI.png',
  AIH: 'AIH.png',
  AV: 'AV.png',
  AZ: 'AZ.png',
  BR: 'BR.png',
  BW: 'BW.png',
  CI: 'CI.png',
  CM: 'CM.png',
  CX: 'CX.png',
  EK: 'EK.png',
  ET: 'ET.png',
  EY: 'EY.png',
  FI: 'FI.png',
  FR: 'FR.png',
  GA: 'GA.png',
  HU: 'HU.png',
  IX: 'IX.png',
  KE: 'KE.png',
  KQ: 'KQ.png',
  LH: 'LH.png',
  LO: 'LO.png',
  LX: 'LX.png',
  MK: 'MK.png',
  MS: 'MS.png',
  NH: 'NH.png',
  OD: 'OD-ID-SL-JT.png',
  ID: 'OD-ID-SL-JT.png',
  SL: 'OD-ID-SL-JT.png',
  JT: 'OD-ID-SL-JT.png',
  QF: 'QF.png',
  QR: 'QR.png',
  SA: 'SA.png',
  SN: 'SN.png',
  SQ: 'SQ.png',
  SV: 'SV.png',
  TG: 'TG.png',
  TK: 'TK.png',
  TP: 'TP.png',
  U2: 'U2.png',
  UA: 'UA.png',
  UK: 'UK.png',
  VN: 'VN.png',
};

const CODESHARE_PREFIXES = Object.keys(CODESHARE_EMOJI_FILES).sort((a, b) => b.length - a.length);

function getCodeshareEmoji(flightNumber) {
  const normalizedFlightNumber = String(flightNumber || '').toUpperCase().replace(/[\s-]/g, '');
  const prefix = CODESHARE_PREFIXES.find(code => normalizedFlightNumber.startsWith(code));
  const fileName = prefix ? CODESHARE_EMOJI_FILES[prefix] : null;
  return fileName ? `${CODESHARE_EMOJI_BASE}/${fileName}` : null;
}

// A redesigned horizontal Card component that looks like a ticket
const PirepCard = ({ pirep }) => {
  const codeshareEmoji = getCodeshareEmoji(pirep.flightNumber);

  return (
    <Card.Root
      direction="row"
      overflow="hidden"
      variant="outline"
      width="full"
      maxW="3xl" // Increased max-width for the horizontal layout
      position="relative"
    >
      {codeshareEmoji && (
        <Box
          as="img"
          src={codeshareEmoji}
          alt=""
          aria-hidden="true"
          position="absolute"
          right={{ base: '-18px', sm: '8px' }}
          top="50%"
          transform="translateY(-50%)"
          h={{ base: '118px', md: '150px' }}
          maxW="45%"
          objectFit="contain"
          opacity={0.09}
          pointerEvents="none"
          userSelect="none"
          zIndex={0}
        />
      )}

      <HStack spacing="0" align="stretch" position="relative" zIndex={1} w="full">
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
              "{pirep.adminComments}"
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
            colorPalette={pirep.valid === null ? 'yellow' : (pirep.valid === false ? 'red' : 'green')}
            variant="solid"
            alignSelf="stretch"
            textAlign="center"
          >
            {pirep.valid === null ? 'Pending' : (pirep.valid === false ? 'Rejected' : 'Accepted')}
          </Badge>
        </VStack>
      </HStack>
    </Card.Root>
  );
};

export default PirepCard;
