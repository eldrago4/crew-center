export const metadata = {
    title: 'About Us',
    description: 'Learn about Indian Virtual — India\'s premier Infinite Flight virtual airline. Discover our history, mission, fleet, and the community behind INVA.',
    keywords: ['about Indian Virtual', 'INVA history', 'Indian virtual airline community', 'Infinite Flight virtual airline India', 'virtual airline mission'],
    openGraph: {
        title: 'About Indian Virtual',
        description: 'Discover the story behind Indian Virtual — India\'s premier Infinite Flight virtual airline.',
        url: 'https://indianvirtual.site/info',
    },
    alternates: { canonical: 'https://indianvirtual.site/info' },
}

import { Box, Flex, Grid, Heading, Text, VStack, HStack } from '@chakra-ui/react'
import { FaPlane, FaGlobe, FaUsers } from 'react-icons/fa6'

const ORANGE = '#ff6b35'
const PRIMARY = '#2b4bee'

export default function InfoPage() {
    return (
        <Box position="relative" minH="100vh" fontFamily="Inter, sans-serif">
            {/* Background */}
            <Box position="fixed" inset={0} zIndex={-1}>
                <Box position="absolute" inset={0} bgGradient="linear(to-br, orange.50, white, blue.50)" />
            </Box>

            {/* ── Hero / Welcome ── */}
            <Box
                position="relative"
                overflow="hidden"
                borderBottom="1px solid"
                borderColor="orange.100"
            >
                {/* Decorative arcs */}
                <Box
                    position="absolute"
                    top="-120px" right="-120px"
                    w="420px" h="420px"
                    rounded="full"
                    border="1px solid"
                    borderColor="orange.200"
                    opacity={0.4}
                    pointerEvents="none"
                />
                <Box
                    position="absolute"
                    top="-60px" right="-60px"
                    w="280px" h="280px"
                    rounded="full"
                    border="1px solid"
                    borderColor="orange.300"
                    opacity={0.3}
                    pointerEvents="none"
                />

                <Box maxW="7xl" mx="auto" px={{ base: 4, lg: 8 }} py={{ base: 16, md: 24 }}>
                    {/* Pill */}
                    <HStack
                        display="inline-flex"
                        bg="whiteAlpha.800"
                        backdropFilter="blur(4px)"
                        border="1px solid"
                        borderColor="orange.200"
                        px={4} py={1.5}
                        rounded="full"
                        shadow="sm"
                        mb={8}
                        gap={2}
                    >
                        <Box color={ORANGE}><FaPlane size="0.8rem" /></Box>
                        <Text color={ORANGE} fontWeight="semibold" fontSize="sm">Indian Virtual Airlines</Text>
                    </HStack>

                    <Heading
                        as="h1"
                        fontSize={{ base: '4xl', md: '6xl' }}
                        fontWeight="black"
                        letterSpacing="tight"
                        fontFamily="'Playfair Display', serif"
                        lineHeight={1.1}
                        mb={8}
                        maxW="3xl"
                    >
                        Welcome to{' '}
                        <Box
                            as="span"
                            style={{
                                background: `linear-gradient(135deg, ${ORANGE} 0%, #f59e0b 100%)`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            Indian Virtual!
                        </Box>
                    </Heading>

                    <VStack align="start" gap={5} maxW="2xl">
                        <Text fontSize={{ base: 'md', md: 'lg' }} color="gray.600" lineHeight="relaxed">
                            Indian Virtual, the premier destination for virtual aviation enthusiasts in Infinite
                            Flight! We're delighted to have you join our growing family of passionate pilots,
                            whether you're an experienced aviator or just starting off in the virtual community!
                        </Text>
                        <Text fontSize={{ base: 'md', md: 'lg' }} color="gray.600" lineHeight="relaxed">
                            At Indian Virtual, we embody the spirit of Indian aviation. Offering a rich and
                            immersive experience that brings the skies of the world to your fingertips. With our
                            extensive fleet and one of the most diverse route networks in Infinite Flight, every
                            journey with us is an opportunity to explore new horizons and challenge your flying
                            skills.
                        </Text>
                        <Text fontSize={{ base: 'md', md: 'lg' }} color="gray.600" lineHeight="relaxed">
                            Prepare to embark on a thrilling adventure where every flight is a step closer to
                            mastering the art of virtual aviation. With Indian Virtual, the sky is not the
                            limit—it's just the beginning. So fasten your seatbelt, set your course, and let's
                            soar together with Indian Virtual!
                        </Text>
                    </VStack>

                    {/* CEO signature card */}
                    <Box
                        mt={10}
                        display="inline-flex"
                        alignItems="center"
                        gap={4}
                        bg="white"
                        border="1px solid"
                        borderColor="orange.100"
                        rounded="2xl"
                        px={5} py={4}
                        shadow="sm"
                    >
                        <Box
                            w="44px" h="44px"
                            rounded="full"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            fontSize="xl"
                            style={{ background: `linear-gradient(135deg, ${ORANGE} 0%, #f59e0b 100%)` }}
                            color="white"
                            fontWeight="black"
                            fontFamily="'Playfair Display', serif"
                        >
                            P
                        </Box>
                        <Box>
                            <Text fontWeight="bold" color="gray.800" fontSize="sm">Pritish</Text>
                            <Text fontSize="xs" color="gray.400" textTransform="uppercase" letterSpacing="widest">
                                Indian Virtual CEO
                            </Text>
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* ── About Us ── */}
            <Box maxW="7xl" mx="auto" px={{ base: 4, lg: 8 }} py={{ base: 16, md: 24 }}>

                {/* Section label */}
                <HStack gap={3} mb={10}>
                    <Box w="4px" h={7} rounded="full" style={{ background: `linear-gradient(to bottom, ${ORANGE}, #f59e0b)` }} />
                    <Heading
                        as="h2"
                        fontSize={{ base: '3xl', md: '4xl' }}
                        fontWeight="black"
                        letterSpacing="tight"
                        fontFamily="'Playfair Display', serif"
                        style={{
                            background: `linear-gradient(135deg, ${ORANGE} 0%, #f59e0b 100%)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        About Us
                    </Heading>
                </HStack>

                {/* About body + highlights */}
                <Grid templateColumns={{ base: '1fr', lg: '1fr 340px' }} gap={12} alignItems="start">
                    <VStack align="start" gap={6}>
                        <Text fontSize={{ base: 'md', md: 'lg' }} color="gray.600" lineHeight="relaxed">
                            Indian Virtual is your gateway to connecting India with the world like no other.
                            We offer virtual pilots the unique opportunity to explore the diverse landscapes of
                            the Indian subcontinent, from bustling cities to remote, unexplored regions.
                        </Text>
                        <Text fontSize={{ base: 'md', md: 'lg' }} color="gray.600" lineHeight="relaxed">
                            Our extensive route network lets you discover India's rich culture and breathtaking
                            scenery, all while enjoying an unmatched simulation experience. With Indian Virtual,
                            you'll navigate the skies and uncover the hidden gems of the subcontinent like no
                            other virtual airline!
                        </Text>
                    </VStack>

                    {/* Highlight tiles */}
                    <VStack gap={4} align="stretch">
                        {[
                            { icon: <FaPlane />, label: 'Diverse Fleet', desc: 'From regional jets to the iconic A380 — fly them all.' },
                            { icon: <FaGlobe />, label: 'Extensive Network', desc: 'One of the most diverse route networks in Infinite Flight.' },
                            { icon: <FaUsers />, label: 'Passionate Community', desc: 'A growing family of aviation enthusiasts across India and beyond.' },
                        ].map(({ icon, label, desc }) => (
                            <Box
                                key={label}
                                bg="white"
                                border="1px solid"
                                borderColor="gray.100"
                                rounded="xl"
                                p={4}
                                shadow="sm"
                            >
                                <HStack gap={3} mb={1}>
                                    <Box color={ORANGE} fontSize="sm">{icon}</Box>
                                    <Text fontWeight="bold" fontSize="sm" color="gray.800">{label}</Text>
                                </HStack>
                                <Text fontSize="xs" color="gray.500" pl="calc(1em + 12px)">{desc}</Text>
                            </Box>
                        ))}
                    </VStack>
                </Grid>
            </Box>
        </Box>
    )
}
