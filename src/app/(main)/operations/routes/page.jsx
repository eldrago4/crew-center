export const metadata = {
    title: 'Routes',
    description: 'Browse Indian Virtual\'s full route network on Infinite Flight. Explore domestic and international routes operated by our virtual pilots across India and the world.',
    keywords: ['Indian Virtual routes', 'Infinite Flight routes India', 'virtual airline route map', 'INVA route network', 'domestic international virtual routes'],
    openGraph: {
        title: 'Routes | Indian Virtual',
        description: 'Explore Indian Virtual\'s full domestic and international Infinite Flight route network.',
        url: 'https://indianvirtual.site/operations/routes',
    },
    alternates: { canonical: 'https://indianvirtual.site/operations/routes' },
}

import { Box } from '@chakra-ui/react'

export default function RoutesPage() {
    return (
        <Box
            mt={{ base: '60px', '705px': '0' }}
            h={{ base: 'calc(100dvh - 60px)', '705px': 'calc(100dvh - 3.5em)' }}
            overflow="hidden"
        >
            <iframe
                src="https://1ved.cloud/api"
                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                title="Indian Virtual Routes"
                allow="fullscreen"
            />
        </Box>
    )
}
