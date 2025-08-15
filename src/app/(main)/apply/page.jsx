// src/app/apply/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { Box, Heading, Text, VStack, Flex } from '@chakra-ui/react';
import { useApplicationProcess } from '@/hooks/useApplicationProcess';
import ApplicationForm from '@/components/ApplicationForm';
import WrittenTest from '@/components/WrittenTest';
import ResultsDisplay from '@/components/ResultsDisplay';
import ErrorDialog from '@/components/ErrorDialog';

export default function ApplyPage() {
    const { state, questions, ...handlers } = useApplicationProcess();
    const [ isVisible, setIsVisible ] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const renderCurrentStep = () => {
        switch (state.step) {
            case 1:
                return <ApplicationForm state={state} {...handlers} />;
            case 2:
                return <WrittenTest state={state} questions={questions} {...handlers} />;
            case 3:
                return <ResultsDisplay state={state} {...handlers} />;
            default:
                return <ApplicationForm state={state} {...handlers} />;
        }
    };

    return (
        <>
            <ErrorDialog
                isOpen={state.status === 'error'}
                title="An Error Occurred"
                message={state.error}
                onClose={handlers.dismissError}
            />

            <Box position="relative" minH="100vh" color="fg" fontFamily="sans-serif" overflowX="hidden">
                {/* Background and Header sections */}
                <Box position="fixed" inset="0" zIndex="0">
                    <Box position="absolute" inset="0" bgGradient="to-br" from="green.50" to="green.100"></Box>
                    <Box position="absolute" inset="0" bgGradient="to-t" from="whiteAlpha.800" to="whiteAlpha.600"></Box>
                </Box>
                <Box as="main" position="relative" zIndex="10">
                    <Box as="section" w="full" py="16" px={{ base: '4', lg: '8' }}>
                        <VStack maxW="4xl" mx="auto" textAlign="center" transition="all 1s" opacity={isVisible ? '1' : '0'} transform={isVisible ? 'translateY(0)' : 'translateY(8px)'}>
                            <Heading as="h1" fontSize={{ base: '4xl', sm: '5xl', lg: '6xl' }} fontWeight="bold" color="fg" lineHeight="tight" mb="6" fontFamily="Playfair Display, serif">
                                Join the <Box as="span" bgGradient="to-r" gradientFrom="orange.500" gradientTo="red.500" bgClip="text">Maharaja Experience</Box>
                            </Heading>
                            {/* Step indicators */}
                            <Box display="grid" gridTemplateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap="8" mt="12">
                                <Box bg="bg.panel" backdropFilter="blur(2px)" p="6" rounded="2xl" boxShadow="lg" border="1px solid" borderColor="border">
                                    <Flex w="12" h="12" bgGradient="to-r" gradientFrom="orange.500" gradientTo="orange.600" color="white" rounded="full" align="center" justify="center" fontWeight="bold" fontSize="xl" mb="4" mx="auto">1</Flex>
                                    <Heading as="h3" fontSize="xl" fontWeight="bold" mb="2" color="fg" fontFamily="Playfair Display, serif">Application</Heading>
                                    <Text color="fg.muted">Submit your application.</Text>
                                </Box>
                                <Box bg="bg.panel" backdropFilter="blur(2px)" p="6" rounded="2xl" boxShadow="lg" border="1px solid" borderColor="border">
                                    <Flex w="12" h="12" bgGradient="to-r" gradientFrom="blue.500" gradientTo="blue.600" color="white" rounded="full" align="center" justify="center" fontWeight="bold" fontSize="xl" mb="4" mx="auto">2</Flex>
                                    <Heading as="h3" fontSize="xl" fontWeight="bold" mb="2" color="fg" fontFamily="Playfair Display, serif">Test</Heading>
                                    <Text color="fg.muted">Once you have submitted your application, you will be redirected to the written test.</Text>
                                </Box>
                                <Box bg="bg.panel" backdropFilter="blur(2px)" p="6" rounded="2xl" boxShadow="lg" border="1px solid" borderColor="border">
                                    <Flex w="12" h="12" bgGradient="to-r" gradientFrom="green.500" gradientTo="green.600" color="white" rounded="full" align="center" justify="center" fontWeight="bold" fontSize="xl" mb="4" mx="auto">3</Flex>
                                    <Heading as="h3" fontSize="xl" fontWeight="bold" mb="2" color="fg" fontFamily="Playfair Display, serif">Result</Heading>
                                    <Text color="fg.muted">If you're successful, you'll need to join our Discord server to continue the process.</Text>
                                </Box>
                            </Box>
                        </VStack>
                    </Box>

                        <Box as="section" w="full" py="8" px={{ base: '4', lg: '8' }}>
                            <Box maxW="4xl" mx="auto">
                                {renderCurrentStep()}
                            </Box>
                        </Box>
                </Box>

            </Box >

        </>
    );
}
