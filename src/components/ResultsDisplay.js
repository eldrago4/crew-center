// src/components/ResultsDisplay.js
'use client';

import { useState, useEffect } from 'react';
import { Box, Button, Heading, Text, Icon, Link, VStack, HStack, Flex } from '@chakra-ui/react';
import { MdCheckCircle, MdCancel } from 'react-icons/md';
import { RiDiscordFill } from 'react-icons/ri';
import { FaDiscord } from "react-icons/fa"
import CallsignInput from './CallsignInput';
import { isSelectableApplicantCallsign, APPLICANT_CALLSIGN_RANGE } from '@/lib/callsign';
import { signIn } from 'next-auth/react'
import { useSession } from 'next-auth/react'
import Cookies from 'js-cookie'

const DISCORD_INVITE = 'https://discord.gg/SuYxKzhbHe';

const AUTH_ERROR_MESSAGES = {
    'callsign-taken': 'That callsign was claimed while you were linking Discord. Pick another number and try again.',
    'callsign-reserved': `That callsign is reserved. Pick a number between ${APPLICANT_CALLSIGN_RANGE}.`,
    'server': "We couldn't link your Discord account just then. Your test result is saved — please try again.",
};

// A numbered step that dims until it's the applicant's turn, so there is only ever
// one obvious thing to do.
function Step({ index, title, description, state, children }) {
    const isDone = state === 'done';
    const isActive = state === 'active';
    const isWaiting = state === 'waiting';

    return (
        <Box
            bg={isWaiting ? 'gray.50' : 'white'}
            border="1px solid"
            borderColor={isDone ? 'green.200' : isActive ? 'orange.200' : 'gray.200'}
            rounded="2xl"
            p={{ base: '5', md: '6' }}
            opacity={isWaiting ? 0.6 : 1}
            transition="all 0.2s"
            textAlign="left"
        >
            <HStack gap="3" align="center" mb={children ? '4' : '0'}>
                <Flex
                    flexShrink="0"
                    w="8"
                    h="8"
                    rounded="full"
                    align="center"
                    justify="center"
                    fontWeight="bold"
                    fontSize="sm"
                    bg={isDone ? 'green.500' : isActive ? 'orange.500' : 'gray.300'}
                    color="white"
                >
                    {isDone ? <Icon as={MdCheckCircle} w="5" h="5" /> : index}
                </Flex>
                <Box>
                    <Text fontWeight="bold" color="gray.800">{title}</Text>
                    {description && <Text fontSize="sm" color="gray.500">{description}</Text>}
                </Box>
            </HStack>
            {children}
        </Box>
    );
}

export default function ResultsDisplay({ state, resetApplication, handleCallsignChange, requestDiscordLink, markDiscordLinked }) {
    const { status, data: session } = useSession()
    const { testResult, callsign, discordLinked, linkPendingFor } = state;
    const [ callsignStatus, setCallsignStatus ] = useState('idle'); // idle | checking | available | taken | error
    const [ pendingAuth, setPendingAuth ] = useState(false);
    const [ authError, setAuthError ] = useState(null);

    const fullCallsign = `INVA${callsign}`;
    const callsignReady = callsignStatus === 'available';

    const handleDiscordLogin = async () => {
        try {
            setPendingAuth(true)
            Cookies.set('applicant-callsign', fullCallsign, { path: '/' }) // Set cookie for applicants
            Cookies.set('applicant-ifcName', state.formData.ifcUsername, { path: '/' }) // Set IFC name cookie
            Cookies.remove('pending-callsign', { path: '/' }) // Remove any crew cookie to avoid conflict
            requestDiscordLink(fullCallsign) // Marks this callsign as the one we're linking
            // Redirects this tab rather than opening a popup: window.open after an
            // awaited signIn() has lost the user gesture and gets blocked. Coming back
            // is safe now that the passed screen is restored from localStorage.
            await signIn('discord', { callbackUrl: '/apply' })
        } catch (error) {
            console.error('Auth error:', error)
            setPendingAuth(false)
        }
    };

    // A link only counts if this flow asked for it and the session came back carrying
    // that exact callsign. Matching on the session alone treated a login that already
    // existed as proof — a crew member who is INVA011, typing 011, was told they were
    // already in without ever touching Discord.
    useEffect(() => {
        if (status !== 'authenticated' || discordLinked || !linkPendingFor) return;
        if (session?.user?.callsign === linkPendingFor) {
            markDiscordLinked();
        }
    }, [ status, session, linkPendingFor, discordLinked, markDiscordLinked ]);

    useEffect(() => {
        if (!isSelectableApplicantCallsign(callsign)) {
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
        if (error === 'callsign-taken' || error === 'callsign-reserved') handleCallsignChange('');
        const url = new URL(window.location.href);
        url.searchParams.delete('error');
        window.history.replaceState({}, '', url);
    }, [ handleCallsignChange ]);

    if (!testResult) return null;

    if (!testResult.passed) {
        return (
            <Box bg="whiteAlpha.900" p={{ base: '8', lg: '12' }} rounded="3xl" boxShadow="2xl" textAlign="center">
                <Icon as={MdCancel} w="16" h="16" color="red.500" mx="auto" mb="4" />
                <Heading as="h2" fontSize={{ base: '3xl', lg: '4xl' }} color="red.600" fontFamily="Playfair Display, serif">Unfortunately, you have failed.</Heading>
                <Text fontSize="xl" color="gray.700" mt="2">Score: {testResult.score}/10</Text>
                <Text fontSize="lg" color="gray.600" mb="6">You may try again in 24 hours.</Text>
                <Button onClick={resetApplication} bg="gray.600" color="white" mt="4" _hover={{ bg: 'gray.700' }}>
                    Go back to Home
                </Button>
            </Box>
        );
    }

    // Passed, and already linked: nothing left but to get them into the server.
    if (discordLinked) {
        return (
            <Box bg="whiteAlpha.900" p={{ base: '8', lg: '12' }} rounded="3xl" boxShadow="2xl" textAlign="center">
                <Icon as={MdCheckCircle} w="16" h="16" color="green.500" mx="auto" mb="4" />
                <Heading as="h2" fontSize={{ base: '3xl', lg: '4xl' }} color="green.600" fontFamily="Playfair Display, serif">
                    You&apos;re in{callsign ? `, ${fullCallsign}` : ''}!
                </Heading>
                <Text fontSize="lg" color="gray.700" mt="3" maxW="md" mx="auto">
                    Your Discord is linked and we&apos;ve added you to our server. Head over to meet the crew — a staff member will take it from there.
                </Text>
                <Link
                    href={DISCORD_INVITE}
                    target="_blank"
                    rel="noopener noreferrer"
                    display="inline-flex"
                    alignItems="center"
                    gap="3"
                    bg="#5865F2"
                    color="white"
                    px="8"
                    py="4"
                    mt="8"
                    rounded="xl"
                    fontWeight="bold"
                    textDecoration="none"
                    _hover={{ bg: '#4752C4' }}
                >
                    <Icon as={RiDiscordFill} w="6" h="6" />
                    Open our Discord Server
                </Link>
                <Text fontSize="xs" color="gray.500" mt="4">
                    Don&apos;t see the server in your list? Use the button above to join manually.
                </Text>
            </Box>
        );
    }

    // Passed, not yet linked: two steps, one obvious action at a time.
    return (
        <Box bg="whiteAlpha.900" p={{ base: '6', md: '8', lg: '12' }} rounded="3xl" boxShadow="2xl">
            <VStack gap="1" textAlign="center" mb="8">
                <Icon as={MdCheckCircle} w="14" h="14" color="green.500" />
                <Heading as="h2" fontSize={{ base: '2xl', lg: '3xl' }} color="green.600" fontFamily="Playfair Display, serif">
                    You passed!
                </Heading>
                <Text color="gray.600">
                    Score {testResult.score}/10 — two quick steps and you&apos;re done.
                </Text>
            </VStack>

            {authError && (
                <Box bg="red.50" border="1px solid" borderColor="red.200" color="red.700" px="4" py="3" rounded="lg" mb="5" fontSize="sm">
                    {AUTH_ERROR_MESSAGES[ authError ] ?? AUTH_ERROR_MESSAGES.server}
                </Box>
            )}

            <VStack gap="4" align="stretch">
                <Step
                    index={1}
                    title="Choose your callsign"
                    description={`Any number from ${APPLICANT_CALLSIGN_RANGE} that isn't taken yet.`}
                    state={callsignReady ? 'done' : 'active'}
                >
                    <CallsignInput
                        value={callsign}
                        onChange={handleCallsignChange}
                        status={callsignStatus}
                        label="Your callsign"
                        tone="light"
                        helperText={`Enter a number between ${APPLICANT_CALLSIGN_RANGE}`}
                    />
                </Step>

                <Step
                    index={2}
                    title="Link your Discord"
                    description="We'll add you to our server automatically."
                    state={callsignReady ? 'active' : 'waiting'}
                >
                    <Button
                        onClick={handleDiscordLogin}
                        bg="#5865F2"
                        color="white"
                        _hover={{ bg: callsignReady ? '#4752C4' : '#5865F2' }}
                        _active={{ bg: '#404EED' }}
                        disabled={!callsignReady}
                        loading={pendingAuth}
                        loadingText="Taking you to Discord…"
                        size="lg"
                        w="full"
                        cursor={callsignReady ? 'pointer' : 'not-allowed'}
                    >
                        <FaDiscord /> Continue with Discord
                    </Button>
                    <Text fontSize="xs" color="gray.500" mt="3" textAlign="center">
                        {callsignReady
                            ? `You'll be flying as ${fullCallsign}. Discord will ask you to authorise, then bring you straight back here.`
                            : 'Pick an available callsign above to unlock this step.'}
                    </Text>
                </Step>
            </VStack>

            <Flex justify="center" mt="8">
                <Button onClick={resetApplication} variant="ghost" color="gray.500" size="sm" _hover={{ color: 'gray.700', bg: 'gray.100' }}>
                    Start over
                </Button>
            </Flex>
        </Box>
    );
}
