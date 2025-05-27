'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Flex,
  Container,
  Text,
  Badge,
  Heading,
  Stack,
} from '@chakra-ui/react'
import { Avatar } from '@chakra-ui/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { dummyData } from '@/app/shared/users'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState('2025-05-27 21:00:32')
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <Container maxW="7xl" py="8">
        <Text>Loading...</Text>
      </Container>
    )
  }

  return (
    <Box minH="100vh" bg="blackAlpha.700">
      <Container maxW="7xl" py="8">
        <Box
          bg="whiteAlpha.200"
          backdropFilter="auto"
          backdropBlur="8px"
          borderWidth="1px"
          borderColor="whiteAlpha.300"
          rounded="xl"
          p="6"
          shadow="xl"
        >
          <Stack spacing="6">
            {/* User Profile Header */}
            <Flex gap="4" align="center">
              <Avatar.Root size="xl">
                <Avatar.Image 
                  src={session?.user?.image} 
                  alt={session?.user?.name}
                />
                <Avatar.Fallback>
                  {session?.user?.name?.charAt(0)}
                </Avatar.Fallback>
              </Avatar.Root>
              <Stack spacing="2">
                <Heading size="lg" color="white">
                  {session?.user?.name}
                </Heading>
                <Badge 
                  colorPalette="purple"
                  px="2"
                  py="1"
                  rounded="md"
                >
                  Discord Authenticated
                </Badge>
              </Stack>
            </Flex>

            <Box h="1px" bg="whiteAlpha.300" />

            {/* User Details */}
            <Stack spacing="4">
              <Stack>
                <Text color="gray.400" fontSize="sm">Email</Text>
                <Text color="white">{session?.user?.email}</Text>
              </Stack>

              {session?.user?.id && (
                <Stack>
                  <Text color="gray.400" fontSize="sm">Discord ID</Text>
                  <Text color="white">{session.user.id}</Text>
                </Stack>
              )}

              <Stack>
                <Text color="gray.400" fontSize="sm">Session Status</Text>
                <Badge 
                  colorPalette="green"
                  rounded="md"
                  w="max-content"
                  px="2"
                  py="1"
                >
                  Active
                </Badge>
              </Stack>
            </Stack>
          </Stack>
        </Box>
      </Container>
    </Box>
  )
}