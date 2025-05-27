'use client'

import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import { ColorModeProvider } from './color-mode'

export function Provider(props) {
  return (
    <ChakraProvider value={defaultSystem}>
      <ColorModeProvider {...props} />
    </ChakraProvider>
  )
}
// DISCORD_CLIENT_ID=1104336967661015060
// DISCORD_CLIENT_SECRET=LqEZICJJ20yNrSlmKA97oF2LzxpICukg
// NEXTAUTH_SECRET=wHZgAFI/gfkcNoCeBKSqUzi+6OrRx9EZDplP4hYIDc8=
// NEXTAUTH_URL=https://studious-succotash-r6jq5pgj4rp2x75x-3000.app.github.dev/ # or your deployment URL
