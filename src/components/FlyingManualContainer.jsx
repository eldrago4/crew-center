'use client'

import { Box } from '@chakra-ui/react'
import { useState, useEffect } from 'react'

export default function FlyingManualContainer() {
    const [ htmlContent, setHtmlContent ] = useState('')
    const [ loading, setLoading ] = useState(true)

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

    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" p={1}>
            <Box
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
