// src/components/ResultsDisplay.js
'use client';

import { Box, Button, Heading, Text, Icon, Link } from '@chakra-ui/react';
import { MdCheckCircle, MdCancel } from 'react-icons/md';
import { RiDiscordFill } from 'react-icons/ri';

export default function ResultsDisplay({ state, resetApplication }) {
    const { testResult } = state;

    if (!testResult) return null;

    return (
        <Box bg="whiteAlpha.900" p={{ base: '8', lg: '12' }} rounded="3xl" boxShadow="2xl" textAlign="center">
            {testResult.passed ? (
                <>
                    <Icon as={MdCheckCircle} w="16" h="16" color="green.500" mx="auto" mb="4" />
                    <Heading as="h2" fontSize={{ base: '3xl', lg: '4xl' }} color="green.600">Congratulations!</Heading>
                    <Text fontSize="xl" color="gray.700" mt="2">Your application has been sent.</Text>
                    <Text fontSize="lg" color="gray.600" mb="6">Score: {testResult.score}/10</Text>
                    <Text color="gray.700" mb="8">To continue, please join our Discord server.</Text>
                    <Link href="https://discord.gg/SuYxKzhbHe" isExternal display="inline-flex" alignItems="center" gap="3" bg="#5865F2" color="white" px="8" py="4" rounded="xl" fontWeight="bold" _hover={{ bg: '#4752C4' }}>
                        <Icon as={RiDiscordFill} w="6" h="6" />
                        Join our Discord Server
                    </Link>
                </>
            ) : (
                <>
                    <Icon as={MdCancel} w="16" h="16" color="red.500" mx="auto" mb="4" />
                    <Heading as="h2" fontSize={{ base: '3xl', lg: '4xl' }} color="red.600">Unfortunately, you have failed.</Heading>
                    <Text fontSize="xl" color="gray.700" mt="2">Score: {testResult.score}/10</Text>
                    <Text fontSize="lg" color="gray.600" mb="6">You may try again in 24 hours.</Text>
                </>
            )}
            <Button onClick={resetApplication} bgGradient="linear(to-r, gray.500, gray.600)" color="white" mt="8" _hover={{ bgGradient: 'linear(to-r, gray.600, gray.700)' }}>
                Go back to Home
            </Button>
        </Box>
    );
}
