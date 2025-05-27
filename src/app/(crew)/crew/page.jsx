'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Center,
  Image,
  VStack,
  Text,
  HStack,
} from '@chakra-ui/react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import CallsignInput from '@/components/CallsignInput'
import { toaster } from '@/components/ui/toaster'
import { dummyData } from '@/app/shared/users'

export default function CrewLoginPage() {
  const [callsign, setCallsign] = useState('')
  const [valid, setValid] = useState(false)
  const [pendingAuth, setPendingAuth] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      const utcString = now.toISOString()
        .replace('T', ' ')
        .replace(/\.\d+Z$/, '')
      setCurrentTime(utcString)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Function to validate callsign format
  const validateCallsignFormat = (input) => {
    return input.trim().toUpperCase().match(/^[0-9]{3}$/)
  }

  const handleValidation = () => {
    if (!validateCallsignFormat(callsign)) {
      toaster.create({
        title: 'Invalid Callsign Format',
        description: 'Please enter a valid 3-digit callsign',
        type: 'error',
        duration: 3000,
      })
      return
    }

    const matchedCallsign = dummyData.find(
      (entry) => entry.callsign === `INVA${callsign.trim().toUpperCase()}`
    )

    if (matchedCallsign) {
      setValid(true)
    } else {
      toaster.create({
        title: 'Callsign Not Found',
        description: 'The entered callsign does not exist in our records',
        type: 'error',
        duration: 3000,
      })
    }
  }

  const handleDiscordLogin = async () => {
    try {
      setPendingAuth(true)
      await signIn('discord', {
        callbackUrl: '/api/auth/callback/discord'
      })
    } catch (error) {
      console.error('Auth error:', error)
      toaster.create({
        title: 'Authentication Error',
        description: 'Failed to connect with Discord',
        type: 'error',
        duration: 4000,
      })
    }
  }

  return (
    <Box position="relative" minH="100vh" bg="blackAlpha.700" color="white">
      <Image
        src="/login-bg.jpg"
        alt="Background"
        position="absolute"
        top="0"
        left="0"
        w="100%"
        h="100%"
        objectFit="cover"
        opacity={1}
        zIndex={-1}
      />


      <Center minH="100vh">
        <Box
          p={8}
          bg="whiteAlpha.100"
          borderRadius="xl"
          backdropFilter="auto"
          backdropBlur="xl"
          mt="37px"
          w="full"
          maxW="sm"
        >
          {!valid ? (
            <VStack 
              spacing={6} 
              w="full"
              data-state={valid ? "closed" : "open"}
              _open={{
                animation: "fade-in 0s ease-out, slide-from-left 0s ease-out"
              }}
            >
              <CallsignInput 
                value={callsign} 
                onChange={setCallsign}
                placeholder="Enter 3-digit callsign"
                maxLength={3}
              />
              <Button
                onClick={handleValidation}
                colorPalette="teal"
                w="full"
                isDisabled={!callsign.trim()}
              >
                Verify Callsign
              </Button>
              <Text fontSize="sm" color="whiteAlpha.700">
                Don&apos;t have an account?{' '}
                <Text as="a" href="#" color="blue.300" _hover={{ color: "blue.200" }}>
                  Apply here
                </Text>
              </Text>
            </VStack>
          ) : (
            <Box
              data-state={valid ? "open" : "closed"}
              _open={{
                animation: "fade-in 1s ease-out, slide-from-right 0.7s ease-out"
              }}
              w="full"
            >
              <Button
                onClick={() => signIn("discord",{redirectTo: "/crew/dashboard"})}
                colorPalette="blue.500"
                isLoading={pendingAuth || status === 'loading'}
                loadingText="Connecting..."
                w="full"
              >
                Login with Discord
              </Button>
            </Box>
          )}
        </Box>
      </Center>
    </Box>
  )
}