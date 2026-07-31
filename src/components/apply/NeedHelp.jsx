'use client';

import { Box, Heading, Text, Link, Icon, VStack, HStack } from '@chakra-ui/react';
import { FaDiscord } from 'react-icons/fa';
import { MdEmail, MdForum } from 'react-icons/md';

const IFC_MESSAGE_URL =
    'https://community.infiniteflight.com/new-message?username=indianvirtual&title=Issue%20with%20applying%20through%20website&body=Hi%2C%20I%20am%20having%20an%20issue%20applying%20through%20the%20website.%20Could%20you%20please%20help%3F';

const CHANNELS = [
    {
        key: 'discord',
        icon: FaDiscord,
        title: 'DM us on Discord',
        detail: 'Usually the fastest reply',
        href: 'https://discord.com/users/433143285847031838',
        accent: '#5865F2',
    },
    {
        key: 'email',
        icon: MdEmail,
        title: 'Email us',
        detail: 'dev@indianvirtual.com',
        href: 'mailto:dev@indianvirtual.com?subject=Issue%20with%20applying%20through%20website',
        accent: '#EA4335',
    },
    {
        key: 'ifc',
        icon: MdForum,
        title: 'Message us on the IFC',
        detail: 'Opens a pre-filled message to @indianvirtual',
        href: IFC_MESSAGE_URL,
        accent: '#F97316',
    },
];

export default function NeedHelp() {
    return (
        <Box
            bg="whiteAlpha.900"
            backdropFilter="blur(20px)"
            border="1px solid"
            borderColor="whiteAlpha.300"
            rounded="2xl"
            boxShadow="lg"
            p={{ base: '6', lg: '8' }}
        >
            <VStack gap="1" mb="5" textAlign="center">
                <Heading as="h3" fontSize="xl" fontWeight="bold" color="gray.800" fontFamily="Playfair Display, serif">
                    Feeling stuck?
                </Heading>
                <Text color="gray.600" fontSize="sm">
                    Shoot us a DM — a real person will walk you through it.
                </Text>
            </VStack>

            <Box display="grid" gridTemplateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap="3">
                {CHANNELS.map(({ key, icon, title, detail, href, accent }) => (
                    <Link
                        key={key}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        display="block"
                        bg="white"
                        border="1px solid"
                        borderColor="gray.200"
                        rounded="xl"
                        p="4"
                        textDecoration="none"
                        transition="border-color 0.2s, background-color 0.2s"
                        _hover={{ borderColor: accent, bg: 'gray.50' }}
                    >
                        <HStack gap="3" align="start">
                            <ChannelIcon accent={accent} icon={icon} />
                            <Box>
                                <Text fontWeight="semibold" color="gray.800" fontSize="sm">{title}</Text>
                                <Text color="gray.500" fontSize="xs" mt="0.5" wordBreak="break-word">{detail}</Text>
                            </Box>
                        </HStack>
                    </Link>
                ))}
            </Box>
        </Box>
    );
}

function ChannelIcon({ accent, icon }) {
    return (
        <Box
            flexShrink="0"
            w="9"
            h="9"
            rounded="lg"
            bg={`${accent}1A`}
            display="flex"
            alignItems="center"
            justifyContent="center"
        >
            <Icon as={icon} w="5" h="5" color={accent} />
        </Box>
    );
}
