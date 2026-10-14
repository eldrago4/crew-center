export const metadata = {
    title: 'Live Map',
    description: 'Watch Indian Virtual pilots flying live on Infinite Flight. Track real-time flight positions, routes, and active operations across our network.',
    keywords: ['Indian Virtual live map', 'Infinite Flight live tracking', 'virtual airline live flights', 'INVA live', 'Infinite Flight flight tracker'],
    openGraph: {
        title: 'Live Map | Indian Virtual',
        description: 'Track Indian Virtual pilots flying live on Infinite Flight in real time.',
        url: 'https://indianvirtual.com/live',
    },
    alternates: { canonical: 'https://indianvirtual.com/live' },
}

import { Box } from "@chakra-ui/react"

export default function LivePage() {
    return (
        // The mobile navbar is fixed (needs the 59px offset), the desktop one is sticky
        // and in flow (needs none). '705px' isn't a theme breakpoint, so a responsive
        // object silently drops it and the 59px gap showed on desktop too — use the
        // same raw width NavBar's hideFrom/hideBelow switch on.
        <Box
            css={{ marginTop: '59px', '@media screen and (min-width: 705px)': { marginTop: '-1px' } }}
            w="100%"
            minW={0}
            overflowX="hidden"
            bg="black"
        >
            <iframe
                src="https://live.indianvirtual.com/"
                style={{ width: '100%', height: '700px', border: 'none', display: 'block' }}
                title="Indian Virtual Live"
                allow="fullscreen"
                loading="lazy"
            />
        </Box>
    )
}
