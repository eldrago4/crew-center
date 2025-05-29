'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Box,
  Button,
  Center,
  Image,
  VStack,
  Text,
  Alert,
  CloseButton,
} from '@chakra-ui/react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import CallsignInput from '@/components/CallsignInput'
import { dummyData } from '@/app/shared/users'
import Cookies from 'js-cookie'
import { FaDiscord } from "react-icons/fa"


export default function CrewLoginPage() {
  const [callsign, setCallsign] = useState('')
  const [valid, setValid] = useState(false)
  const [pendingAuth, setPendingAuth] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const error = params.get('error')
    if (error) {
      let message = 'Authentication failed. Please try again.'
      if (error === 'AccessDenied') {
        message = 'Kindly apply for an account before logging in.'
      } else if (error === 'OAuthAccountNotLinked') {
        message = 'This Discord account is not linked to your callsign.'
      } else if (error === 'OAuthProfileParseError') {
        message = 'Discord has some issues.'
      } else if (error === 'CallbackRouteError') {
        message = 'There was a problem with Discord. Please try again.'
      }
      setErrorMsg(message)
      // Remove error param from URL so it doesn't show again
      params.delete('error')
      const newUrl = window.location.pathname + (params.toString() ? `?${params}` : '')
      window.history.replaceState({}, '', newUrl)
    }
  }, [])

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
        title: 'Kindly apply first.',
        type: 'error',
        duration: 3000,
      })
    }
  }

  const handleDiscordLogin = async () => {
    try {
      setPendingAuth(true)
      const fullCallsign = `INVA${callsign.trim().toUpperCase()}`
      Cookies.set('pending-callsign', fullCallsign, { path: '/' }) // Set cookie
      await signIn('discord', { callbackUrl: '/crew/dashboard' })
    } catch (error) {
      console.error('Auth error:', error)
      toaster.create({
        title: 'Authentication Error',
        description: 'Failed to connect with Discord',
        type: 'error',
        duration: 4000,
      })
    } finally {
      setPendingAuth(false)
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
         {errorMsg && (
            <Alert.Root status="error" variant="subtle" mb={6} borderRadius="md">
                <Alert.Indicator position="relative" top="5"/>
                <Alert.Content>
                  <Alert.Title>We couldn't log you in</Alert.Title>
                  <Alert.Description sx={{ whiteSpace: "pre-line" }}>
                    {errorMsg}
                  </Alert.Description>
                </Alert.Content>
                <CloseButton
                  pos="relative"
                  top="-2"
                  insetEnd="-2"
                  onClick={() => setErrorMsg('')}
                />
            </Alert.Root>
          )}
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
              onClick={handleDiscordLogin}
              bg="#5865F2"
              color="white"
              _hover={{ bg: "#4752C4" }}
              _active={{ bg: "#404EED" }}
              isLoading={pendingAuth || status === 'loading'}
              loadingText="Connecting..."
              size="md"
              w="full"
              variant="solid"
            ><FaDiscord /> Login with Discord</Button>
            </Box>
          )}
        </Box>
      </Center>
    </Box>
  )
}