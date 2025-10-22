'use client'

import { useState, useEffect } from 'react'
import { Button, Link, HStack, Text } from '@chakra-ui/react'

export default function SignupOrFileButton({ pushbackIso, flightNumber = '', departureIcao = '', arrivalIcao = '', aircraft = '', signupUrl }) {
    const [ now, setNow ] = useState(() => new Date())

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 30 * 1000) // update every 30s
        return () => clearInterval(t)
    }, [])

    let pushbackDate = null
    try {
        pushbackDate = new Date(pushbackIso)
    } catch (e) {
        pushbackDate = null
    }

    const fileAfterMs = 30 * 60 * 1000 // 30 minutes
    const showFile = pushbackDate ? now.getTime() >= (pushbackDate.getTime() + fileAfterMs) : false

    const fileUrl = `/crew/pireps/file?flightNumber=${encodeURIComponent(flightNumber || '')}&departureIcao=${encodeURIComponent(departureIcao || '')}&arrivalIcao=${encodeURIComponent(arrivalIcao || '')}&aircraft=${encodeURIComponent(aircraft || '')}`

    return (
        <HStack spacing={4} align="center">
            {/* Multiplier visual kept in parent if desired; this component only renders CTA */}
            {!showFile ? (
                <Button as={Link} href={signupUrl} isExternal colorPalette="yellow" variant="surface" size="md" rounded="full">
                    Sign Up
                </Button>
            ) : (
                <Button as={Link} href={fileUrl} colorPalette="green" variant="solid" size="md" rounded="full">
                    File Pirep
                </Button>
            )}
        </HStack>
    )
}
