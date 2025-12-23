'use client';

import {
    Box,
    VStack,
    Text,
    Button,
    Flex,
    Icon,
    HStack,
    Grid,
    GridItem,
    Select,
    Portal,
    createListCollection,
} from '@chakra-ui/react';
import { Plane, Globe, Award } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { toaster } from '@/components/ui/toaster';

const fadeInKeyframes = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;

const baseAirportsData = [
    { label: "Indira Gandhi International Airport", value: "VIDP" },
    { label: "Chhatrapati Shivaji Maharaj International Airport", value: "VABB" },
    { label: "Kempegowda International Airport", value: "VOBL" },
    { label: "Cochin International Airport", value: "VOCI" },
    { label: "Rajiv Gandhi International Airport", value: "VOHY" },
    { label: "Netaji Subhas Chandra Bose International Airport", value: "VECC" },
    { label: "Chennai International Airport", value: "VOMM" },
    { label: "Pune Airport", value: "VAPO" },
    { label: "Sardar Vallabhbhai Patel International Airport", value: "VAAH" },
    { label: "Trivandrum International Airport", value: "VOTV" },
    { label: "Calicut International Airport", value: "VOCL" },
    { label: "Mangalore International Airport", value: "VOML" },
    { label: "Kannur International Airport", value: "VOKN" },
    { label: "Tiruchirappalli International Airport", value: "VOTR" }
];

const baseAirports = createListCollection({ items: baseAirportsData });

const typeRatingsData = [
    { label: "Airbus A320", value: "A320" },
    { label: "Boeing 737-800", value: "B738" }
];

const typeRatings = createListCollection({ items: typeRatingsData });

export default function CareerPage() {
    const [ showForm, setShowForm ] = useState(false);
    const [ showWalkthrough, setShowWalkthrough ] = useState(false);
    const [ selectedBaseAirport, setSelectedBaseAirport ] = useState('VIDP');
    const [ selectedTypeRating, setSelectedTypeRating ] = useState('A320');
    const [ isEnrolling, setIsEnrolling ] = useState(false);

    const { data: session } = useSession();

    const handleBeginJourney = () => {
        setShowForm(true);
    };

    const handleEnroll = async () => {
        if (!session?.user?.callsign) {
            toaster.create({
                title: "Authentication Error",
                description: "Please log in to continue",
                type: "error",
                duration: 5000,
            });
            return;
        }

        setIsEnrolling(true);

        try {
            const response = await fetch('/api/crewcareer/enroll', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    baseAirport: selectedBaseAirport,
                    typeRating: selectedTypeRating
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Enrollment failed');
            }

            if (result.alreadyEnrolled) {
                // User already enrolled, redirect to walkthrough
                setShowWalkthrough(true);
                toaster.create({
                    title: "Welcome back!",
                    description: "You've already enrolled. Proceeding to walkthrough.",
                    type: "info",
                    duration: 3000,
                });
            } else {
                // Success, redirect to walkthrough
                setShowWalkthrough(true);
                toaster.create({
                    title: "Enrollment Successful!",
                    description: "Welcome to your career journey!",
                    type: "success",
                    duration: 3000,
                });
            }
        } catch (error) {
            console.error('Enrollment error:', error);
            toaster.create({
                title: "Enrollment Failed",
                description: error.message || "An error occurred during enrollment",
                type: "error",
                duration: 5000,
            });
        } finally {
            setIsEnrolling(false);
        }
    };

    return (
        <>
            <style>{fadeInKeyframes}</style>
            <Box minH="100vh" bg="gray.900" color="white" position="relative" overflow="hidden">
                {/* Animated background elements */}
                <Box
                    position="absolute"
                    top="-25%"
                    left="-25%"
                    w="50vw"
                    h="50vw"
                    bg="blue.500"
                    opacity={0.1}
                    borderRadius="full"
                    filter="blur(64px)"
                    animation="spin 20s linear infinite reverse"
                />
                <Box
                    position="absolute"
                    bottom="-25%"
                    right="-25%"
                    w="50vw"
                    h="50vw"
                    bg="blue.500"
                    opacity={0.1}
                    borderRadius="full"
                    filter="blur(64px)"
                    animation="spin 20s linear infinite"
                />

                {/* Hero Section */}
                <Flex
                    minH="calc(100vh - 81px)"
                    align="center"
                    justify="center"
                    direction="column"
                    textAlign="center"
                    py={24}
                    px={4}
                    position="relative"
                    zIndex={1}
                    opacity={showForm ? 0 : 1}
                    transform={showForm ? "translateY(-20px)" : "translateY(0)"}
                    transition="all 0.5s ease-in-out"
                >
                    <VStack gap={10} maxW="4xl">
                        <Text
                            fontSize={{ base: "5xl", md: "7xl", lg: "9xl" }}
                            fontWeight="black"
                            letterSpacing="tighter"
                            lineHeight="1"
                        >
                            Your Career Awaits
                        </Text>
                        <Text
                            fontSize={{ base: "xl", md: "2xl" }}
                            fontWeight="light"
                            color="gray.300"
                            maxW="4xl"
                            lineHeight="relaxed"
                        >
                            From First Officer to Captain, your journey through the skies begins now. Unlock new aircraft, explore global routes, and build your legacy.
                        </Text>
                        <Button
                            size="lg"
                            bg="blue.500"
                            color="white"
                            fontSize="xl"
                            fontWeight="bold"
                            px={12}
                            py={8}
                            borderRadius="full"
                            shadow="lg"
                            _hover={{
                                shadow: "2xl",
                            }}
                            transition="all 0.3s ease-in-out"
                            onClick={handleBeginJourney}
                        >
                            Begin Your Journey
                        </Button>
                    </VStack>
                </Flex>

                {/* Features Section */}
                <Box
                    py={20}
                    bg="gray.900"
                    opacity={showForm ? 0 : 1}
                    transform={showForm ? "translateY(-20px)" : "translateY(0)"}
                    transition="all 0.5s ease-in-out"
                >
                    <Box maxW="6xl" mx="auto" px={4}>
                        <VStack gap={16}>
                            <VStack gap={6} textAlign="center">
                                <Text
                                    fontSize={{ base: "4xl", md: "5xl" }}
                                    fontWeight="bold"
                                    letterSpacing="tight"
                                >
                                    The Journey Ahead
                                </Text>
                                <Text
                                    fontSize="lg"
                                    color="gray.400"
                                    maxW="3xl"
                                >
                                    Embark on a dynamic career, complete flights across the globe, and climb the ranks to become an elite captain.
                                </Text>
                            </VStack>

                            <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={8}>
                                <GridItem>
                                    <VStack
                                        gap={6}
                                        p={8}
                                        bg="gray.800"
                                        borderRadius="2xl"
                                        textAlign="center"
                                        align="center"
                                        h="full"
                                        transition="transform 0.3s ease-in-out"
                                    >
                                        <Flex
                                            w={16}
                                            h={16}
                                            bg="transparent"
                                            border="2px solid"
                                            borderColor="blue.400"
                                            borderRadius="2xl"
                                            align="center"
                                            justify="center"
                                            position="relative"
                                            zIndex={10}
                                        >
                                            <Icon as={Plane} boxSize={10} color="blue.400" position="relative" zIndex={11} />
                                        </Flex>
                                        <VStack gap={2}>
                                            <Text fontSize="xl" fontWeight="bold">
                                                Progressive Fleet
                                            </Text>
                                            <Text fontSize="base" color="gray.400">
                                                Start with smaller aircraft and unlock a diverse fleet as you gain experience.
                                            </Text>
                                        </VStack>
                                    </VStack>
                                </GridItem>

                                <GridItem>
                                    <VStack
                                        gap={6}
                                        p={8}
                                        bg="gray.800"
                                        borderRadius="2xl"
                                        textAlign="center"
                                        align="center"
                                        h="full"
                                        transition="transform 0.3s ease-in-out"
                                    >
                                        <Flex
                                            w={16}
                                            h={16}
                                            bg="transparent"
                                            border="2px solid"
                                            borderColor="blue.400"
                                            borderRadius="2xl"
                                            align="center"
                                            justify="center"
                                            position="relative"
                                            zIndex={10}
                                        >
                                            <Icon as={Globe} boxSize={10} color="blue.400" position="relative" zIndex={11} />
                                        </Flex>
                                        <VStack gap={2}>
                                            <Text fontSize="xl" fontWeight="bold">
                                                Global Operations
                                            </Text>
                                            <Text fontSize="base" color="gray.400">
                                                Fly to hundreds of destinations with our comprehensive route network.
                                            </Text>
                                        </VStack>
                                    </VStack>
                                </GridItem>

                                <GridItem>
                                    <VStack
                                        gap={6}
                                        p={8}
                                        bg="gray.800"
                                        borderRadius="2xl"
                                        textAlign="center"
                                        align="center"
                                        h="full"
                                        transition="transform 0.3s ease-in-out"
                                    >
                                        <Flex
                                            w={16}
                                            h={16}
                                            bg="transparent"
                                            border="2px solid"
                                            borderColor="blue.400"
                                            borderRadius="2xl"
                                            align="center"
                                            justify="center"
                                            position="relative"
                                            zIndex={10}
                                        >
                                            <Icon as={Award} boxSize={10} color="blue.400" position="relative" zIndex={11} />
                                        </Flex>
                                        <VStack gap={2}>
                                            <Text fontSize="xl" fontWeight="bold">
                                                Achieve Ranks
                                            </Text>
                                            <Text fontSize="base" color="gray.400">
                                                Earn promotions and accolades based on your performance and flight hours.
                                            </Text>
                                        </VStack>
                                    </VStack>
                                </GridItem>
                            </Grid>
                        </VStack>
                    </Box>
                </Box>

                {/* Form Section */}
                {showForm && !showWalkthrough && (
                    <Flex
                        position="absolute"
                        top="0"
                        left="0"
                        right="0"
                        minH="calc(100vh - 81px)"
                        align="center"
                        justify="center"
                        direction="column"
                        py={24}
                        px={4}
                        zIndex={2}
                        opacity={0}
                        transform="translateY(0)"
                        transition="opacity 0.5s ease-in-out 0.5s"
                        style={{
                            animation: 'fadeIn 0.5s ease-in-out 0.5s forwards'
                        }}
                    >
                        <VStack gap={8} w="full" maxW="2xl">
                            <Box w="full">
                                <Box mb={2}>
                                    <Text color="gray.300" fontSize="lg">Base Airport</Text>
                                </Box>
                                <Select.Root
                                    collection={baseAirports}
                                    value={[ selectedBaseAirport ]}
                                    onValueChange={(e) => setSelectedBaseAirport(e.value[ 0 ])}
                                    size="lg"
                                    variant="outline"
                                    w="full"
                                >
                                    <Select.HiddenSelect />
                                    <Select.Control>
                                        <Select.Trigger
                                            bg="gray.800"
                                            borderColor="gray.600"
                                            borderRadius="full"
                                            color="white"
                                            h="16"
                                            px={6}
                                            fontSize="lg"
                                            _hover={{ borderColor: "blue.400" }}
                                            _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                                        >
                                            <Select.ValueText placeholder="Indira Gandhi International Airport" />
                                        </Select.Trigger>
                                        <Select.IndicatorGroup>
                                            <Select.Indicator />
                                        </Select.IndicatorGroup>
                                    </Select.Control>
                                    <Portal>
                                        <Select.Positioner>
                                            <Select.Content
                                                bg="gray.800"
                                                borderColor="gray.600"
                                                borderRadius="2xl"
                                                css={{
                                                    '& [data-highlighted]': {
                                                        bg: 'gray.700 !important',
                                                        color: 'white !important'
                                                    },
                                                    '&::-webkit-scrollbar': {
                                                        width: '4px',
                                                    },
                                                    '&::-webkit-scrollbar-track': {
                                                        background: 'transparent',
                                                    },
                                                    '&::-webkit-scrollbar-thumb': {
                                                        background: 'gray.500',
                                                        borderRadius: '2px',
                                                    },
                                                    '&::-webkit-scrollbar-thumb:hover': {
                                                        background: 'gray.400',
                                                    },
                                                }}
                                            >
                                                {baseAirports.items.map((airport) => (
                                                    <Select.Item
                                                        item={airport}
                                                        key={airport.value}
                                                        py={3}
                                                        px={4}
                                                        borderRadius="2xl"
                                                        fontSize="lg"
                                                        color="gray.300"
                                                    >
                                                        {airport.label}
                                                        <Select.ItemIndicator />
                                                    </Select.Item>
                                                ))}
                                            </Select.Content>
                                        </Select.Positioner>
                                    </Portal>
                                </Select.Root>
                            </Box>

                            <Box w="full">
                                <Box mb={2}>
                                    <Text color="gray.300" fontSize="lg">Type Rating</Text>
                                </Box>
                                <Select.Root
                                    collection={typeRatings}
                                    value={[ selectedTypeRating ]}
                                    onValueChange={(e) => setSelectedTypeRating(e.value[ 0 ])}
                                    size="lg"
                                    variant="outline"
                                    w="full"
                                >
                                    <Select.HiddenSelect />
                                    <Select.Control>
                                        <Select.Trigger
                                            bg="gray.800"
                                            borderColor="gray.600"
                                            borderRadius="full"
                                            color="white"
                                            h="16"
                                            px={6}
                                            fontSize="lg"
                                            _hover={{ borderColor: "blue.400" }}
                                            _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                                        >
                                            <Select.ValueText placeholder="Airbus A320" />
                                        </Select.Trigger>
                                        <Select.IndicatorGroup>
                                            <Select.Indicator />
                                        </Select.IndicatorGroup>
                                    </Select.Control>
                                    <Portal>
                                        <Select.Positioner>
                                            <Select.Content
                                                bg="gray.800"
                                                borderColor="gray.600"
                                                borderRadius="2xl"
                                                css={{
                                                    '& [data-highlighted]': {
                                                        bg: 'gray.700 !important',
                                                        color: 'white !important'
                                                    },
                                                    '&::-webkit-scrollbar': {
                                                        width: '4px',
                                                    },
                                                    '&::-webkit-scrollbar-track': {
                                                        background: 'transparent',
                                                    },
                                                    '&::-webkit-scrollbar-thumb': {
                                                        background: 'gray.500',
                                                        borderRadius: '2px',
                                                    },
                                                    '&::-webkit-scrollbar-thumb:hover': {
                                                        background: 'gray.400',
                                                    },
                                                }}
                                            >
                                                {typeRatings.items.map((rating) => (
                                                    <Select.Item
                                                        item={rating}
                                                        key={rating.value}
                                                        py={3}
                                                        px={4}
                                                        borderRadius="2xl"
                                                        fontSize="lg"
                                                        color="gray.300"
                                                    >
                                                        {rating.label}
                                                        <Select.ItemIndicator />
                                                    </Select.Item>
                                                ))}
                                            </Select.Content>
                                        </Select.Positioner>
                                    </Portal>
                                </Select.Root>
                            </Box>

                            <Button
                                size="lg"
                                bg="blue.500"
                                color="white"
                                fontSize="xl"
                                fontWeight="bold"
                                px={12}
                                py={8}
                                borderRadius="full"
                                shadow="lg"
                                _hover={{
                                    shadow: "2xl",
                                }}
                                transition="all 0.3s ease-in-out"
                                onClick={handleEnroll}
                                disabled={isEnrolling}
                            >
                                {isEnrolling ? 'Enrolling...' : 'Enroll'}
                            </Button>
                        </VStack>
                    </Flex>
                )}

                {/* Walkthrough Section */}
                {showWalkthrough && (
                    <Flex
                        position="absolute"
                        top="0"
                        left="0"
                        right="0"
                        minH="100vh"
                        align="center"
                        justify="center"
                        direction="column"
                        px={4}
                        zIndex={3}
                        opacity={0}
                        transform="translateY(0)"
                        transition="opacity 0.5s ease-in-out 0.5s"
                        style={{
                            animation: 'fadeIn 0.5s ease-in-out 0.5s forwards'
                        }}
                    >
                        <VStack gap={6} w="full" maxW="6xl">
                            <Text
                                fontSize={{ base: "xl", md: "2xl", lg: "3xl" }}
                                fontWeight="extralight"
                                color="gray.300"
                                textAlign="center"
                            >
                                Welcome aboard cadet! Here's a walkthrough...
                            </Text>

                            <Box
                                w="full"
                                maxW="5xl"
                                h="calc(80vh - 100px)"
                                minH="500px"
                                bg="gray.800"
                                borderRadius="3xl"
                                border="2px solid"
                                borderColor="gray.600"
                                mx="auto"
                                overflow="hidden"
                            >
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src="https://www.youtube.com/embed/qw1alO6nNmk"
                                    title="YouTube video player"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    style={{ borderRadius: '1.5rem' }}
                                ></iframe>
                            </Box>

                            <Link href="/crew/career/dashboard" style={{ textDecoration: 'none' }}>
                                <Button
                                    size="lg"
                                    bg="white"
                                    color="black"
                                    fontSize={{ base: "xl", md: "2xl" }}
                                    fontWeight="bold"
                                    px={{ base: 8, md: 12 }}
                                    py={6}
                                    borderRadius="3xl"
                                    shadow="lg"
                                    _hover={{
                                        shadow: "2xl",
                                        bg: "gray.100"
                                    }}
                                    transition="all 0.3s ease-in-out"
                                    display="flex"
                                    alignItems="center"
                                    gap={3}
                                >
                                    →
                                </Button>
                            </Link>
                        </VStack>
                    </Flex>
                )}
            </Box>
        </>
    );
}
