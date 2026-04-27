// src/components/ErrorDialog.js
'use client';

import { Flex, Box, Heading, Text, Button } from '@chakra-ui/react';

export default function ErrorDialog({ isOpen, title, message, onClose }) {
    if (!isOpen) return null;

    return (
        <Flex position="fixed" top="0" left="0" right="0" bottom="0" bg="blackAlpha.600" align="center" justify="center" zIndex="1000">
            <Box bg="white" p="6" rounded="xl" boxShadow="2xl" maxW="sm" w="full" mx="4">
                <Heading as="h3" size="lg" mb="4">{title}</Heading>
                <Text mb="6">{message}</Text>
                <Button onClick={onClose} w="full" bgGradient="linear(to-r, orange.500, orange.600)" color="white">
                    Close
                </Button>
            </Box>
        </Flex>
    );
}
