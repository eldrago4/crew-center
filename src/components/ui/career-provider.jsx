'use client'

import { ChakraProvider, defaultSystem } from '@chakra-ui/react'

export function CareerProvider(props) {
    return (
        <ChakraProvider value={defaultSystem} {...props} />
    )
}
