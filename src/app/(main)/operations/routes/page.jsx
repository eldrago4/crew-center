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
