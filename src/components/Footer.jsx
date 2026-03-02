"use client";
import React from "react";
import {
    Box,
    Button,
    Flex,
    Grid,
    GridItem,
    HStack,
    Heading,
    Link,
    Text,
    VStack,
} from '@chakra-ui/react';
import NextImage from 'next/image';
import { FaUserGroup } from "react-icons/fa6";

export default function Footer() {
    return (
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
                                <Link href="/info" color="gray.300" _hover={{ color: 'orange.300', textDecoration: 'none' }} display="flex" alignItems="center" gap={2}><Box w={1} h={1} bg="orange.400" rounded="full" />About</Link>
                                <Link href="/fleet" color="gray.300" _hover={{ color: 'orange.300', textDecoration: 'none' }} display="flex" alignItems="center" gap={2}><Box w={1} h={1} bg="orange.400" rounded="full" />Fleet Information</Link>
                                <Link href="/ranks" color="gray.300" _hover={{ color: 'orange.300', textDecoration: 'none' }} display="flex" alignItems="center" gap={2}><Box w={1} h={1} bg="orange.400" rounded="full" />Pilot Ranks</Link>
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
    );
}
