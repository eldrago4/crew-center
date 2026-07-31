'use client'

import { Box } from '@chakra-ui/react'
import { FreshPirepForm } from '@/components/pireps/file/FreshPirepForm'

export default function FilePirepView({
  userId,
  session,
  initialAircraft,
  initialOperators,
  initialMultipliers,
  initialIfatcMultipliers,
}) {
  return (
    <Box p={{ base: 4, md: 4 }} flex="1">
      <Box minH="100vh" bgColor="blackAlpha.200" rounded="md" p={6}>
        <FreshPirepForm
          userId={userId}
          session={session}
          initialAircraft={initialAircraft}
          initialOperators={initialOperators}
          initialMultipliers={initialMultipliers}
          initialIfatcMultipliers={initialIfatcMultipliers}
        />
      </Box>
    </Box>
  )
}
