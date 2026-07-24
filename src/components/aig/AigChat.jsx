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
} from '@chakra-ui/react'
import { LuArrowUp, LuX } from 'react-icons/lu'
import { DiscordAvatar } from '@/components/DiscordAvatar'
import styles from './AigChat.module.css'

// The AI.g dotLottie sprite (browser-only WASM renderer) — reuse the one the
// /crew/routes recommender already ships and self-hosts.
const AigLottie = dynamic(() => import('@/app/(crew)/crew/routes/AigLottie'), { ssr: false })

const AIG_LOGO = '/fonts/Aig.png'
// Navbar trigger emblem — two art variants tuned per background: the darker one
// for light mode (contrast on white), the brighter one for dark mode (pops on
// gray.800). Swapped in pure CSS below via Chakra's _dark condition.
const AIG_ICON_LIGHT = '/aig-icon-light.png'
const AIG_ICON_DARK = '/aig-icon-dark.png'
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

  const [open, setOpen] = React.useState(false)
  const [messages, setMessages] = React.useState([
    { role: 'assistant', content: GREETING, intro: true },
  ])
  const [input, setInput] = React.useState('')
  const [loading, setLoading] = React.useState(false) // waiting on the server (shows the lottie)
  const [busy, setBusy] = React.useState(false) // whole turn incl. typewriter reveal (locks the composer)
  const [phraseIdx, setPhraseIdx] = React.useState(0)

  const scrollRef = React.useRef(null)
  const inputRef = React.useRef(null)
  const revealTimer = React.useRef(null)

  React.useEffect(() => () => clearTimeout(revealTimer.current), [])

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

  // Reveal the full answer word-by-word (a typewriter "stream"). True server
  // streaming hangs under OpenNext on Workers, so we stream the reveal client
  // side instead. Long answers still finish in ~3s (revealed in <=120 ticks).
  const revealAnswer = React.useCallback((full) => {
    return new Promise((resolve) => {
      const tokens = full.match(/\S+\s*/g) || (full ? [full] : [])
      if (tokens.length === 0) {
        resolve()
        return
      }
      const perTick = Math.max(1, Math.ceil(tokens.length / 120))
      setMessages((prev) => [...prev, { role: 'assistant', content: '', streaming: true }])
      let i = 0
      const step = () => {
        i = Math.min(tokens.length, i + perTick)
        const content = tokens.slice(0, i).join('')
        setMessages((prev) => {
          const copy = prev.slice()
          const last = copy[copy.length - 1]
          if (last && last.role === 'assistant' && last.streaming) {
            copy[copy.length - 1] = { ...last, content }
          }
          return copy
        })
        if (i < tokens.length) {
          revealTimer.current = setTimeout(step, 25)
        } else {
          setMessages((prev) => {
            const copy = prev.slice()
            const last = copy[copy.length - 1]
            if (last && last.role === 'assistant' && last.streaming) {
              copy[copy.length - 1] = { ...last, streaming: false }
            }
            return copy
          })
          resolve()
        }
      }
      step()
    })
  }, [])

  const send = React.useCallback(async () => {
    const text = input.trim()
    if (!text || busy) return

    // Forward the recent conversation (minus the canned greeting and any error
    // notices) so the API has multi-turn context.
    const history = messages
      .filter((m) => (m.role === 'user' || m.role === 'assistant') && !m.intro)
      .map((m) => ({ role: m.role, content: m.content }))
    const outgoing = [...history, { role: 'user', content: text }].slice(-10)

    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setInput('')
    setBusy(true)
    setLoading(true)

    try {
      const res = await fetch('/api/aig/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: outgoing }),
      })
      const data = await res.json().catch(() => ({}))
      setLoading(false)

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: 'error', content: data?.error || 'Something went wrong. Please try again.' },
        ])
        return
      }

      await revealAnswer(
        (data.answer || '').trim() ||
          "I couldn't find anything on that in the manuals or guides. Try rephrasing?",
      )
    } catch {
      setLoading(false)
      setMessages((prev) => [
        ...prev,
        { role: 'error', content: "I couldn't reach the server. Check your connection and try again." },
      ])
    } finally {
      setBusy(false)
      setTimeout(() => inputRef.current?.focus(), 60)
    }
  }, [input, busy, messages, revealAnswer])

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
          size="sm"
        >
          {/* Brand emblem, matched to the theme toggle's footprint (ghost sm,
              ~20px glyph). No border, no hover lift — reads as a plain nav icon.
              Light/dark art is swapped in pure CSS (Chakra's _dark condition maps
              to html.dark) so there's no hydration flash and no JS on the path. */}
          <Box display={{ base: 'inline-flex', _dark: 'none' }}>
            <NextImage
              src={AIG_ICON_LIGHT}
              alt=""
              aria-hidden
              width={20}
              height={20}
              style={{ width: '20px', height: '20px', objectFit: 'contain', display: 'block' }}
              priority
            />
          </Box>
          <Box display={{ base: 'none', _dark: 'inline-flex' }}>
            <NextImage
              src={AIG_ICON_DARK}
              alt=""
              aria-hidden
              width={20}
              height={20}
              style={{ width: '20px', height: '20px', objectFit: 'contain', display: 'block' }}
              priority
            />
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
        <Dialog.Positioner>
          {/* Desktop: pin the content itself top-right, just below the 60px
              navbar, so it reads as a dropdown and never centers/clips. Mobile
              keeps the size="full" sheet. */}
          <Dialog.Content
            className={styles.desktopPanel}
            display="flex"
            flexDirection="column"
            overflow="hidden"
            bg={{ base: 'white', _dark: 'gray.800' }}
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
                  disabled={!input.trim() || busy}
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
