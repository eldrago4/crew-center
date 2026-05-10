export const metadata = {
    title: 'Routes',
    description: 'Browse Indian Virtual\'s full route network on Infinite Flight. Explore domestic and international routes operated by our virtual pilots across India and the world.',
    keywords: ['Indian Virtual routes', 'Infinite Flight routes India', 'virtual airline route map', 'INVA route network', 'domestic international virtual routes'],
    openGraph: {
        title: 'Routes | Indian Virtual',
        description: 'Explore Indian Virtual\'s full domestic and international Infinite Flight route network.',
        url: 'https://indianvirtual.site/operations/routes',
    },
    alternates: { canonical: 'https://indianvirtual.site/operations/routes' },
}

import { Box, Flex, Grid, Heading, HStack, Text, VStack } from '@chakra-ui/react'
import { FaArrowTrendUp, FaGlobe, FaPlaneDeparture, FaRoute } from 'react-icons/fa6'

const BLUE = '#2b4bee'
const ORANGE = '#ff6b35'

const routeHighlights = [
    {
        icon: <FaPlaneDeparture />,
        label: 'Indian trunk routes',
        text: 'High-frequency metro sectors across Delhi, Mumbai, Bengaluru, Chennai, Hyderabad and Kolkata.',
    },
    {
        icon: <FaGlobe />,
        label: 'Long-haul reach',
        text: 'Widebody missions from India to Europe, North America, the Gulf and Southeast Asia.',
    },
    {
        icon: <FaArrowTrendUp />,
        label: 'Three airline identities',
        text: 'Air India scale, Air India Express energy and Vistara polish, all shaped for Infinite Flight operations.',
    },
]

export default function RoutesPage() {
    return (
        <Box position="relative" minH="100vh" bg="gray.50" color="gray.900">
            <Box position="fixed" inset={0} zIndex={-1} bgGradient="linear(to-br, white, blue.50, orange.50)" />

            <Box maxW="7xl" mx="auto" px={{ base: 4, lg: 8 }} py={{ base: 10, md: 16 }}>
                <Grid templateColumns={{ base: '1fr', lg: '0.9fr 1.1fr' }} gap={{ base: 8, lg: 12 }} alignItems="center">
                    <VStack align="start" gap={6}>
                        <HStack
                            display="inline-flex"
                            bg="white"
                            border="1px solid"
                            borderColor="blue.100"
                            px={4}
                            py={1.5}
                            rounded="full"
                            shadow="sm"
                            gap={2}
                        >
                            <Box color={BLUE}><FaRoute size="0.85rem" /></Box>
                            <Text color={BLUE} fontWeight="semibold" fontSize="sm">Route Network</Text>
                        </HStack>

                        <Box>
                            <Heading
                                as="h1"
                                fontSize={{ base: '4xl', md: '6xl' }}
                                fontWeight="black"
                                letterSpacing="tight"
                                lineHeight={1.02}
                                fontFamily="'Playfair Display', serif"
                                maxW="760px"
                            >
                                India, connected with real airline texture.
                            </Heading>
                            <Text mt={6} fontSize={{ base: 'md', md: 'lg' }} color="gray.600" lineHeight="relaxed" maxW="680px">
                                Indian Virtual gives pilots a network with range and personality: Air India flag-carrier long hauls, Air India Express city pairs built for quick turns, and Vistara-style premium sectors that make even a short domestic hop feel considered. Pick a familiar metro shuttle, stretch into a red-eye international rotation, or build a day around India&apos;s busiest hubs and coastal approaches.
                            </Text>
                        </Box>

                        <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)', lg: '1fr' }} gap={4} w="full">
                            {routeHighlights.map(({ icon, label, text }) => (
                                <Box key={label} bg="white" border="1px solid" borderColor="gray.100" rounded="lg" p={4} shadow="sm">
                                    <HStack gap={3} align="start">
                                        <Flex
                                            w="36px"
                                            h="36px"
                                            rounded="md"
                                            align="center"
                                            justify="center"
                                            bg="blue.50"
                                            color={BLUE}
                                            flexShrink={0}
                                        >
                                            {icon}
                                        </Flex>
                                        <Box>
                                            <Text fontWeight="bold" color="gray.800">{label}</Text>
                                            <Text mt={1} fontSize="sm" color="gray.500" lineHeight="1.6">{text}</Text>
                                        </Box>
                                    </HStack>
                                </Box>
                            ))}
                        </Grid>
                    </VStack>

                    <Box
                        bg="white"
                        border="1px solid"
                        borderColor="gray.200"
                        rounded="lg"
                        shadow="xl"
                        overflow="hidden"
                    >
                        <HStack justify="space-between" px={{ base: 4, md: 5 }} py={3} borderBottom="1px solid" borderColor="gray.100">
                            <Text fontSize="sm" fontWeight="bold" color="gray.700">Interactive route explorer</Text>
                            <HStack gap={2}>
                                <Box w={2} h={2} rounded="full" bg={ORANGE} />
                                <Box w={2} h={2} rounded="full" bg={BLUE} />
                            </HStack>
                        </HStack>
                        <Box h={{ base: '68vh', md: '720px', xl: '780px' }} minH={{ base: '560px', md: '640px' }}>
                            <iframe
                                src="https://1ved.cloud/api"
                                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                                title="Indian Virtual Routes"
                                allow="fullscreen"
                            />
                        </Box>
                    </Box>
                </Grid>

                <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4} mt={{ base: 10, md: 14 }}>
                    {[
                        ['Short sectors', 'Fly fast-turn AIX-style hops where planning, climb and descent discipline matter.'],
                        ['Domestic depth', "Move between India's metros, tier-two airports and scenic approaches without repeating the same rhythm."],
                        ['International legs', 'Use Air India and Vistara-inspired rotations to connect India with global gateways.'],
                    ].map(([title, body]) => (
                        <Box key={title} bg="whiteAlpha.900" border="1px solid" borderColor="gray.100" rounded="lg" p={5} shadow="sm">
                            <Text fontWeight="black" color="gray.800">{title}</Text>
                            <Text mt={2} fontSize="sm" color="gray.500" lineHeight="1.7">{body}</Text>
                        </Box>
                    ))}
                </Grid>
            </Box>
        </Box>
    )
}
