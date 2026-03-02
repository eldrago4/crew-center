import { Box, Text } from '@chakra-ui/react'

export default function BriefingsPage() {
    return (
        <Box minH="80vh" display="flex" alignItems="center" justifyContent="center">
            <Text color="gray.500" fontSize="lg" fontWeight="medium">
                No upcoming public events
            </Text>
        </Box>
    )
}
