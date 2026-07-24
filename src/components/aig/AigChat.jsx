'use client'

import * as React from 'react'
import NextImage from 'next/image'
import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import {
  Box,
  Code,
  Dialog,
  Flex,
  HStack,
  IconButton,
  Link,
  Portal,
  Text,
  Textarea,
  VStack,
  useBreakpointValue,
} from '@chakra-ui/react'
import { LuArrowUp, LuX } from 'react-icons/lu'
import { DiscordAvatar } from '@/components/DiscordAvatar'
import styles from './AigChat.module.css'

// The AI.g dotLottie sprite (browser-only WASM renderer) — reuse the one the
// /crew/routes recommender already ships and self-hosts.
const AigLottie = dynamic(() => import('@/app/(crew)/crew/routes/AigLottie'), { ssr: false })

const AIG_LOGO = '/fonts/Aig.png'
const GREETING =
  "Hi! I'm AI.g, your Air India Virtual assistant. Ask me about flying procedures, ATC, our routes, or anything Infinite Flight."

// Same playful loading lines the routes recommender uses.
const LOADING_PHRASES = [
  'Spooling engines...',
  'Punching through clouds...',
  'Chasing tailwinds...',
  'Lining up...',
  'Floating...',
  'Finding FL690...',
  'Tiny turbulence...',
  'Blaming ATC...',
  'Somebody forgot the paperwork...',
  'Autopilot\'s got this...',
]

function nextRandomPhrase(cur) {
  if (LOADING_PHRASES.length < 2) return 0
  let n = cur
  while (n === cur) n = Math.floor(Math.random() * LOADING_PHRASES.length)
  return n
}

// Square AI.g avatar: the wide wordmark contained inside a rounded square chip
// so it never gets cropped. Used for the bot's messages and the header.
function AigMark({ size = 30 }) {
  return (
    <Box
      boxSize={`${size}px`}
      borderRadius="lg"
      overflow="hidden"
      flexShrink={0}
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg={{ base: 'white', _dark: 'gray.700' }}
      borderWidth="1px"
      borderColor={{ base: 'gray.200', _dark: 'gray.600' }}
      p="1"
    >
      <NextImage
        src={AIG_LOGO}
        alt="AI.g"
        width={294}
        height={129}
        style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
      />
    </Box>
  )
}

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
        <AigMark size={30} />
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

  const isDesktop = useBreakpointValue({ base: false, md: true })

  const [open, setOpen] = React.useState(false)
  const [messages, setMessages] = React.useState([
    { role: 'assistant', content: GREETING, intro: true },
  ])
  const [input, setInput] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [phraseIdx, setPhraseIdx] = React.useState(0)

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

  // Rotate the playful loading phrase while we wait for the first token.
  React.useEffect(() => {
    if (!loading) return
    setPhraseIdx(nextRandomPhrase(-1))
    const id = setInterval(() => setPhraseIdx((cur) => nextRandomPhrase(cur)), 2500)
    return () => clearInterval(id)
  }, [loading])

  const send = React.useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    // Forward the recent conversation (minus the canned greeting and any error
    // notices) so the API has multi-turn context.
    const history = messages
      .filter((m) => (m.role === 'user' || m.role === 'assistant') && !m.intro)
      .map((m) => ({ role: m.role, content: m.content }))
    const outgoing = [...history, { role: 'user', content: text }].slice(-10)

    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setInput('')
    setLoading(true)

    const updateStreaming = (content) =>
      setMessages((prev) => {
        const copy = prev.slice()
        const last = copy[copy.length - 1]
        if (last && last.role === 'assistant' && last.streaming) {
          copy[copy.length - 1] = { ...last, content }
        }
        return copy
      })

    try {
      const res = await fetch('/api/aig/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: outgoing }),
      })

      // Errors come back as JSON; a successful answer is a streamed text body.
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}))
        setMessages((prev) => [
          ...prev,
          { role: 'error', content: data?.error || 'Something went wrong. Please try again.' },
        ])
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      let started = false

      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        if (!chunk) continue
        acc += chunk
        if (!started) {
          started = true
          setLoading(false)
          setMessages((prev) => [...prev, { role: 'assistant', content: acc, streaming: true }])
        } else {
          updateStreaming(acc)
        }
      }

      const finalText =
        acc.trim() || "I couldn't find anything on that in the manuals or guides. Try rephrasing?"
      if (started) {
        setMessages((prev) => {
          const copy = prev.slice()
          const last = copy[copy.length - 1]
          if (last && last.role === 'assistant' && last.streaming) {
            copy[copy.length - 1] = { ...last, content: finalText, streaming: false }
          }
          return copy
        })
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: finalText }])
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
          rounded="12px"
          p="0"
          minW="auto"
          h="auto"
          _hover={{ bg: 'transparent' }}
          _active={{ bg: 'transparent' }}
        >
          {/* Wide wordmark (294×129) kept in a rectangle, wrapped in a golden
              revolving-shimmer border (see AigChat.module.css). */}
          <span className={styles.ring}>
            <span className={styles.inner}>
              <NextImage
                src={AIG_LOGO}
                alt="AI.g"
                width={78}
                height={34}
                style={{ objectFit: 'contain', display: 'block' }}
              />
            </span>
          </span>
        </IconButton>
      </Dialog.Trigger>

      <Portal>
        {/* Mobile: dim + blur behind the full-screen sheet. Desktop: transparent
            backdrop so it reads as a dropdown (outside-click still closes it). */}
        <Dialog.Backdrop
          bg={{ base: 'blackAlpha.500', md: 'transparent' }}
          backdropFilter={{ base: 'blur(2px)', md: 'none' }}
        />
        <Dialog.Positioner>
          {/* Desktop: pin the content itself top-right, just below the 60px
              navbar, so it reads as a dropdown and never centers/clips. Mobile
              keeps the size="full" sheet. */}
          <Dialog.Content
            display="flex"
            flexDirection="column"
            overflow="hidden"
            bg={{ base: 'white', _dark: 'gray.800' }}
            borderWidth={{ md: '1px' }}
            borderColor={{ base: 'transparent', _dark: 'gray.700' }}
            boxShadow={{ md: '2xl' }}
            /* Inline style wins over Chakra's placement/size recipe: on desktop
               pin it top-right under the 60px navbar (never centers/clips);
               mobile falls back to the size="full" sheet. */
            style={
              isDesktop
                ? {
                    position: 'fixed',
                    top: '64px',
                    right: '12px',
                    left: 'auto',
                    bottom: 'auto',
                    width: '380px',
                    maxWidth: '380px',
                    height: 'min(600px, calc(100dvh - 84px))',
                    maxHeight: 'calc(100dvh - 84px)',
                    borderRadius: '14px',
                  }
                : undefined
            }
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
              <AigMark size={38} />
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
                    {/* AI.g dotLottie sprite on a dark chip (the sprite is
                        white+gold on transparent) — same footprint as the chat
                        avatar, inline with a rotating loading phrase. */}
                    <Box
                      boxSize="30px"
                      borderRadius="lg"
                      overflow="hidden"
                      flexShrink={0}
                      bg="#0b1020"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <AigLottie />
                    </Box>
                    <Text
                      fontSize="sm"
                      fontFamily="mono"
                      color={{ base: 'gray.500', _dark: 'gray.400' }}
                    >
                      {LOADING_PHRASES[phraseIdx]}
                    </Text>
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
