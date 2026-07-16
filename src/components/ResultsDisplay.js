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
import Cookies from 'js-cookie'

const AUTH_ERROR_MESSAGES = {
    'callsign-taken': 'That callsign was claimed while you were linking Discord. Pick another number and try again.',
    'server': "We couldn't link your Discord account just then. Your test result is saved — please try again.",
};

export default function ResultsDisplay({ state, resetApplication, handleCallsignChange, markDiscordLinked }) {
    const { status, data: session } = useSession()
    const { testResult, callsign, discordLinked } = state;
    const [ callsignStatus, setCallsignStatus ] = useState('idle'); // idle | checking | available | taken | error
    const [ pendingAuth, setPendingAuth ] = useState(false);
    const [ authError, setAuthError ] = useState(null);

    const handleDiscordLogin = async () => {
        try {
            setPendingAuth(true)
            const fullCallsign = `INVA${callsign.trim().toUpperCase()}`
            Cookies.set('applicant-callsign', fullCallsign, { path: '/' }) // Set cookie for applicants
            Cookies.set('applicant-ifcName', state.formData.ifcUsername, { path: '/' }) // Set IFC name cookie
            Cookies.remove('pending-callsign', { path: '/' }) // Remove any crew cookie to avoid conflict
            // Redirects this tab rather than opening a popup: window.open after an
            // awaited signIn() has lost the user gesture and gets blocked. Coming back
            // is safe now that the passed screen is restored from localStorage.
            await signIn('discord', { callbackUrl: '/apply' })
        } catch (error) {
            console.error('Auth error:', error)
            setPendingAuth(false)
        }
    };

    // How the applicant advances after returning from Discord: the redirect lands
    // back here with a session, which is proof the link succeeded.
    useEffect(() => {
        if (status === 'authenticated' && session?.user?.discordId && !discordLinked) {
            markDiscordLinked();
        }
    }, [ status, session, discordLinked, markDiscordLinked ]);

    useEffect(() => {
        if (callsign.length !== 3 || parseInt(callsign) <= 99) {
            setCallsignStatus('idle');
            return;
        }
        setCallsignStatus('checking');
        const timer = setTimeout(async () => {
            try {
                const res = await fetch('/api/validate-callsign', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ callsign }),
                });
                if (!res.ok) throw new Error('Callsign check failed');
                const data = await res.json();
                setCallsignStatus(data.available ? 'available' : 'taken');
            } catch {
                // Fail closed — an unanswered check leaves the Discord button disabled
                // rather than waving through a number that may already be claimed.
                setCallsignStatus('error');
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [ callsign ]);

    // Surfaced when the signIn callback bounces the applicant back here.
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const error = params.get('error');
        if (!error) return;
        setAuthError(error);
        if (error === 'callsign-taken') handleCallsignChange('');
        const url = new URL(window.location.href);
        url.searchParams.delete('error');
        window.history.replaceState({}, '', url);
    }, [ handleCallsignChange ]);

    if (!testResult) return null;

    return (
        <Box bg="whiteAlpha.900" p={{ base: '8', lg: '12' }} rounded="3xl" boxShadow="2xl" textAlign="center">
            {testResult.passed ? (
                <>
                    <Icon as={MdCheckCircle} w="16" h="16" color="green.500" mx="auto" mb="4" />
                    <Heading as="h2" fontSize={{ base: '3xl', lg: '4xl' }} color="green.600">Congratulations!</Heading>
                    <Text fontSize="xl" color="gray.700" mt="2">Your application has been sent.</Text>
                    <Text fontSize="lg" color="gray.600" mb="6">Score: {testResult.score}/10</Text>
                    {!discordLinked ? (
                        <>
                            {authError && (
                                <Box bg="red.50" border="1px solid" borderColor="red.200" color="red.700" px="4" py="3" rounded="lg" mb="4" fontSize="sm" textAlign="left">
                                    {AUTH_ERROR_MESSAGES[ authError ] ?? AUTH_ERROR_MESSAGES.server}
                                </Box>
                            )}
                            <Text color="gray.700" mb="4">Choose your callsign number (100–999) to get started.</Text>
                            <CallsignInput value={callsign} onChange={handleCallsignChange} status={callsignStatus} label="Your Callsign" />
                            {callsignStatus !== 'available' && callsignStatus !== 'error' && (
                                <Text fontSize="xs" color="gray.500" mb={2}>
                                    {callsignStatus === 'taken' ? 'Pick a different number to continue.' : 'Confirm your callsign is available before linking Discord.'}
                                </Text>
                            )}
                            <Button
                                onClick={handleDiscordLogin}
                                bg="#5865F2"
                                color="white"
                                _hover={{ bg: callsignStatus === 'available' ? "#4752C4" : "#5865F2" }}
                                _active={{ bg: "#404EED" }}
                                disabled={callsignStatus !== 'available'}
                                isLoading={pendingAuth}
                                loadingText="Connecting..."
                                size="md"
                                w="full"
                                variant="solid"
                                opacity={callsignStatus !== 'available' ? 0.5 : 1}
                                cursor={callsignStatus !== 'available' ? 'not-allowed' : 'pointer'}
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
