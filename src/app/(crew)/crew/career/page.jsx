'use client';

import {
    Box,
    VStack,
    Text,
    Button,
    Flex,
    Icon,
    Grid,
    GridItem,
    Select,
    Portal,
    createListCollection,
} from '@chakra-ui/react';
import { Plane, Globe, Award } from 'lucide-react';
import { useState } from 'react';
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

// view: 'idle' | 'walkthrough' | 'form' | 'submitting' | 'pending'
export default function CareerPage() {
    const { data: session } = useSession();
    const [ view, setView ] = useState('idle');
    const [ selectedBaseAirport, setSelectedBaseAirport ] = useState('VIDP');
    const [ selectedTypeRating, setSelectedTypeRating ] = useState('A320');

    const handleSubmit = async () => {
        if (!session?.user?.callsign) {
            toaster.create({
                title: "Not authenticated",
                description: "Please sign in to continue.",
                type: "error",
                duration: 5000,
            });
            return;
        }

        setView('submitting');

        try {
            const response = await fetch('/api/crewcareer/enroll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    baseAirport: selectedBaseAirport,
                    typeRating: selectedTypeRating,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Request failed');
            }

            setView('pending');

        } catch (error) {
            console.error('Enroll error:', error);
            toaster.create({
                title: "Request Failed",
                description: error.message || "An error occurred. Please try again.",
                type: "error",
                duration: 5000,
            });
            setView('form');
        }
    };

    const isHeroVisible = view === 'idle';
    const isFormVisible = view === 'form' || view === 'submitting';

    return (
        <>
            <style>{fadeInKeyframes}</style>
            <Box minH="100vh" bg="gray.900" color="white" position="relative" overflow="hidden">
                {/* Background blobs */}
                <Box
                    position="absolute" top="-25%" left="-25%"
                    w="50vw" h="50vw" bg="blue.500" opacity={0.1}
                    borderRadius="full" filter="blur(64px)"
                    animation="spin 20s linear infinite reverse"
                />
                <Box
                    position="absolute" bottom="-25%" right="-25%"
                    w="50vw" h="50vw" bg="blue.500" opacity={0.1}
                    borderRadius="full" filter="blur(64px)"
                    animation="spin 20s linear infinite"
                />

                {/* ── Hero ── */}
                <Flex
                    minH="calc(100vh - 81px)"
                    align="center" justify="center" direction="column"
                    textAlign="center" py={24} px={4}
                    position="relative" zIndex={1}
                    opacity={isHeroVisible ? 1 : 0}
                    transform={isHeroVisible ? "translateY(0)" : "translateY(-20px)"}
                    transition="all 0.5s ease-in-out"
                    pointerEvents={isHeroVisible ? 'auto' : 'none'}
                >
                    <VStack gap={10} maxW="4xl">
                        <Text
                            fontSize={{ base: "5xl", md: "7xl", lg: "9xl" }}
                            fontWeight="black" letterSpacing="tighter" lineHeight="1"
                        >
                            Your Career Awaits
                        </Text>
                        <Text
                            fontSize={{ base: "xl", md: "2xl" }}
                            fontWeight="light" color="gray.300" maxW="4xl" lineHeight="relaxed"
                        >
                            From First Officer to Captain, your journey through the skies begins now.
                            Unlock new aircraft, explore global routes, and build your legacy.
                        </Text>
                        <Button
                            size="lg" bg="blue.500" color="white"
                            fontSize="xl" fontWeight="bold" px={12} py={8}
                            borderRadius="full" shadow="lg"
                            _hover={{ shadow: "2xl" }}
                            transition="all 0.3s ease-in-out"
                            onClick={() => setView('walkthrough')}
                        >
                            Begin Your Journey
                        </Button>
                    </VStack>
                </Flex>

                {/* ── Features ── */}
                <Box
                    py={20} bg="gray.900"
                    opacity={isHeroVisible ? 1 : 0}
                    transform={isHeroVisible ? "translateY(0)" : "translateY(-20px)"}
                    transition="all 0.5s ease-in-out"
                    pointerEvents={isHeroVisible ? 'auto' : 'none'}
                >
                    <Box maxW="6xl" mx="auto" px={4}>
                        <VStack gap={16}>
                            <VStack gap={6} textAlign="center">
                                <Text fontSize={{ base: "4xl", md: "5xl" }} fontWeight="bold" letterSpacing="tight">
                                    The Journey Ahead
                                </Text>
                                <Text fontSize="lg" color="gray.400" maxW="3xl">
                                    Embark on a dynamic career, complete flights across the globe, and climb the ranks to become an elite captain.
                                </Text>
                            </VStack>

                            <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={8}>
                                {[
                                    { icon: Plane, title: "Progressive Fleet", desc: "Start with smaller aircraft and unlock a diverse fleet as you gain experience." },
                                    { icon: Globe, title: "Global Operations", desc: "Fly to hundreds of destinations with our comprehensive route network." },
                                    { icon: Award, title: "Achieve Ranks", desc: "Earn promotions and accolades based on your performance and flight hours." },
                                ].map(({ icon, title, desc }) => (
                                    <GridItem key={title}>
                                        <VStack gap={6} p={8} bg="gray.800" borderRadius="2xl" textAlign="center" align="center" h="full">
                                            <Flex
                                                w={16} h={16} bg="transparent" border="2px solid" borderColor="blue.400"
                                                borderRadius="2xl" align="center" justify="center" position="relative" zIndex={10}
                                            >
                                                <Icon as={icon} boxSize={10} color="blue.400" position="relative" zIndex={11} />
                                            </Flex>
                                            <VStack gap={2}>
                                                <Text fontSize="xl" fontWeight="bold">{title}</Text>
                                                <Text fontSize="base" color="gray.400">{desc}</Text>
                                            </VStack>
                                        </VStack>
                                    </GridItem>
                                ))}
                            </Grid>
                        </VStack>
                    </Box>
                </Box>

                {/* ── Walkthrough ── */}
                {view === 'walkthrough' && (
                    <Flex
                        position="absolute" top="0" left="0" right="0"
                        minH="100vh"
                        align="center" justify="center" direction="column"
                        px={4} zIndex={2}
                        style={{ animation: 'fadeIn 0.5s ease-in-out forwards' }}
                    >
                        <VStack gap={6} w="full" maxW="6xl">
                            <Text
                                fontSize={{ base: "xl", md: "2xl", lg: "3xl" }}
                                fontWeight="extralight" color="gray.300" textAlign="center"
                            >
                                Welcome aboard cadet! Here's a walkthrough...
                            </Text>

                            <Box
                                w="full" maxW="5xl"
                                h="calc(80vh - 100px)" minH="500px"
                                bg="gray.800" borderRadius="3xl"
                                border="2px solid" borderColor="gray.600"
                                mx="auto" overflow="hidden"
                            >
                                <iframe
                                    width="100%" height="100%"
                                    src="https://www.youtube.com/embed/qw1alO6nNmk"
                                    title="Career Mode Walkthrough"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    style={{ borderRadius: '1.5rem' }}
                                />
                            </Box>

                            <Button
                                size="lg" bg="white" color="black"
                                fontSize={{ base: "xl", md: "2xl" }}
                                fontWeight="bold"
                                px={{ base: 8, md: 12 }} py={6}
                                borderRadius="3xl" shadow="lg"
                                _hover={{ shadow: "2xl", bg: "gray.100" }}
                                transition="all 0.3s ease-in-out"
                                onClick={() => setView('form')}
                            >
                                →
                            </Button>
                        </VStack>
                    </Flex>
                )}

                {/* ── Registration Form ── */}
                {isFormVisible && (
                    <Flex
                        position="absolute" top="0" left="0" right="0"
                        minH="calc(100vh - 81px)"
                        align="center" justify="center" direction="column"
                        py={24} px={4} zIndex={2}
                        style={{ animation: 'fadeIn 0.5s ease-in-out forwards' }}
                    >
                        <VStack gap={8} w="full" maxW="2xl">
                            <VStack gap={2} textAlign="center">
                                <Text fontSize={{ base: "3xl", md: "4xl" }} fontWeight="bold">
                                    Set Up Your Career
                                </Text>
                                <Text color="gray.400">
                                    Choose your home base and initial type rating. An admin will review your request.
                                </Text>
                            </VStack>

                            <Box w="full">
                                <Box mb={2}><Text color="gray.300" fontSize="lg">Base Airport</Text></Box>
                                <Select.Root
                                    collection={baseAirports}
                                    value={[ selectedBaseAirport ]}
                                    onValueChange={(e) => setSelectedBaseAirport(e.value[ 0 ])}
                                    size="lg" variant="outline" w="full"
                                >
                                    <Select.HiddenSelect />
                                    <Select.Control>
                                        <Select.Trigger
                                            bg="gray.800" borderColor="gray.600" borderRadius="full"
                                            color="white" h="16" px={6} fontSize="lg"
                                            _hover={{ borderColor: "blue.400" }}
                                            _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                                        >
                                            <Select.ValueText placeholder="Indira Gandhi International Airport" />
                                        </Select.Trigger>
                                        <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                                    </Select.Control>
                                    <Portal>
                                        <Select.Positioner>
                                            <Select.Content bg="gray.800" borderColor="gray.600" borderRadius="2xl"
                                                css={{
                                                    '& [data-highlighted]': { bg: 'gray.700 !important', color: 'white !important' },
                                                    '&::-webkit-scrollbar': { width: '4px' },
                                                    '&::-webkit-scrollbar-track': { background: 'transparent' },
                                                    '&::-webkit-scrollbar-thumb': { background: 'gray.500', borderRadius: '2px' },
                                                    '&::-webkit-scrollbar-thumb:hover': { background: 'gray.400' },
                                                }}
                                            >
                                                {baseAirports.items.map((airport) => (
                                                    <Select.Item item={airport} key={airport.value} py={3} px={4} borderRadius="2xl" fontSize="lg" color="gray.300">
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
                                <Box mb={2}><Text color="gray.300" fontSize="lg">Type Rating</Text></Box>
                                <Select.Root
                                    collection={typeRatings}
                                    value={[ selectedTypeRating ]}
                                    onValueChange={(e) => setSelectedTypeRating(e.value[ 0 ])}
                                    size="lg" variant="outline" w="full"
                                >
                                    <Select.HiddenSelect />
                                    <Select.Control>
                                        <Select.Trigger
                                            bg="gray.800" borderColor="gray.600" borderRadius="full"
                                            color="white" h="16" px={6} fontSize="lg"
                                            _hover={{ borderColor: "blue.400" }}
                                            _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                                        >
                                            <Select.ValueText placeholder="Airbus A320" />
                                        </Select.Trigger>
                                        <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                                    </Select.Control>
                                    <Portal>
                                        <Select.Positioner>
                                            <Select.Content bg="gray.800" borderColor="gray.600" borderRadius="2xl"
                                                css={{
                                                    '& [data-highlighted]': { bg: 'gray.700 !important', color: 'white !important' },
                                                    '&::-webkit-scrollbar': { width: '4px' },
                                                    '&::-webkit-scrollbar-track': { background: 'transparent' },
                                                    '&::-webkit-scrollbar-thumb': { background: 'gray.500', borderRadius: '2px' },
                                                    '&::-webkit-scrollbar-thumb:hover': { background: 'gray.400' },
                                                }}
                                            >
                                                {typeRatings.items.map((rating) => (
                                                    <Select.Item item={rating} key={rating.value} py={3} px={4} borderRadius="2xl" fontSize="lg" color="gray.300">
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
                                size="lg" bg="blue.500" color="white"
                                fontSize="xl" fontWeight="bold" px={12} py={8}
                                borderRadius="full" shadow="lg"
                                _hover={{ shadow: "2xl" }}
                                transition="all 0.3s ease-in-out"
                                onClick={handleSubmit}
                                disabled={view === 'submitting'}
                            >
                                {view === 'submitting' ? 'Submitting...' : 'Submit Request'}
                            </Button>
                        </VStack>
                    </Flex>
                )}

                {/* ── Pending Approval ── */}
                {view === 'pending' && (
                    <Flex
                        position="absolute" top="0" left="0" right="0"
                        minH="100vh"
                        align="center" justify="center" direction="column"
                        px={4} zIndex={3}
                        style={{ animation: 'fadeIn 0.5s ease-in-out forwards' }}
                    >
                        <VStack gap={6} maxW="xl" textAlign="center">
                            <Text fontSize="5xl">✈️</Text>
                            <Text fontSize={{ base: "3xl", md: "4xl" }} fontWeight="bold">
                                Request Submitted
                            </Text>
                            <Text fontSize="lg" color="gray.400" lineHeight="relaxed">
                                Your career enrollment request has been sent to our team.
                                You'll get access once an admin approves it — come back here
                                after approval and you'll be redirected automatically.
                            </Text>
                        </VStack>
                    </Flex>
                )}
            </Box>
        </>
    );
}
