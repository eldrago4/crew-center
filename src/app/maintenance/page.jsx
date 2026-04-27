'use client'

import React from 'react'
import {
    Box,
    Center,
    VStack,
    Text,
    Heading,
} from '@chakra-ui/react'
import NextImage from "next/image"

export default function MaintenancePage() {
    return (
        <Box position="relative" minH="100vh" bg="blackAlpha.700" color="white">
            <Box
                position="absolute"
                top="0"
                left="0"
                w="100%"
                h="100%"
                zIndex={-1}
                opacity={1}
            >
                <NextImage
                    src="/login-bg.jpg"
                    alt="Background"
                    fill
                    style={{ objectFit: "cover" }}
                    priority
                    loading="eager"
                />
            </Box>

            <Center minH="100vh">
                <Box
                    mx={7}
                    p={8}
                    bg="whiteAlpha.100"
                    borderRadius="xl"
                    backdropFilter="auto"
                    backdropBlur="xl"
                    mt="37px"
                    w="full"
                    maxW="lg"
                >
                    <VStack spacing={6} w="full">
                        <Heading size="lg" textAlign="center">
                            Website Under Maintenance
                        </Heading>
                        <Text fontSize="md" textAlign="center" color="whiteAlpha.800">
                            We're currently performing maintenance on our crew center. Please check back later.
                        </Text>
                        <Box
                            as="pre"
                            fontFamily="monospace"
                            fontSize="10px"
                            textAlign="left"
                            color="whiteAlpha.900"
                            lineHeight="1"
                            margin="0 auto"
                            whiteSpace="pre-wrap"
                            wordWrap="break-word"
                        >
                            {`   \\----------------------------------\\
   \\                                  \\        __
    \\                                  \\       | \\
     >  we will be back soon            >------|  \\       ______
    /                                  /       --- \\_____/**|_|_\\____  |
   /                                  /          \\_______ --------- __>-}
  /----------------------------------/              /  \\_____|_____/   |
                                                    *         |
                                                             {O}
       /*\\       /*\\       /*\\       /*\\       /*\\       /*\\       /*\\
      |***|     |***|     |***|     |***|     |***|     |***|     |***|
       \\*/       \\*/ ____  \\*/       \\*/       \\*/       \\*/       \\*/
        |         |  |  |   |         |         |         |         |
  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^-dr`}
                        </Box>
                    </VStack>
                </Box>
            </Center>
        </Box>
    )
}
