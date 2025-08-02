import { Container, Box, Flex, Text, Heading, Stack, Progress, Avatar } from '@chakra-ui/react'

export default function BasicInfo({ ifcName, image, flightTime, rank }) {
  // Parse flight time to hours
  const parseFlightTime = (timeStr) => {
    if (!timeStr) return 0
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours + (minutes / 60)
  }

  // Rank progression data
  const rankData = [
    { name: 'Yuvraj', hours: 0 },
    { name: 'Rajkumar', hours: 80 },
    { name: 'Rajvanshi', hours: 160 },
    { name: 'Rajdhiraj', hours: 450 },
    { name: 'Maharaja', hours: 900 },
    { name: 'Samrat', hours: 1500 },
    { name: 'Chhatrapati', hours: 2000 },
    { name: 'Aakashratha Club', hours: 2500 }
  ]

  const currentHours = parseFlightTime(flightTime)
  const currentRankIndex = rankData.findIndex(r => r.name === rank)
  
  let progress = 0
  let nextRank = null
  let remainingHours = 0
  
  if (currentRankIndex !== -1 && currentRankIndex < rankData.length - 1) {
    const currentRankData = rankData[currentRankIndex]
    nextRank = rankData[currentRankIndex + 1]
    const progressRange = nextRank.hours - currentRankData.hours
    const progressMade = currentHours - currentRankData.hours
    progress = Math.min((progressMade / progressRange) * 100, 100)
    remainingHours = Math.max(nextRank.hours - currentHours, 0)
  }

  return (
    <Container maxW="100%" py="8" px="4">
      <Box
        bg="whiteAlpha.200"
        backdropFilter="auto"
        backdropBlur="8px"
        borderWidth="1px"
        borderColor="whiteAlpha.300"
        rounded="xl"
        p="8"
        shadow="sm"
        w="100%"
      >
        <Stack spacing="8">
          {/* User Profile Header */}
          <Flex gap="4" align="flex-start" justify="space-between">
            <Stack spacing="3" flex="none">
              <Heading size="xl" color="fg" fontWeight="bold">
                {ifcName}
              </Heading>
              
              <Stack spacing="2">
                <Text color="fg" fontSize="md" fontWeight="semibold" opacity={0.8}>
                  Rank
                </Text>
                <Text color="fg" fontSize="lg" fontWeight="bold">
                  {rank}
                </Text>
              </Stack>

              <Stack spacing="2">
                <Text color="fg" fontSize="md" fontWeight="semibold" opacity={0.8}>
                  Flight Time
                </Text>
                <Text color="fg" fontSize="lg" fontWeight="bold">
                  {flightTime}
                </Text>
              </Stack>
            </Stack>
            
            <Box 
              width="100px" 
              height="100px" 
              rounded="md" 
              overflow="hidden"
              flexShrink="0"
              border="2px solid"
              borderColor="whiteAlpha.300"
            >
              <Avatar.Root 
                width="100%" 
                height="100%"
                rounded="md"
              >
                <Avatar.Image 
                  src={image} 
                  alt={ifcName}
                  width="100%"
                  height="100%"
                  objectFit="cover"
                />
                <Avatar.Fallback
                  width="100%"
                  height="100%"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="2xl"
                  fontWeight="bold"
                >
                  {ifcName?.charAt(0)}
                </Avatar.Fallback>
              </Avatar.Root>
            </Box>
          </Flex>

          <Box h="1px" bg="whiteAlpha.300" />

          {/* User Details */}
          <Stack spacing="6">
            {nextRank && (
              <Stack spacing="3">
                <Flex justify="space-between" align="center">
                  <Text color="fg" fontSize="xs" fontWeight="semibold" opacity={0.8}>
                    Progress to {nextRank.name}
                  </Text>
                  <Text color="fg" fontSize="sm" fontWeight="medium">
                    {remainingHours.toFixed(2)}h remaining
                  </Text>
                </Flex>
                <Progress.Root 
                  value={progress} 
                  colorPalette="purple" 
                  variant="subtle"
                  size="md"
                  rounded="full"
                >
                  <Progress.Track>
                    <Progress.Range />
                  </Progress.Track>
                </Progress.Root>
              </Stack>
            )}
          </Stack>
        </Stack>
      </Box>
    </Container>
  )
}
