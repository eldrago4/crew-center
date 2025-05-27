'use client'

import { signIn, signOut, useSession } from 'next-auth/react'  // correct import path
import { Button } from '@chakra-ui/react'

export default function DiscordButton({ onSignIn }) {
  const { data: session } = useSession()

  if (session) {
    return (
      <Button
        onClick={() => signOut()}
        colorScheme="gray"
      >
        Sign out
      </Button>
    )
  }

  return (
    <Button
      colorScheme="discord"
      onClick={() => {
        signIn('discord').then(() => {
          if (onSignIn) onSignIn(session)
        })
      }}
    >
      Sign in with Discord
    </Button>
  )
}