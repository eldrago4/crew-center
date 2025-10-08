// src/components/ResultsDisplay.js
'use client';

import { useState, useEffect } from 'react';
import { Box, Button, Heading, Text, Icon, Link } from '@chakra-ui/react';
import { MdCheckCircle, MdCancel } from 'react-icons/md';
import { RiDiscordFill } from 'react-icons/ri';
import { FaDiscord } from "react-icons/fa"
import CallsignInput from './CallsignInput';
import { signIn } from 'next-auth/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'

export default function ResultsDisplay({ state, resetApplication, handleCallsignChange }) {
    const { status, data: session } = useSession()
    const { testResult, callsign } = state;
    const [ isCallsignValid, setIsCallsignValid ] = useState(false);
    const [ discordClicked, setDiscordClicked ] = useState(false);
    const [ pendingAuth, setPendingAuth ] = useState(false);

    const handleDiscordLogin = async () => {
        try {
            setPendingAuth(true)
            const fullCallsign = `INVA${callsign.trim().toUpperCase()}`
            Cookies.set('applicant-callsign', fullCallsign, { path: '/' }) // Set cookie for applicants
            Cookies.set('applicant-ifcName', state.formData.ifcUsername, { path: '/' }) // Set IFC name cookie
            Cookies.remove('pending-callsign', { path: '/' }) // Remove any crew cookie to avoid conflict
            const callbackUrl = '/api/applicant-auth/close'
            const result = await signIn('discord', { callbackUrl, redirect: false })
            if (result?.url) {
                window.open(result.url, '_blank')
            }
            setPendingAuth(false)
        } catch (error) {
            console.error('Auth error:', error)
            setPendingAuth(false)
        }
    };

    useEffect(() => {
        if (status === 'authenticated' && session?.user?.discordId) {
            // Discord login successful, discordId is linked
            console.log('Discord ID linked:', session.user.discordId);
            // Perhaps show a success message or update UI
        }
    }, [ status, session ]);

    useEffect(() => {
        if (callsign.length !== 3 || parseInt(callsign) <= 99) {
            setIsCallsignValid(false);
            return;
        }
        const validate = async () => {
            try {
                const res = await fetch('/api/validate-callsign', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ callsign }),
                });
                const data = await res.json();
                setIsCallsignValid(!data.valid);
            } catch (error) {
                setIsCallsignValid(false);
            }
        };
        validate();
    }, [ callsign ]);

    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data === 'auth-success') {
                setDiscordClicked(true);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    if (!testResult) return null;

    return (
        <Box bg="whiteAlpha.900" p={{ base: '8', lg: '12' }} rounded="3xl" boxShadow="2xl" textAlign="center">
            {testResult.passed ? (
                <>
                    <Icon as={MdCheckCircle} w="16" h="16" color="green.500" mx="auto" mb="4" />
                    <Heading as="h2" fontSize={{ base: '3xl', lg: '4xl' }} color="green.600">Congratulations!</Heading>
                    <Text fontSize="xl" color="gray.700" mt="2">Your application has been sent.</Text>
                    <Text fontSize="lg" color="gray.600" mb="6">Score: {testResult.score}/10</Text>
                    {!discordClicked ? (
                        <>
                            <Text color="gray.700" mb="8">Your callsign between 100-999</Text>
                            <CallsignInput value={callsign} onChange={handleCallsignChange} borderColor={isCallsignValid ? 'green.500' : 'red.500'} />
                            <Button
                                onClick={handleDiscordLogin}
                                bg="#5865F2"
                                color="white"
                                _hover={{ bg: "#4752C4" }}
                                _active={{ bg: "#404EED" }}
                                disabled={!isCallsignValid}
                                isLoading={pendingAuth}
                                loadingText="Connecting..."
                                size="md"
                                w="full"
                                variant="solid"
                            ><FaDiscord /> Login with Discord</Button>
                        </>
                    ) : (
                        <>
                            <Text color="gray.700" mb="8">To continue, please join our Discord server.</Text>
                            <Link href="https://discord.gg/SuYxKzhbHe" isExternal display="inline-flex" alignItems="center" gap="3" bg="#5865F2" color="white" px="8" py="4" rounded="xl" fontWeight="bold" _hover={{ bg: '#4752C4' }}>
                                <Icon as={RiDiscordFill} w="6" h="6" />
                                Join our Discord Server
                            </Link>
                        </>
                    )}
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
