// src/components/ApplicationForm.js
'use client';

import React, { useState } from 'react';
import { Box, Button, Input, Textarea, Spinner, Fieldset, Field, Stack, Collapsible, Icon, Text, HStack, VStack } from '@chakra-ui/react';
import { MdKeyboardArrowDown, MdKeyboardArrowUp, MdCheckCircle } from 'react-icons/md';

export default function ApplicationForm({ state, handleInputChange, handleApplicationSubmit }) {
    const { formData, status, isBlocked } = state;
    const isSubmitting = status === 'submitting';
    const [showRequirements, setShowRequirements] = useState(false);

    return (
        <Fieldset.Root bg="whiteAlpha.900" backdropFilter="blur(20px)" p={{ base: '8', lg: '12' }} rounded="3xl" boxShadow="2xl" border="1px solid" borderColor="whiteAlpha.300">
            <Stack>
                <Fieldset.Legend>Pilot Application</Fieldset.Legend>
                <Fieldset.HelperText>Please fill out the form below to apply.</Fieldset.HelperText>
            </Stack>
            <Box my="8">
                <Collapsible.Root open={showRequirements}>
                    <Collapsible.Trigger asChild>
                        <Button onClick={() => setShowRequirements(!showRequirements)} w="full" display="flex" alignItems="center" justifyContent="space-between" bgGradient="to-r" gradientFrom="orange.50" gradientTo="orange.100" p="4" rounded="xl" border="1px solid" borderColor="orange.200" _hover={{ bgGradient: 'linear(to-r, orange.100, #f8e5d3)' }} transition="all 0.3s">
                            <Text fontSize="lg" fontWeight="bold" color="gray.800" fontFamily="Playfair Display, serif">Requirements</Text>
                            <Icon as={showRequirements ? MdKeyboardArrowUp : MdKeyboardArrowDown} w="5" h="5" color="orange.600" />
                        </Button>
                    </Collapsible.Trigger>
                    <Collapsible.Content>
                        <Box mt="4" bg="gray.50" p="6" rounded="xl" border="1px solid" borderColor="gray.200">
                            <VStack as="ul" spacing="2" align="start" color="gray.700">
                                <HStack as="li"><Icon as={MdCheckCircle} color="green.500" /><Text>Be at least 13 years of age.</Text></HStack>
                                <HStack as="li"><Icon as={MdCheckCircle} color="green.500" /><Text>Be grade 3 or above.</Text></HStack>
                                <HStack as="li"><Icon as={MdCheckCircle} color="green.500" /><Text>Own a legal copy of Infinite Flight.</Text></HStack>
                                <HStack as="li"><Icon as={MdCheckCircle} color="green.500" /><Text>Be able to speak basic English.</Text></HStack>
                                <HStack as="li"><Icon as={MdCheckCircle} color="green.500" /><Text>Be able to use Discord.</Text></HStack>
                                <HStack as="li"><Icon as={MdCheckCircle} color="green.500" /><Text>Have an IFC account in good standing.</Text></HStack>
                                <HStack as="li"><Icon as={MdCheckCircle} color="green.500" /><Text>Do not appear on the IFVARB blacklist.</Text></HStack>
                                <HStack as="li"><Icon as={MdCheckCircle} color="green.500" /><Text>Be able to complete at least one flight per month.</Text></HStack>
                            </VStack>
                        </Box>
                    </Collapsible.Content>
                </Collapsible.Root>
            </Box>
            <Fieldset.Content>
                <Box display="grid" gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap="6">
                    <Field.Root><Field.Label>First Name</Field.Label><Input name="firstName" value={formData.firstName} onChange={handleInputChange} required /></Field.Root>
                    <Field.Root><Field.Label>Last Name</Field.Label><Input name="lastName" value={formData.lastName} onChange={handleInputChange} required /></Field.Root>
                </Box>
                <Field.Root><Field.Label>IFC Username</Field.Label><Input name="ifcUsername" value={formData.ifcUsername} onChange={handleInputChange} required /></Field.Root>
                <Field.Root><Field.Label>Email Address</Field.Label><Input type="email" name="email" value={formData.email} onChange={handleInputChange} required /></Field.Root>
                <Field.Root><Field.Label>Reason to join</Field.Label><Textarea name="reason" value={formData.reason} onChange={handleInputChange} required rows={4} resize="none" /></Field.Root>
            </Fieldset.Content>
            <Button type="submit" onClick={handleApplicationSubmit} disabled={isSubmitting || isBlocked} w="full" bgGradient="to-r" gradientFrom="orange.500" gradientTo="orange.600" color="white" mt="6" _hover={{ bgGradient: 'linear(to-r, orange.600, orange.700)' }} _disabled={{ opacity: '0.5', cursor: 'not-allowed' }}>
                {isSubmitting ? <Spinner size="sm" /> : 'Send Your Application'}
            </Button>
        </Fieldset.Root>
    );
}
