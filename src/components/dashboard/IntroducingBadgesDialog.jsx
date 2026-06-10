'use client'

import { Dialog, Box, Heading, Text, Button, IconButton } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { FiX } from 'react-icons/fi'

// Shows the "Introducing Badges" announcement once per browser.
// The flag is written the moment it opens (first view), so it never reappears
// even if the user dismisses by clicking outside or reloading mid-view.
const SEEN_KEY = 'introducingBadgesSeen'

const HERO_SRC =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCS-ex17mcLCffF6Xsz8Mw16p2e523U3vaVCxIcOF2TuKMUwOsmDSPcLhjThy7NvTfTcqX4-zVlhhwx408R_RyozELZ9wB4OMF_Y5JA4SDfh5t7AhC4hew4Fm-GcSAAabIJIzTxyctvrpfVdgRdI98Kot-CvDiH4aYJbxUNiaLYZ1aATjpDdaUoztN-_OXMitHFQEq6PVGxpC3Kn7ofSpL4qUo6d6KlxalCnoxI_4l4-pwtOsZFfL33MDqyLj6AEe1SItPOo3gwkAY'

const GOLD = '#e9c349'

export default function IntroducingBadgesDialog() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (!localStorage.getItem(SEEN_KEY)) {
        setOpen(true)
        localStorage.setItem(SEEN_KEY, '1')
      }
    } catch {
      // localStorage unavailable (private mode / blocked) — just skip.
    }
  }, [])

  const handleClose = () => setOpen(false)

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => setOpen(details.open)}
      size="xl"
      placement="center"
      closeOnEscape
      closeOnInteractOutside
      motionPreset="scale"
    >
      <Dialog.Backdrop
        style={{
          background: 'rgba(18,20,22,0.8)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      />
      <Dialog.Positioner p={{ base: 4, sm: 6 }}>
        <Dialog.Content
          position="relative"
          maxW="2xl"
          w="100%"
          p="0"
          display="flex"
          flexDirection="column"
          borderRadius="xl"
          overflow="hidden"
          bg="#1e2022"
          borderWidth="1px"
          borderColor="rgba(233,195,73,0.2)"
          boxShadow="0 20px 50px rgba(0,0,0,0.5)"
        >
          {/* Close button (top-right) */}
          <Dialog.CloseTrigger asChild>
            <IconButton
              aria-label="Close"
              onClick={handleClose}
              position="absolute"
              top="4"
              right="4"
              zIndex="10"
              boxSize="8"
              minW="8"
              borderRadius="full"
              borderWidth="1px"
              borderColor="rgba(255,255,255,0.1)"
              color="#c4c6d0"
              bg="rgba(18,20,22,0.5)"
              _hover={{ color: 'white', bg: '#333537' }}
              style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
            >
              <FiX size={20} />
            </IconButton>
          </Dialog.CloseTrigger>

          {/* Hero image — bleeds to the card edges */}
          <Box position="relative" w="100%" h={{ base: '240px', sm: '288px' }} bg="#333537" flexShrink={0}>
            <Box
              as="img"
              src={HERO_SRC}
              alt="Introducing Badges"
              w="100%"
              h="100%"
              loading="lazy"
              decoding="async"
              style={{ objectFit: 'cover', objectPosition: 'top' }}
            />
            {/* Blend the image into the card */}
            <Box
              position="absolute"
              inset="0"
              pointerEvents="none"
              style={{
                background:
                  'linear-gradient(to top, #1e2022 0%, rgba(30,32,34,0.2) 50%, transparent 100%)',
              }}
            />
          </Box>

          {/* Content */}
          <Dialog.Body px="8" pt="2" pb="8" display="flex" flexDirection="column" alignItems="center" textAlign="center" gap="6">
            <Box display="flex" flexDirection="column" gap="3">
              <Dialog.Title asChild>
                <Heading
                  as="h2"
                  color={GOLD}
                  fontWeight="800"
                  letterSpacing="-0.02em"
                  lineHeight="1.1"
                  fontSize={{ base: '24px', sm: '48px' }}
                  fontFamily="'Montserrat', sans-serif"
                >
                  Introducing Badges
                </Heading>
              </Dialog.Title>
              <Text
                color="#c4c6d0"
                fontSize="18px"
                lineHeight="28px"
                fontFamily="'Hanken Grotesk', sans-serif"
              >
                Elevate your status on the flight deck. You can now earn exclusive badges by hitting
                flight milestones, advancing through the ranks, and participating in events. The exact
                requirements for each award remain classified—it&apos;s up to you to discover how to
                earn them.
              </Text>
            </Box>

            <Button
              onClick={handleClose}
              mt="4"
              px="8"
              py="2"
              h="auto"
              variant="outline"
              borderRadius="full"
              borderColor="rgba(233,195,73,0.3)"
              color={GOLD}
              bg="transparent"
              textTransform="uppercase"
              letterSpacing="0.1em"
              fontSize="12px"
              fontWeight="600"
              fontFamily="'JetBrains Mono', monospace"
              _hover={{ bg: 'rgba(233,195,73,0.1)' }}
            >
              Close
            </Button>
          </Dialog.Body>

          {/* Decorative bottom line */}
          <Box
            position="absolute"
            bottom="0"
            left="0"
            w="100%"
            h="1px"
            pointerEvents="none"
            style={{
              background: 'linear-gradient(to right, transparent, rgba(233,195,73,0.5), transparent)',
            }}
          />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
}
