'use client'

import * as React from 'react'
import NextImage from 'next/image'
import { useSession } from 'next-auth/react'
import {
  Avatar,
  Box,
  Code,
  Dialog,
  Flex,
  HStack,
  IconButton,
  Link,
  Portal,
  Spinner,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react'
import { LuArrowUp, LuX } from 'react-icons/lu'
import { DiscordAvatar } from '@/components/DiscordAvatar'

const AIG_LOGO = '/fonts/Aig.png'
const GREETING =
  "Hi! I'm AI.g, your Air India Virtual assistant. Ask me about flying procedures, ATC, our routes, or anything Infinite Flight."

// ── Minimal, dependency-free markdown → JSX ─────────────────────────────────
// The AI Search answers come back as light markdown (bold, italics, links,
// bullet/numbered lists). We render just those so replies read cleanly without
// pulling in a markdown library.
function parseInline(text) {
  const nodes = []
  const re =
    /\*\*(.+?)\*\*|__(.+?)__|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((https?:\/\/[^)\s]+)\)/g
  let last = 0
  let key = 0
  let m
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    if (m[1] !== undefined) nodes.push(<b key={key++}>{m[1]}</b>)
    else if (m[2] !== undefined) nodes.push(<b key={key++}>{m[2]}</b>)
    else if (m[3] !== undefined) nodes.push(<i key={key++}>{m[3]}</i>)
    else if (m[4] !== undefined)
      nodes.push(
        <Code key={key++} fontSize="0.85em" px="1" py="0.5" borderRadius="sm">
          {m[4]}
        </Code>,
      )
    else if (m[5] !== undefined)
      nodes.push(
        <Link
          key={key++}
          href={m[6]}
          target="_blank"
          rel="noreferrer"
          color={{ base: 'red.600', _dark: 'red.300' }}
          textDecoration="underline"
        >
          {m[5]}
        </Link>,
      )
    last = re.lastIndex
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

function Markdown({ text }) {
  const lines = String(text).split('\n')
  const blocks = []
  let list = null
  let listOrdered = false

  const flushList = () => {
    if (list && list.length) {
      blocks.push(
        <Box
          as={listOrdered ? 'ol' : 'ul'}
          key={`l${blocks.length}`}
          pl="5"
          my="1.5"
          display="flex"
          flexDirection="column"
          gap="1"
        >
          {list}
        </Box>,
      )
    }
    list = null
  }

  lines.forEach((line, i) => {
    const bullet = line.match(/^\s*[-*]\s+(.*)/)
    const numbered = line.match(/^\s*\d+\.\s+(.*)/)
    if (bullet || numbered) {
      const ordered = Boolean(numbered)
      if (!list || listOrdered !== ordered) {
        flushList()
        list = []
        listOrdered = ordered
      }
      list.push(
        <Box as="li" key={i} lineHeight="1.55">
          {parseInline((bullet || numbered)[1])}
        </Box>,
      )
    } else if (line.trim() === '') {
      flushList()
    } else {
      flushList()
      blocks.push(
        <Text key={i} lineHeight="1.55" whiteSpace="pre-wrap">
          {parseInline(line)}
        </Text>,
      )
    }
  })
  flushList()
  return (
    <VStack align="stretch" gap="1.5">
      {blocks}
    </VStack>
  )
}

// ── Message bubble ──────────────────────────────────────────────────────────
function MessageRow({ msg, discordId }) {
  const isUser = msg.role === 'user'
  const isError = msg.role === 'error'

  const AigAvatar = (
    <Box
      boxSize="30px"
      borderRadius="full"
      overflow="hidden"
      flexShrink={0}
      bg={{ base: 'white', _dark: 'gray.700' }}
      borderWidth="1px"
      borderColor={{ base: 'gray.200', _dark: 'gray.600' }}
    >
      <NextImage src={AIG_LOGO} alt="AI.g" width={30} height={30} style={{ objectFit: 'cover' }} />
    </Box>
  )

  return (
    <HStack
      align="flex-start"
      gap="2.5"
      flexDirection={isUser ? 'row-reverse' : 'row'}
      w="100%"
    >
      {isUser ? (
        <DiscordAvatar userId={discordId} size="xs" flexShrink={0} />
      ) : (
        AigAvatar
      )}
      <Box
        maxW="82%"
        px="3.5"
        py="2.5"
        borderRadius="xl"
        borderTopRightRadius={isUser ? 'sm' : 'xl'}
        borderTopLeftRadius={isUser ? 'xl' : 'sm'}
        fontSize="sm"
        bg={
          isUser
            ? { base: 'red.600', _dark: 'red.500' }
            : isError
              ? { base: 'red.50', _dark: 'red.950' }
              : { base: 'gray.100', _dark: 'gray.700' }
        }
        color={
          isUser
            ? 'white'
            : isError
              ? { base: 'red.700', _dark: 'red.200' }
              : { base: 'gray.800', _dark: 'gray.100' }
        }
        borderWidth={isError ? '1px' : '0'}
        borderColor={{ base: 'red.200', _dark: 'red.800' }}
        boxShadow="sm"
      >
        {isUser ? (
          <Text whiteSpace="pre-wrap" lineHeight="1.55">
            {msg.content}
          </Text>
        ) : (
          <Markdown text={msg.content} />
        )}

        {!isUser && msg.sources && msg.sources.length > 0 && (
          <Flex mt="2.5" gap="1.5" wrap="wrap">
            {msg.sources.map((s, i) =>
              s.url ? (
                <Link
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  fontSize="xs"
                  px="2"
                  py="0.5"
                  borderRadius="full"
                  bg={{ base: 'white', _dark: 'gray.800' }}
                  borderWidth="1px"
                  borderColor={{ base: 'gray.200', _dark: 'gray.600' }}
                  color={{ base: 'gray.600', _dark: 'gray.300' }}
                  _hover={{ borderColor: { base: 'red.400', _dark: 'red.400' } }}
                  maxW="200px"
                  truncate
                >
                  {s.label}
                </Link>
              ) : (
                <Box
                  key={i}
                  fontSize="xs"
                  px="2"
                  py="0.5"
                  borderRadius="full"
                  bg={{ base: 'white', _dark: 'gray.800' }}
                  borderWidth="1px"
                  borderColor={{ base: 'gray.200', _dark: 'gray.600' }}
                  color={{ base: 'gray.600', _dark: 'gray.300' }}
                  maxW="200px"
                  truncate
                >
                  {s.label}
                </Box>
              ),
            )}
          </Flex>
        )}
      </Box>
    </HStack>
  )
}

// ── Main widget: trigger button in the nav + the chat dialog ────────────────
export default function AigChat() {
  const { data: session } = useSession()
  const discordId = session?.user?.discordId

  const [open, setOpen] = React.useState(false)
  const [messages, setMessages] = React.useState([
    { role: 'assistant', content: GREETING, intro: true },
  ])
  const [input, setInput] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const scrollRef = React.useRef(null)
  const inputRef = React.useRef(null)

  React.useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, loading])

  React.useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 120)
      return () => clearTimeout(t)
    }
  }, [open])

  const send = React.useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    // Forward the recent conversation (minus the canned greeting and any error
    // notices) so the chat API has multi-turn context.
    const history = messages
      .filter((m) => (m.role === 'user' || m.role === 'assistant') && !m.intro)
      .map((m) => ({ role: m.role, content: m.content }))
    const outgoing = [...history, { role: 'user', content: text }].slice(-10)

    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/aig/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: outgoing }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: 'error', content: data?.error || 'Something went wrong. Please try again.' },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.answer, sources: data.sources || [] },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'error', content: "I couldn't reach the server. Check your connection and try again." },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 60)
    }
  }, [input, loading, messages])

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => setOpen(e.open)}
      size={{ base: 'full', md: 'md' }}
      placement="center"
      motionPreset="slide-in-top"
      scrollBehavior="inside"
    >
      <Dialog.Trigger asChild>
        <IconButton
          aria-label="Open AI.g assistant"
          variant="ghost"
          rounded="full"
          p="0"
          minW="auto"
          h="auto"
          _hover={{ bg: 'transparent', transform: 'scale(1.06)' }}
          transition="transform 0.15s ease"
        >
          {/* As large as the 60px navbar allows — the negative vertical margin
              lets it bleed through the bar's padding so it reads big. */}
          <Box
            boxSize="52px"
            borderRadius="full"
            overflow="hidden"
            display="inline-flex"
            my="-8px"
          >
            <NextImage src={AIG_LOGO} alt="AI.g" width={52} height={52} style={{ objectFit: 'cover' }} />
          </Box>
        </IconButton>
      </Dialog.Trigger>

      <Portal>
        {/* Mobile: dim + blur behind the full-screen sheet. Desktop: transparent
            backdrop so it reads as a dropdown (outside-click still closes it). */}
        <Dialog.Backdrop
          bg={{ base: 'blackAlpha.500', md: 'transparent' }}
          backdropFilter={{ base: 'blur(2px)', md: 'none' }}
        />
        {/* Desktop: anchor top-right, just below the 60px navbar, like a dropdown. */}
        <Dialog.Positioner
          alignItems={{ base: 'stretch', md: 'flex-start' }}
          justifyContent={{ base: 'stretch', md: 'flex-end' }}
          pt={{ md: '68px' }}
          pr={{ md: '12px' }}
        >
          <Dialog.Content
            display="flex"
            flexDirection="column"
            overflow="hidden"
            bg={{ base: 'white', _dark: 'gray.800' }}
            w={{ md: '380px' }}
            maxW={{ md: '380px' }}
            h={{ base: '100dvh', md: 'min(600px, calc(100dvh - 88px))' }}
            maxH={{ base: '100dvh', md: 'calc(100dvh - 88px)' }}
            borderRadius={{ base: '0', md: 'xl' }}
            borderWidth={{ md: '1px' }}
            borderColor={{ base: 'transparent', _dark: 'gray.700' }}
            boxShadow={{ md: '2xl' }}
          >
            {/* Header */}
            <Flex
              align="center"
              gap="3"
              px="4"
              py="3"
              borderBottomWidth="1px"
              borderColor={{ base: 'gray.200', _dark: 'gray.700' }}
              bg={{ base: 'red.50', _dark: 'whiteAlpha.100' }}
              flexShrink={0}
            >
              <Box
                boxSize="36px"
                borderRadius="full"
                overflow="hidden"
                borderWidth="1px"
                borderColor={{ base: 'gray.200', _dark: 'gray.600' }}
              >
                <NextImage src={AIG_LOGO} alt="AI.g" width={36} height={36} style={{ objectFit: 'cover' }} />
              </Box>
              <Box flex="1" minW="0">
                <HStack gap="2" align="center">
                  <Text fontWeight="semibold" fontSize="md" color={{ base: 'gray.800', _dark: 'white' }}>
                    AI.g
                  </Text>
                  <Box boxSize="7px" borderRadius="full" bg="green.400" />
                </HStack>
                <Text fontSize="xs" color={{ base: 'gray.500', _dark: 'gray.400' }} truncate>
                  Air India Virtual assistant
                </Text>
              </Box>
              <Dialog.CloseTrigger asChild>
                <IconButton aria-label="Close" variant="ghost" size="sm" rounded="full">
                  <LuX />
                </IconButton>
              </Dialog.CloseTrigger>
            </Flex>

            {/* Messages */}
            <Box ref={scrollRef} flex="1" overflowY="auto" px="4" py="4">
              <VStack align="stretch" gap="4">
                {messages.map((m, i) => (
                  <MessageRow key={i} msg={m} discordId={discordId} />
                ))}
                {loading && (
                  <HStack align="center" gap="2.5">
                    <Box
                      boxSize="30px"
                      borderRadius="full"
                      overflow="hidden"
                      flexShrink={0}
                      bg={{ base: 'white', _dark: 'gray.700' }}
                      borderWidth="1px"
                      borderColor={{ base: 'gray.200', _dark: 'gray.600' }}
                    >
                      <NextImage src={AIG_LOGO} alt="AI.g" width={30} height={30} style={{ objectFit: 'cover' }} />
                    </Box>
                    <HStack
                      gap="2"
                      px="3.5"
                      py="3"
                      borderRadius="xl"
                      bg={{ base: 'gray.100', _dark: 'gray.700' }}
                    >
                      <Spinner size="xs" color={{ base: 'red.500', _dark: 'red.300' }} />
                      <Text fontSize="sm" color={{ base: 'gray.500', _dark: 'gray.400' }}>
                        AI.g is thinking…
                      </Text>
                    </HStack>
                  </HStack>
                )}
              </VStack>
            </Box>

            {/* Composer */}
            <Box
              px="3"
              py="3"
              borderTopWidth="1px"
              borderColor={{ base: 'gray.200', _dark: 'gray.700' }}
              flexShrink={0}
            >
              <Flex
                align="flex-end"
                gap="2"
                bg={{ base: 'gray.100', _dark: 'gray.900' }}
                borderRadius="2xl"
                px="3"
                py="1.5"
                borderWidth="1px"
                borderColor={{ base: 'gray.200', _dark: 'gray.700' }}
                _focusWithin={{ borderColor: { base: 'red.400', _dark: 'red.400' } }}
              >
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Ask AI.g anything…"
                  rows={1}
                  maxLength={1000}
                  resize="none"
                  border="none"
                  outline="none"
                  minH="24px"
                  maxH="120px"
                  px="0"
                  py="1.5"
                  fontSize="sm"
                  bg="transparent"
                  _focus={{ boxShadow: 'none' }}
                  flex="1"
                />
                <IconButton
                  aria-label="Send message"
                  onClick={send}
                  disabled={!input.trim() || loading}
                  size="sm"
                  rounded="full"
                  colorPalette="red"
                  flexShrink={0}
                >
                  <LuArrowUp />
                </IconButton>
              </Flex>
              <Text fontSize="10px" color={{ base: 'gray.400', _dark: 'gray.500' }} textAlign="center" mt="1.5">
                AI.g can make mistakes. Verify critical procedures with the manuals.
              </Text>
            </Box>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
