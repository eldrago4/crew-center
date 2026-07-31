'use client'

import { Box } from '@chakra-ui/react'
import RoutesClient from './RoutesClient'

export default function RoutesView({ packedRoutes, fleet }) {
  return (
    <Box p={{ base: 4, md: 4 }} flex="1">
      <RoutesClient packedRoutes={packedRoutes} fleet={fleet} />
    </Box>
  )
}
