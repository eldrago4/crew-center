export const metadata = {
    title: 'Briefings',
    description: 'Access Indian Virtual operational briefings, NOTAMs, and announcements for Infinite Flight pilots. Stay updated on active operations and advisories.',
    keywords: ['Indian Virtual briefings', 'INVA NOTAM', 'virtual airline briefings', 'Infinite Flight operations', 'pilot briefing India'],
    openGraph: {
        title: 'Briefings | Indian Virtual',
        description: 'Operational briefings and NOTAMs for Indian Virtual Infinite Flight pilots.',
        url: 'https://indianvirtual.site/briefings',
    },
    alternates: { canonical: 'https://indianvirtual.site/briefings' },
}

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
