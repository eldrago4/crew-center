"use client";
import React, { useState, useEffect, useRef } from "react";
import Navbar, { MobileNavMenu } from "@/components/NavBar";
import {
    AspectRatio,
    Box,
    Button,
    Card,
    Flex,
    Grid,
    GridItem,
    HStack,
    Heading,
    Link,
    SimpleGrid,
    Text,
    VStack,
} from '@chakra-ui/react';
import NextImage from 'next/image';
import Typed from "typed.js";
import { FaGlobe, FaUsers, FaDiscord, FaClipboardList, FaCalendarWeek, FaClock, FaChartBar, FaUserGroup, FaArrowRight } from "react-icons/fa6";
import CountUp from 'react-countup';

const stats = [
    { count: 2400, label: 'Global Routes', icon: <FaGlobe size="3rem" />, colorPalette: 'blue', gradient: 'linear-gradient(to right, #3182CE, #4299E1)' },
    { count: 147, label: 'Active Pilots', icon: <FaUsers size="3rem" />, colorPalette: 'green', gradient: 'linear-gradient(to right, #38A169, #48BB78)' },
    { count: 160, label: 'Discord Members', icon: <FaDiscord size="3rem" />, colorPalette: 'purple', gradient: 'linear-gradient(to right, #805AD5, #9F7AEA)' },
    { count: 8436, label: 'PIREPs Filed', icon: <FaClipboardList size="3rem" />, colorPalette: 'orange', gradient: 'linear-gradient(to right, #DD6B20, #ED8936)' },
    { count: 318, label: 'Weekly PIREPs', icon: <FaCalendarWeek size="3rem" />, colorPalette: 'yellow', gradient: 'linear-gradient(to right, #D69E2E, #F6E05E)' },
    { count: 80075, label: 'Hours Flown', icon: <FaClock size="3rem" />, colorPalette: 'indigo', gradient: 'linear-gradient(to right, #5A67D8, #7F9CF5)' },
];

const helloLanguages = [
    "नमस्ते", "Welcome", "নমস্কার", "নমস্কাৰ", "ᱵᱟᱝᱜᱟ", "नमस्कार", "નમસ્તે",
    "ನಮಸ್ಕಾರ", "السلام علیکم", "നമസ്കാരം", "নমস্কার", "नमस्कार", "ନମସ୍କାର",
    "ਸਤ ਸ੍ਰੀ ਅਕਾਲ", "स्वागतम्", "السلام علیکم", "வணக்கம்", "నమస్తే", "السلام علیکم"
];

export default function TestPage() {
    const typedEl = useRef(null);
    const typedInstance = useRef(null);
    const [ isVisible, setIsVisible ] = useState(false);

    useEffect(() => {
        setIsVisible(true);

        typedInstance.current = new Typed(typedEl.current, {
            strings: helloLanguages,
            typeSpeed: 100,
            backSpeed: 40,
            backDelay: 1200,
            loop: true,
            showCursor: true,
        });

        return () => {
            if (typedInstance.current) {
                typedInstance.current.destroy();
            }
        };
    }, []);

    return (
        <>
            <Navbar />
            <MobileNavMenu />

            <Box position="relative" fontFamily="sans-serif" overflowX="hidden">
                <Box position="fixed" inset={0} zIndex={-1}>
                    <Box position="absolute" inset={0} bgGradient="linear(to-br, orange.50, white, green.50)" />
                    <Box
                        position="absolute"
                        inset={0}
                        opacity={0.3}
                        bgImage="url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ff6b35\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M30 30c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20zm0 0c0 11.046 8.954 20 20 20s20-8.954 20-20-8.954-20-20-20-20 8.954-20 20z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"
                    />
                    <Box position="absolute" inset={0} bgGradient="linear(to-t, whiteAlpha.800, transparent, whiteAlpha.600)" />
                </Box>

                <Box as="main" w="full">
                    <Flex as="section" w="full" minH="100vh" align="center" justify="center" px={{ base: 4, lg: 8 }} position="relative">
                        <Box position="absolute" inset={0} zIndex={-1}>
                            <Box position="absolute" inset={0} zIndex={-1}>
                                <NextImage
                                    src="/invaHomeBg.png"
                                    alt="Home Background"
                                    fill
                                    style={{ objectFit: 'cover', objectPosition: 'center' }}
                                    priority
                                />
                            </Box>
                            <Box position="absolute" inset={0} bgGradient="to-br" gradientFrom="orange.900" gradientTo="transparent" gradientVia="green.900" opacity={0.05} />
                            <Box position="absolute" inset={0} bgGradient="to-t" gradientFrom="whiteAlpha.500" gradientTo="whiteAlpha.200" gradientVia="whiteAlpha.400" />
                        </Box>
                        <VStack
                            spacing={8}
                            maxW="6xl"
                            mx="auto"
                            bg="whiteAlpha.600"
                            backdropFilter="blur(24px)"
                            p={{ base: 8, lg: 16 }}
                            pb={{ base: 3, lg: 12 }}
                            rounded="3xl"
                            shadow="2xl"
                            border="1px solid"
                            borderColor="whiteAlpha.500"
                            transition="all 0.7s"
                            opacity={isVisible ? 1 : 0}
                            transform={isVisible ? 'translateY(0)' : 'translateY(2rem)'}
                        >
                            <Box>
                                <Text
                                    fontSize={{ base: "2xl", md: "3xl" }}
                                    fontWeight="bold"
                                    bgGradient="linear-gradient(170deg,rgba(253, 73, 7, 1) 37%, rgba(0, 0, 0, 1) 100%)"
                                    bgClip="text"
                                    position="relative"
                                    zIndex={2}
                                    whiteSpace="nowrap"
                                >
                                    <span ref={typedEl} />
                                </Text>
                            </Box>

                            <Heading
                                as="h1"
                                mb="7"
                                fontSize={{ base: "5xl", md: "7xl" }}
                                fontWeight="extrabold"
                                fontFamily="Inter"
                                lineHeight="1.1"
                                position="relative"
                                bgGradient="linear-gradient(180deg,rgba(28, 28, 28, 1) 34%, rgba(25, 67, 99, 1) 82%, rgba(25, 74, 112, 1) 100%, rgba(43, 58, 74, 1) 100%)"
                                bgClip="text"
                                zIndex={1}
                            >
                                Indian Virtual
                                <Box
                                    as="span"
                                    position="absolute"
                                    right={0}
                                    bottom={{ base: "-7px", md: "-7px" }}
                                    display="flex"
                                    alignItems="flex-end"
                                    zIndex={2}
                                    gap={2}
                                >
                                    <NextImage
                                        src="/sa-member.svg"
                                        alt="SA Member"
                                        width={110} height={30}
                                    />
                                    <Box position="relative" right="10px" >
                                        <NextImage
                                            src="/sa-logo.svg"
                                            alt="SA Logo"
                                            width={20} height={20}
                                        />
                                    </Box>
                                </Box>
                            </Heading>

                            <Text maxW="4xl" mx="auto" fontSize={{ base: 'xs', lg: 'md' }} textAlign="center" lineHeight="relaxed" color="gray.700" fontWeight="medium" fontFamily="'Inter', sans-serif">
                                Timeless culture. Boundless skies.{/* <Text as="span" fontWeight="bold" color="#ff6b35">भारत</Text>  */}
                            </Text>

                            <Flex direction={{ base: 'column', sm: 'row' }} gap={4} justify="center">
                                <Button as={Link} size={{ base: '2xs', md: 'lg' }} href="/apply" bgGradient="to-r" gradientFrom="#ff6b35" gradientTo="#f7931e" color="white" px={8} py={4} h="auto" rounded="2xl" fontWeight="bold" _hover={{ shadow: '2xl', transform: 'scale(1.05)', textDecoration: 'none' }} transition="all 0.3s" rightIcon={<Text as="span" transition="transform 0.3s" _groupHover={{ transform: 'translateX(4px)' }}><FaArrowRight /></Text>} role="group">
                                    <Text mr={2}><FaUserGroup /></Text> Join Our Crew
                                </Button>
                                <Button as={Link} size={{ base: '2xs', md: 'lg' }} href="/operations/routes" bg="whiteAlpha.900" color="gray.800" px={8} py={4} h="auto" rounded="2xl" fontWeight="bold" _hover={{ bg: 'white', shadow: 'xl', transform: 'scale(1.05)', textDecoration: 'none' }} transition="all 0.3s" border="1px solid" borderColor="gray.200" rightIcon={<Text as="span" transition="transform 0.3s" _groupHover={{ transform: 'translateX(4px)' }}><FaArrowRight /></Text>} role="group">
                                    <Text mr={2}><FaGlobe /></Text> Explore Routes
                                </Button>
                            </Flex>
                        </VStack>
                    </Flex>

                    <Box as="section" py={24} px={{ base: 4, lg: 8 }} w="full" position="relative">
                        <Box position="absolute" inset={0} sx={{ bg: 'linear-gradient(to bottom right, rgba(255, 247, 237, 0.8), rgba(255, 255, 255, 0.9), rgba(240, 255, 244, 0.8))' }} backdropFilter="blur(4px)" />
                        <VStack position="relative" zIndex={1} maxW="7xl" mx="auto" spacing={{ base: 16, lg: 20 }}>
                            <Box textAlign="center">
                                <HStack
                                    display="inline-flex"
                                    bg="whiteAlpha.800"
                                    backdropFilter="blur(4px)"
                                    px={4} // Reduced from 6
                                    py={2} // Reduced from 3
                                    rounded="full"
                                    shadow="md" // Reduced from "lg" for a subtler effect
                                    mb={6}
                                >
                                    <Box color="#ff6b35">
                                        <FaChartBar size="1rem" /> {/* Reduced from 1.5rem */}
                                    </Box>
                                    <Text color="#ff6b35" fontWeight="semibold" fontSize="md"> {/* Reduced from "lg" */}
                                        Our Achievements
                                    </Text>
                                </HStack>
                                <Heading as="h2" fontSize={{ base: '4xl', lg: '6xl' }} fontWeight="black" letterSpacing="tight" mb={4} fontFamily="'Playfair Display', serif" sx={{ background: 'linear-gradient(to right, #ff6b35, #f7931e, #138808)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    Excellence in Numbers
                                </Heading>
                                <Text color="gray.600" fontSize={{ base: 'lg', lg: 'xl' }} maxW="2xl" mx="auto" lineHeight="relaxed" fontFamily="'Inter', sans-serif">
                                    Where legacy meets precision — every statistic tells the story of our journey through the virtual skies.
                                </Text>
                            </Box>
                            <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={10} w="full">
                                {stats.map((stat, idx) => (
                                    <Card.Root
                                        key={idx}
                                        size="xs"
                                        maxW="4/5"
                                        maxH="90%"
                                        backdropFilter="blur(4px)"
                                        rounded="2xl"
                                        shadow="md"
                                        _hover={{ shadow: 'xl', transform: 'scale(1.02)' }}
                                        border="1px solid"
                                        borderColor="whiteAlpha.700"
                                        transition="all 0.3s ease-in-out"
                                        opacity={isVisible ? 1 : 0}
                                        transform={isVisible ? 'translateY(0)' : 'translateY(20px)'}
                                        transitionDelay={`${idx * 0.1}s`}
                                        role="group"
                                        overflow="hidden"
                                    >
                                        <Card.Body>
                                            <VStack spacing={3} p={3}>
                                                <Box color={`${stat.colorPalette}.500`} transition="transform 0.3s" _groupHover={{ transform: 'scale(1.05)' }}>{React.cloneElement(stat.icon, { size: "2.5rem" })}</Box>
                                                <Card.Title as="h3" fontSize={{ base: '4xl', lg: '5xl' }} fontWeight="black" sx={{ background: stat.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                                    <CountUp end={stat.count} duration={2.5} separator="," delay={idx * 0.2} />
                                                    <Text as="span" fontSize="2xl">+</Text>
                                                </Card.Title>
                                                <Card.Description color="gray.700" fontSize="md" fontWeight="semibold" fontFamily="'Inter', sans-serif">{stat.label}</Card.Description>
                                                <Box w={12} h={1} sx={{ background: stat.gradient }} mx="auto" mt={2} rounded="full" transition="width 0.3s" _groupHover={{ w: 16 }} />
                                            </VStack>
                                        </Card.Body>
                                    </Card.Root>
                                ))}
                            </SimpleGrid>
                            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} maxW="4xl" mx="auto" w="full">
                                <VStack maxW="90%" maxH="90%" bg="whiteAlpha.600" backdropFilter="blur(4px)" p={6} rounded="2xl" shadow="lg" border="1px solid" borderColor="whiteAlpha.700">
                                    <Text fontSize="3xl">🏆</Text>
                                    <Heading size="md" color="#ff6b35">Inclusive Community</Heading>
                                    <Text color="gray.600">Pilots from over 20 countries</Text>
                                </VStack>
                                <VStack maxW="90%" maxH="90%" bg="whiteAlpha.600" backdropFilter="blur(4px)" p={6} rounded="2xl" shadow="lg" border="1px solid" borderColor="whiteAlpha.700">
                                    <Text fontSize="3xl">🇮🇳</Text>
                                    <Heading size="md" color="#138808">Indian Heritage</Heading>
                                    <Text color="gray.600">Proudly Representing India</Text>
                                </VStack>
                                <VStack maxW="90%" maxH="90%" bg="whiteAlpha.600" backdropFilter="blur(4px)" p={6} rounded="2xl" shadow="lg" border="1px solid" borderColor="whiteAlpha.700">
                                    <Text fontSize="3xl">✈️</Text>
                                    <Heading size="md" color="#f7931e">Global Network</Heading>
                                    <Text color="gray.600">Connecting Continents</Text>
                                </VStack>
                            </SimpleGrid>
                        </VStack>
                    </Box>

                    <Box as="section" py={24} px={{ base: 4, lg: 8 }} w="full">
                        <VStack maxW="6xl" mx="auto" spacing={12}>
                            <Box textAlign="center">
                                <HStack display="inline-flex" bg="whiteAlpha.800" backdropFilter="blur(4px)" px={4} py={2} rounded="full" shadow="md" mb={6}>
                                    <Text fontSize="lg">🎬</Text>
                                    <Text color="#ff6b35" fontWeight="semibold" fontSize="md">Experience Our Journey</Text>
                                </HStack>
                                <Heading as="h2" fontSize={{ base: '4xl', lg: '5xl' }} fontWeight="black" letterSpacing="tight" mb={4} fontFamily="'Playfair Display', serif" sx={{ background: 'linear-gradient(to right, #ff6b35, #f7931e, #138808)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    Virtual Skies Await
                                </Heading>
                            </Box>
                            <Box position="relative" w="full" role="group">
                                <Box position="absolute" inset={-4} sx={{ bg: 'linear-gradient(to right, #ff6b35, #f7931e, #138808)' }} rounded="3xl" filter="blur(24px)" opacity={0.3} _groupHover={{ opacity: 0.5 }} transition="opacity 0.5s" />
                                <AspectRatio ratio={16 / 9} w="full" rounded="3xl" overflow="hidden" shadow="2xl" border="4px solid" borderColor="whiteAlpha.700" backdropFilter="blur(4px)">
                                    <iframe
                                        src="https://www.youtube.com/embed/qw1alO6nNmk?si=fcGJ8hyY9Z8_ZKYd&controls=1&modestbranding=1&rel=0"
                                        title="Indian Virtual Airlines - From the heart of भारत to the world"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        referrerPolicy="strict-origin-when-cross-origin"
                                        allowFullScreen
                                    ></iframe>
                                </AspectRatio>
                            </Box>
                        </VStack>
                    </Box>

                    <Box as="footer" position="relative" mt={24} w="full">
                        <Box position="absolute" inset={0} bg="linear-gradient(to bottom right, #1A202C, #2D3748, #1A202C)" />
                        <Box position="relative" zIndex={1} px={{ base: 4, lg: 8 }} py={16} color="white">
                            <Box maxW="7xl" mx="auto">
                                <Grid templateColumns={{ base: '1fr', lg: 'repeat(4, 1fr)' }} gap={12} mb={12}>
                                    <GridItem colSpan={{ base: 1, lg: 2 }}>
                                        <VStack align="start" spacing={6}>
                                            <HStack spacing={4}>
                                                <Box bg="whiteAlpha.100" backdropFilter="blur(4px)" rounded="full" p={3}>
                                                    <NextImage src="/invaLogo.svg" width={60} height={60} alt="Logo" style={{ borderRadius: '9999px' }} />
                                                </Box>
                                                <Box>
                                                    <Heading size="lg" fontFamily="'Playfair Display', serif">Indian Virtual</Heading>
                                                    <Text color="orange.300" fontWeight="medium">India's spirit, now boarding.</Text>
                                                </Box>
                                            </HStack>
                                            <Text color="gray.300" textAlign="justify" lineHeight="relaxed" maxW="md">
                                                Indian Virtual is your gateway to connecting India with the world like no other. We offer virtual pilots the unique opportunity to explore the diverse landscapes of the Indian subcontinent, from bustling cities to remote, unexplored regions.
                                            </Text>
                                            <HStack>
                                                <Text color="orange.300" fontWeight="semibold"> 🇮🇳 Proudly Indian</Text>
                                            </HStack>
                                        </VStack>
                                    </GridItem>
                                    <GridItem>
                                        <VStack align="start" spacing={3}>
                                            <Heading size="md" fontFamily="'Nata Sans', sans" color="orange.300" mb={3}>Quick Links</Heading>
                                            <Link href="/about" color="gray.300" _hover={{ color: 'orange.300', textDecoration: 'none' }} display="flex" alignItems="center" gap={2}><Box w={1} h={1} bg="orange.400" rounded="full" />About</Link>
                                            <Link href="/fleet" color="gray.300" _hover={{ color: 'orange.300', textDecoration: 'none' }} display="flex" alignItems="center" gap={2}><Box w={1} h={1} bg="orange.400" rounded="full" />Fleet Information</Link>
                                            <Link href="/operations/ranks" color="gray.300" _hover={{ color: 'orange.300', textDecoration: 'none' }} display="flex" alignItems="center" gap={2}><Box w={1} h={1} bg="orange.400" rounded="full" />Pilot Ranks</Link>
                                            <Link href="/events" color="gray.300" _hover={{ color: 'orange.300', textDecoration: 'none' }} display="flex" alignItems="center" gap={2}><Box w={1} h={1} bg="orange.400" rounded="full" />Events</Link>
                                        </VStack>
                                    </GridItem>
                                    <GridItem>
                                        <VStack align="start" spacing={4}>
                                            <Heading size="md" fontFamily="'Nata Sans', sans" color="green.300" mb={2}>Community</Heading>
                                            <Link href="https://community.infiniteflight.com/u/indianvirtual/summary" isExternal color="gray.300" _hover={{ color: 'green.300', textDecoration: 'none' }} display="flex" alignItems="center" gap={2}><Box w={1} h={1} bg="green.400" rounded="full" />IFC Account</Link>
                                            <Link href="https://community.infiniteflight.com/t/inva-official-2024-thread/925631" isExternal color="gray.300" _hover={{ color: 'green.300', textDecoration: 'none' }} display="flex" alignItems="center" gap={2}><Box w={1} h={1} bg="green.400" rounded="full" />IFC Thread</Link>
                                            <Button as={Link} href="/apply" sx={{ bg: 'linear-gradient(to right, #48BB78, #38A169)' }} color="white" px={6} py={3} h="auto" rounded="xl" fontWeight="bold" _hover={{ bg: 'linear-gradient(to right, #38A169, #2F855A)', shadow: "xl", transform: 'scale(1.05)', textDecoration: 'none' }} mt={2} transition="all 0.3s" border="2px" borderColor="green.400" shadow="lg">
                                                <HStack>
                                                    <FaUserGroup />
                                                    <Text>Join Our Crew!</Text>
                                                    <Text>✈️</Text>
                                                </HStack>
                                            </Button>
                                        </VStack>
                                    </GridItem>
                                </Grid>
                                <Box borderTop="1px solid" borderColor="gray.700" pt={8}>
                                    <Flex direction={{ base: 'column', lg: 'row' }} justify="space-between" align="center" gap={6}>
                                        <Box textAlign={{ base: 'center', lg: 'left' }}>
                                            <Text color="gray.400" mb={2}>© 2025 Indian Virtual Airlines. All rights reserved.</Text>
                                            <Text fontSize="sm" color="gray.500">
                                                Proudly crafted by <Text as="span" color="orange.400" fontWeight="semibold">VortexVolt</Text> & <Text as="span" color="green.400" fontWeight="semibold">eldrago</Text>
                                            </Text>
                                        </Box>
                                        <Box textAlign={{ base: 'center', lg: 'right' }}>
                                            <Text fontSize="xs" color="gray.500" maxW="md" lineHeight="relaxed">
                                                Indian Virtual Airlines is not affiliated with any real-world commercial aviation service and/or Infinite Flight LLC in any form. This is a virtual airline for simulation purposes only.
                                            </Text>
                                        </Box>
                                    </Flex>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </>
    );
}
