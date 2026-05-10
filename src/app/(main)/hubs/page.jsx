export const metadata = {
    title: 'Hubs',
    description: 'Explore Indian Virtual hubs across India, from Delhi and Mumbai to Bengaluru, Chennai, Hyderabad and Kolkata. Discover the operational character behind each gateway.',
    keywords: ['Indian Virtual hubs', 'Air India hubs Infinite Flight', 'Indian virtual airline airports', 'INVA bases', 'India flight simulation hubs'],
    openGraph: {
        title: 'Hubs | Indian Virtual',
        description: 'Discover the Indian Virtual hub network and the airport gateways that shape our operations.',
        url: 'https://indianvirtual.site/hubs',
    },
    alternates: { canonical: 'https://indianvirtual.site/hubs' },
}

import { Box, Flex, Grid, Heading, HStack, Text, VStack } from '@chakra-ui/react'
import { FaBuildingFlag, FaCompass, FaPlane, FaTowerObservation } from 'react-icons/fa6'

const ORANGE = '#ff6b35'
const BLUE = '#2b4bee'

const hubs = [
    {
        code: 'VIDP',
        city: 'Delhi',
        role: 'Flagship northern gateway',
        copy: 'The natural launch point for long-haul Air India rotations, dense domestic banks and serious widebody flying.',
    },
    {
        code: 'VABB',
        city: 'Mumbai',
        role: 'West coast powerhouse',
        copy: 'A high-energy mix of business routes, Gulf links and coastal departures that rewards precise planning.',
    },
    {
        code: 'VOBL',
        city: 'Bengaluru',
        role: 'Southern technology corridor',
        copy: "Smart domestic connectivity, international growth and modern operations built around India's aviation future.",
    },
    {
        code: 'VOMM',
        city: 'Chennai',
        role: 'Bay of Bengal connector',
        copy: 'A strong southern base for Southeast Asia sectors, regional flying and coastal approaches with character.',
    },
    {
        code: 'VOHS',
        city: 'Hyderabad',
        role: 'Central network balancer',
        copy: 'An efficient midpoint for domestic pairings, quick turns and balanced east-west routing across India.',
    },
    {
        code: 'VECC',
        city: 'Kolkata',
        role: 'Eastern gateway',
        copy: 'The bridge toward Northeast India, Bangladesh, Southeast Asia and richly varied regional operations.',
    },
]

const principles = [
    ['Banked movement', 'Routes are arranged to feel like airline waves, not random point-to-point flying.'],
    ['Aircraft variety', 'A320 family sectors, 787 missions, 777 flagships and express-style narrowbody runs all have a place.'],
    ['Local flavor', 'Each hub has its own geography, traffic pattern and operational mood, so the network stays fresh.'],
]

export default function HubsPage() {
    return (
        <Box position="relative" minH="100vh" bg="gray.50" color="gray.900">
            <Box position="fixed" inset={0} zIndex={-1} bgGradient="linear(to-br, white, orange.50, blue.50)" />

            <Box maxW="7xl" mx="auto" px={{ base: 4, lg: 8 }} py={{ base: 10, md: 16 }}>
                <Grid templateColumns={{ base: '1fr', lg: '0.95fr 1.05fr' }} gap={{ base: 8, lg: 12 }} alignItems="center">
                    <VStack align="start" gap={6}>
                        <HStack
                            display="inline-flex"
                            bg="white"
                            border="1px solid"
                            borderColor="orange.100"
                            px={4}
                            py={1.5}
                            rounded="full"
                            shadow="sm"
                            gap={2}
                        >
                            <Box color={ORANGE}><FaTowerObservation size="0.9rem" /></Box>
                            <Text color={ORANGE} fontWeight="semibold" fontSize="sm">Hub Network</Text>
                        </HStack>

                        <Box>
                            <Heading
                                as="h1"
                                fontSize={{ base: '4xl', md: '6xl' }}
                                fontWeight="black"
                                letterSpacing="tight"
                                lineHeight={1.02}
                                fontFamily="'Playfair Display', serif"
                                maxW="780px"
                            >
                                The airports that give the network its rhythm.
                            </Heading>
                            <Text mt={6} fontSize={{ base: 'md', md: 'lg' }} color="gray.600" lineHeight="relaxed" maxW="700px">
                                Indian Virtual&apos;s hubs are more than dots on a map. They are the places where the airline personality comes alive: Delhi for ambitious flag-carrier departures, Mumbai for dense westbound traffic, Bengaluru and Hyderabad for modern domestic flow, Chennai for southern reach, and Kolkata for the eastern edge of the network. Together, they make every roster feel varied, believable and worth flying.
                            </Text>
                        </Box>
                    </VStack>

                    <Box bg="white" border="1px solid" borderColor="gray.100" rounded="lg" p={{ base: 4, md: 6 }} shadow="xl">
                        <Grid templateColumns="repeat(2, 1fr)" gap={3}>
                            {hubs.slice(0, 4).map((hub, index) => (
                                <Box
                                    key={hub.code}
                                    minH={{ base: '116px', md: '142px' }}
                                    rounded="md"
                                    p={4}
                                    bg={index === 0 ? 'blue.50' : index === 1 ? 'orange.50' : 'gray.50'}
                                    border="1px solid"
                                    borderColor={index === 0 ? 'blue.100' : index === 1 ? 'orange.100' : 'gray.100'}
                                >
                                    <Text fontSize="xs" fontWeight="black" color={index === 1 ? ORANGE : BLUE}>{hub.code}</Text>
                                    <Text mt={2} fontSize={{ base: 'lg', md: '2xl' }} fontWeight="black" color="gray.800">{hub.city}</Text>
                                    <Text mt={1} fontSize="xs" color="gray.500" lineHeight="1.5">{hub.role}</Text>
                                </Box>
                            ))}
                        </Grid>
                    </Box>
                </Grid>

                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }} gap={5} mt={{ base: 10, md: 14 }}>
                    {hubs.map((hub) => (
                        <Box key={hub.code} bg="white" border="1px solid" borderColor="gray.100" rounded="lg" p={5} shadow="sm">
                            <HStack justify="space-between" align="start" mb={4}>
                                <Box>
                                    <Text fontSize="xs" fontWeight="black" color={BLUE} letterSpacing="widest">{hub.code}</Text>
                                    <Heading as="h2" mt={1} fontSize="2xl" fontWeight="black" color="gray.800">{hub.city}</Heading>
                                </Box>
                                <Flex w="40px" h="40px" rounded="md" align="center" justify="center" bg="orange.50" color={ORANGE}>
                                    <FaPlane />
                                </Flex>
                            </HStack>
                            <Text fontWeight="bold" color="gray.700">{hub.role}</Text>
                            <Text mt={2} fontSize="sm" color="gray.500" lineHeight="1.7">{hub.copy}</Text>
                        </Box>
                    ))}
                </Grid>

                <Box mt={{ base: 10, md: 14 }} bg="white" border="1px solid" borderColor="gray.100" rounded="lg" p={{ base: 5, md: 7 }} shadow="sm">
                    <HStack gap={3} mb={6}>
                        <Flex w="40px" h="40px" rounded="md" align="center" justify="center" bg="blue.50" color={BLUE}>
                            <FaCompass />
                        </Flex>
                        <Box>
                            <Text fontSize="xs" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="widest">How to fly the hubs</Text>
                            <Heading as="h2" fontSize={{ base: '2xl', md: '3xl' }} fontWeight="black" color="gray.800">Build a rotation, not just a sector.</Heading>
                        </Box>
                    </HStack>
                    <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
                        {principles.map(([title, body]) => (
                            <Box key={title} bg="gray.50" border="1px solid" borderColor="gray.100" rounded="md" p={4}>
                                <HStack gap={2} mb={2}>
                                    <Box color={ORANGE}><FaBuildingFlag size="0.9rem" /></Box>
                                    <Text fontWeight="black" color="gray.800">{title}</Text>
                                </HStack>
                                <Text fontSize="sm" color="gray.500" lineHeight="1.7">{body}</Text>
                            </Box>
                        ))}
                    </Grid>
                </Box>
            </Box>
        </Box>
    )
}
