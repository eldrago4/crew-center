// src/components/WrittenTest.js
'use client';

import { Box, Button, Heading, Text, VStack, RadioGroup, Spinner } from '@chakra-ui/react';

export default function WrittenTest({ state, questions, handleAnswerChange, handleTestSubmit }) {
    const { answers, status } = state;
    const isSubmitting = status === 'submitting';

    return (
        <Box as="form" onSubmit={handleTestSubmit} bg="whiteAlpha.900" p={{ base: '8', lg: '12' }} rounded="3xl" boxShadow="2xl">
            <VStack textAlign="center" mb="8">
                <Heading as="h2" fontSize={{ base: '3xl', lg: '4xl' }} fontWeight="bold" mb="4" fontFamily="Playfair Display, serif">
                    <Text as="span" bgGradient="linear(to-r, #ff6b35, #138808)" bgClip="text">Written Test</Text>
                </Heading>
                <Text color="gray.700" maxW="3xl">To become a pilot you must answer this test and obtain a minimum score of 7/10. Good luck!</Text>
            </VStack>
            <VStack spacing="8">
                {questions.map((q) => (
                    <Box key={q.id} bg="gray.50" p="6" rounded="xl" w="full">
                        <Heading as="h3" fontSize="lg" fontWeight="bold" mb="4">Question {q.id}: {q.question}</Heading>
                        <RadioGroup.Root value={answers[ q.id ]?.toString()} onValueChange={(details) => handleAnswerChange(q.id, parseInt(details.value))}>
                            <VStack spacing="3" align="start">
                                {q.options.map((option, index) => (
                                    <RadioGroup.Item key={index} value={index.toString()} colorPalette="orange" cursor="pointer">
                                        <RadioGroup.ItemHiddenInput />
                                        <RadioGroup.ItemIndicator />
                                        <RadioGroup.ItemText color="gray.700">{option}</RadioGroup.ItemText>
                                    </RadioGroup.Item>
                                ))}
                            </VStack>
                        </RadioGroup.Root>
                    </Box>
                ))}
            </VStack>
            <Box mt="8" textAlign="center">
                <Button type="submit" disabled={isSubmitting} bgGradient="linear(to-r, green.500, green.600)" color="white" _hover={{ bgGradient: 'linear(to-r, green.600, green.700)' }}>
                    {isSubmitting ? <Spinner size="sm" /> : 'Submit Test'}
                </Button>
            </Box>
        </Box>
    );
}
