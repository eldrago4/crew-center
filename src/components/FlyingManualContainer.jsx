'use client'

import { Box, Button } from '@chakra-ui/react'
import { useState, useEffect, useRef } from 'react'
import { MdFullscreen, MdFullscreenExit } from 'react-icons/md'

export default function FlyingManualContainer() {
    const [ htmlContent, setHtmlContent ] = useState('')
    const [ loading, setLoading ] = useState(true)
    const [ isFullscreen, setIsFullscreen ] = useState(false)
    const containerRef = useRef(null)

    useEffect(() => {
        fetch('https://raw.githubusercontent.com/eldrago4/flying-manual/refs/heads/main/cooked%20manual.html')
            .then(response => response.text())
            .then(data => {
                setHtmlContent(data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching HTML:', error)
                setLoading(false)
            })
    }, [])

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen()
        } else {
            document.exitFullscreen()
        }
    }

    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" p={1}>
            <Box
                ref={containerRef}
                position="relative"
                width="100%"
                maxWidth="95%"
                height="80vh"
                borderRadius="lg"
                border="2px solid gray"
                background="#2d2d2d"
                boxShadow="lg"
                overflow="auto"
                p={4}
            >
                <Button
                    aria-label="Toggle fullscreen"
                    position="absolute"
                    top={2}
                    right={2}
                    zIndex={10}
                    onClick={toggleFullscreen}
                    size="sm"
                    variant="solid"
                    bg="white"
                    color="black"
                    _hover={{ bg: 'gray.200' }}
                >
                    {isFullscreen ? <MdFullscreenExit /> : <MdFullscreen />}
                </Button>
                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <iframe
                        srcDoc={htmlContent}
                        style={{
                            width: '100%',
                            height: '100%',
                            border: 'none',
                            borderRadius: 'inherit'
                        }}
                        title="Flying Manual"
                    />
                )}
            </Box>
        </Box>
    );
}
