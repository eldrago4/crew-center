'use client'

import React, { useEffect, useState } from 'react'
import {
    Box,
    Center,
    VStack,
    Text,
    Heading,
} from '@chakra-ui/react'
import NextImage from "next/image"

const backAt = (iso) =>
    new Date(iso).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })

export default function MaintenancePage() {
    // The note and expected end come from the server console. The page itself
    // stays static; this is one CDN-cached request.
    const [status, setStatus] = useState(null)
    useEffect(() => {
        fetch('/api/site-status')
            .then((res) => (res.ok ? res.json() : null))
            .then(setStatus)
            .catch(() => {})
    }, [])

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
                        {status?.message && (
                            <Text fontSize="md" textAlign="center" whiteSpace="pre-wrap">
                                {status.message}
                            </Text>
                        )}
                        {status?.until && (
                            <Text fontSize="sm" textAlign="center" color="whiteAlpha.800">
                                Expected back by {backAt(status.until)}
                            </Text>
                        )}
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
