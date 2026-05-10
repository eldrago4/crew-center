export const metadata = {
    title: 'Live Map',
    description: 'Watch Indian Virtual pilots flying live on Infinite Flight. Track real-time flight positions, routes, and active operations across our network.',
    keywords: ['Indian Virtual live map', 'Infinite Flight live tracking', 'virtual airline live flights', 'INVA live', 'Infinite Flight flight tracker'],
    openGraph: {
        title: 'Live Map | Indian Virtual',
        description: 'Track Indian Virtual pilots flying live on Infinite Flight in real time.',
        url: 'https://indianvirtual.site/live',
    },
    alternates: { canonical: 'https://indianvirtual.site/live' },
}

import { Box } from "@chakra-ui/react"

export default function LivePage() {
    return (
        <Box
            mt={{ base: '59px', '705px': '-1px' }}
            h={{ base: 'calc(100dvh - 59px)', '705px': 'calc(100dvh - 3.5em + 1px)' }}
            overflow="hidden"
            bg="black"
        >
            <iframe
                src="https://live.indianvirtual.site/embed"
                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                title="Indian Virtual Live"
                allow="fullscreen"
            />
        </Box>
    )
}
