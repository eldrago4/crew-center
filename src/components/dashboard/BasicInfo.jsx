"use client";

import { Container, Box, Flex, Text, Heading, Stack, Progress, Avatar } from '@chakra-ui/react'
import { updateUserRank } from '@/app/actions'
import { useEffect, useState, useRef } from 'react'

// ── Season helper ─────────────────────────────────────────────────────────────

function getCurrentSeason() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const startYear = month < 3 ? year - 1 : year
  return `${startYear}-${String(startYear + 1).slice(-2)}`
}

// ── Font loader ───────────────────────────────────────────────────────────────

let pixelFontLoaded = false

async function loadPixelFont() {
  if (pixelFontLoaded) return
  try {
    const font = new FontFace('RetroPixel', 'url(/fonts/Retro_Pixel.otf)')
    await font.load()
    document.fonts.add(font)
    pixelFontLoaded = true
  } catch (e) {
    console.warn('RetroPixel font failed, falling back:', e)
  }
}

function getPixelFont() {
  return document.fonts.check('12px RetroPixel') ? 'RetroPixel' : '"Courier New", monospace'
}

// ── Arc text helper ───────────────────────────────────────────────────────────
// rotationMode: 'top'    → chars face outward  (like MERIT AWARD / EMPLOYEES)
// rotationMode: 'bottom' → chars face inward/upward (like GUILD / VABB)

function drawArcText(ctx, text, cx, cy, r, centerAngleDeg, fontSize, fontFamily, highlight, shadowColor, rotationMode = 'top') {
  ctx.save()
  ctx.font = `bold ${fontSize}px ${fontFamily}`

  const charData = text.split('').map(ch => ({
    ch,
    w: ctx.measureText(ch).width
  }))

  const spacingDeg = 3.5
  const charAngles = charData.map(d => (d.w / r) * (180 / Math.PI))
  const totalSpan = charAngles.reduce((a, b) => a + b, 0) + spacingDeg * (text.length - 1)
  let angle = centerAngleDeg - totalSpan / 2

  charData.forEach((d, i) => {
    const charSpan = charAngles[ i ]
    const mid = angle + charSpan / 2
    const rad = (mid * Math.PI) / 180
    const x = cx + r * Math.cos(rad)
    const y = cy + r * Math.sin(rad)

    ctx.save()
    ctx.translate(x, y)
    // top arc: rotate so char top faces outward  → -(rad + π/2)
    // bottom arc: rotate so char bottom faces outward → +(rad + π/2) - π = rad - π/2
    const rotation = rotationMode === 'bottom'
      ? rad - Math.PI / 2
      : -(rad + Math.PI / 2)
    ctx.rotate(rotation)
    ctx.font = `bold ${fontSize}px ${fontFamily}`
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.fillStyle = shadowColor
    ctx.fillText(d.ch, 1, 1)
    ctx.fillStyle = highlight
    ctx.fillText(d.ch, 0, 0)
    ctx.restore()

    angle += charSpan + spacingDeg
  })

  ctx.restore()
}

// ── Canvas badge renderer ─────────────────────────────────────────────────────

function drawDynamicBadge(img, type, ifcName, season) {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(img, 0, 0)

  const w = canvas.width
  const h = canvas.height

  const highlight = 'rgb(225, 238, 252)'
  const shadowColor = 'rgb(40, 50, 70)'
  const serifFont = 'Georgia, "Times New Roman", serif'

  // Dynamic badge text color overrides
  const badge4TextShadowColor = 'rgba(0,0,0,0.95)'
  const badge4TextColor = 'rgba(0,0,0,0.98)'

  if (type === 'badge3front') {
    // Left half — VABB on bottom arc, left of star
    // Confirmed: cx=w*0.2489, cy=h*0.4986, r=h*0.3276, centerAngle=50deg, rotationMode=bottom
    // Move badge3 face-side text slightly more left and mirror it by flipping
    // the arc center X across the badge center.
    const cx = w * 0.2489
    const cy = h * 0.4986
    const r = h * 0.3276
    const size = Math.round(h * 0.051)  // ~18px at h=351

    // place more left along the arc
    const shiftedCx = cx - (w * 0.018)
    const mirroredCx = (w - shiftedCx)

    drawArcText(ctx, ifcName.toUpperCase(), mirroredCx, cy, r, 50, size, serifFont, highlight, shadowColor, 'bottom')
  }

  if (type === 'badge3back') {
    // Right half — name arc on top matching MERIT AWARD style, season below center
    const cx = w * 0.7496
    const cy = h * 0.4986
    const r = h * 0.3476   // same arc radius as front (122px)
    const maxW = w * 0.38
    const courier = '"Courier New", monospace'

    // Name follows top arc like MERIT AWARD (centerAngle=270deg = top)
    const nameSize = Math.round(h * 0.063)  // ~22px
    drawArcText(ctx, ifcName.toUpperCase(), cx, cy, r, 270, nameSize, serifFont, highlight, shadowColor, 'top')

    // Season flat centered in the blank area
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    let seasonSize = Math.round(h * 0.055)
    ctx.font = `bold ${seasonSize}px ${courier}`
    while (ctx.measureText(season).width > maxW && seasonSize > 8) {
      seasonSize--
      ctx.font = `bold ${seasonSize}px ${courier}`
    }
    ctx.fillStyle = shadowColor
    ctx.fillText(season, cx + 1, h * 0.63 + 1)
    ctx.fillStyle = highlight
    ctx.fillText(season, cx, h * 0.63)
  }

  if (type === 'badge4front') {
    const fontFamily = getPixelFont()
    const cx = w / 2
    const cy = h / 2
    const TARGET_FIT_W = w * 0.35
    const textColor = 'rgb(230, 230, 230)'

    ctx.textBaseline = 'middle'
    ctx.textAlign = 'left'

    let nameSize = Math.round(h * 0.074)
    ctx.font = `bold ${nameSize}px ${fontFamily}`
    while (ctx.measureText(ifcName.toUpperCase()).width > TARGET_FIT_W && nameSize > 1) {
      nameSize--
      ctx.font = `bold ${nameSize}px ${fontFamily}`
    }
    const nw = ctx.measureText(ifcName.toUpperCase()).width
    ctx.fillStyle = textColor
    ctx.fillText(ifcName.toUpperCase(), cx - nw / 2, cy)
  }

  if (type === 'badge4back') {
    const fontFamily = getPixelFont()
    const cx = w / 2
    const cy = h / 2
    const TARGET_FIT_W = w * 0.35
    // badge4 dynamic text should be black-ish
    const textColor = badge4TextColor


    ctx.textBaseline = 'middle'
    ctx.textAlign = 'left'

    let nameSize = Math.round(h * 0.074)
    ctx.font = `bold ${nameSize}px ${fontFamily}`
    while (ctx.measureText(ifcName.toUpperCase()).width > TARGET_FIT_W && nameSize > 1) {
      nameSize--
      ctx.font = `bold ${nameSize}px ${fontFamily}`
    }
    const nw = ctx.measureText(ifcName.toUpperCase()).width
    ctx.fillStyle = textColor
    ctx.fillText(ifcName.toUpperCase(), cx - nw / 2, cy)

    // Season arc at top outer ring — r=h*0.3505, center 270deg (top)
    // season arc text should also be black-ish
    drawArcText(ctx, season, cx, cy, h * 0.3505, 270,
      Math.round(h * 0.034), fontFamily,
      badge4TextColor, 'rgba(0, 0, 0, 0.85)', 'top')
  }

  try {
    return canvas.toDataURL('image/png')
  } catch {
    // Cross-origin images can taint the canvas in production.
    // Fallback to the original image src so the badge still renders.
    return img?.src || ''
  }
}


// ── BadgeIcon ─────────────────────────────────────────────────────────────────

function BadgeIcon({ badge, ifcName, season, size = 120 }) {
  // For badge4, render the image contents ~20% bigger without changing the wrapper box.
  const isBadge4 = badge?.id === 'badge4'
  const [ flipped, setFlipped ] = useState(false)

  const [ frontSrc, setFrontSrc ] = useState(badge.image)
  const [ backSrc, setBackSrc ] = useState(badge.backImage || null)
  const rendered = useRef(false)

  useEffect(() => {
    if (rendered.current) return
    if (!badge.hasBack) return
    rendered.current = true

    const loadImg = (src) => new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })

    if (badge.isCombinedDoubleSided) {
      loadImg(badge.image)
        .then(img => loadImg(drawDynamicBadge(img, 'badge3front', ifcName, season)))
        .then(img => {
          const url = drawDynamicBadge(img, 'badge3back', ifcName, season)
          setFrontSrc(url)
          setBackSrc(url)
        })
        .catch(e => console.error('Badge3 draw failed:', e))
    } else {
      // badge4: keep face stable by using the original static front image (badge.image)
      // and render dynamic text only on the back side.
      loadPixelFont().then(() =>
        Promise.all([
          Promise.resolve(badge.image),
          loadImg(badge.backImage).then(img => drawDynamicBadge(img, 'badge4back', ifcName, season)),
        ])
      ).then(([ frontSrcUrl, backSrcUrl ]) => {
        setFrontSrc(frontSrcUrl)
        setBackSrc(backSrcUrl)
      }).catch(e => console.error('Badge4 draw failed:', e))
    }
  }, [ badge, ifcName, season ])

  const canFlip = badge.hasBack

  // badge3 is wider (2:1 aspect), badge4 is roughly square-ish
  // Normalise display: badge3 front/back shows one half so it appears square-ish
  const isWide = badge.isCombinedDoubleSided
  const scale = isBadge4 ? 1.2 : 1

  // For badge4, keep wrapper box constant; scale only the inner image contents.
  const imgStyle = isWide
    ? {
      width: `${200 * scale}%`,
      height: '100%',
      objectFit: 'cover',
    }
    : {
      // badge4: scale beyond 100% so it appears bigger inside the same wrapper box.
      width: `${100 * scale}%`,
      height: '100%',
      objectFit: isBadge4 ? 'contain' : 'contain',
      transform: isBadge4 ? 'scale(1.7)' : undefined,
      transformOrigin: 'center',
    }

  return (
    <Box
      as="button"
      type="button"
      onClick={() => canFlip && setFlipped(p => !p)}
      width={`${size}px`}
      height={`${size}px`}
      position="relative"
      cursor={canFlip ? 'pointer' : 'default'}
      style={{ perspective: '800px' }}
      title={badge.label}
      background="none"
      border="none"
      padding="0"
      flexShrink="0"
    >
      <Box
        width="100%"
        height="100%"
        position="relative"
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 400ms ease',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        {/* Front */}
        <Box position="absolute" width="100%" height="100%" style={{ backfaceVisibility: 'hidden' }}>
          {isWide ? (
            <Box width="100%" height="100%" overflow="hidden" borderRadius="md">
              <Box as="img" src={frontSrc} alt={badge.label}
                style={{ ...imgStyle, objectPosition: 'left' }} />
            </Box>
          ) : (
            <Box position="absolute" inset="0" overflow="visible" borderRadius="md">
              {/* badge4: scale visual contents without changing wrapper size */}
              {badge?.id === 'badge4' ? (
                <Box
                  width="100%"
                  height="100%"
                  transform="scale(1.7)"
                  transformOrigin="center"
                >
                  <Box
                    as="img"
                    src={frontSrc}
                    alt={badge.label}
                    width="100%"
                    height="100%"
                    style={{ objectFit: 'contain' }}
                  />
                </Box>
              ) : (
                <Box
                  as="img"
                  src={frontSrc}
                  alt={badge.label}
                  width="100%"
                  height="100%"
                  style={{ objectFit: 'contain' }}
                  borderRadius="md"
                />
              )}
            </Box>
          )}
        </Box>

        {/* Back */}
        {canFlip && backSrc && (
          <Box position="absolute" width="100%" height="100%"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            {isWide ? (
              <Box width="100%" height="100%" overflow="hidden" borderRadius="md">
                <Box as="img" src={backSrc} alt={`${badge.label} back`}
                  style={{ ...imgStyle, objectPosition: 'right' }} />
              </Box>
            ) : (
              <Box position="absolute" inset="0" overflow="visible" borderRadius="md">
                {badge?.id === 'badge4' ? (
                  <Box
                    width="100%"
                    height="100%"
                    transform="scale(1.7)"
                    transformOrigin="center"
                  >
                    <Box
                      as="img"
                      src={backSrc}
                      alt={`${badge.label} back`}
                      width="100%"
                      height="100%"
                      style={{ objectFit: 'contain' }}
                    />
                  </Box>
                ) : (
                  <Box
                    as="img"
                    src={backSrc}
                    alt={`${badge.label} back`}
                    width="100%"
                    height="100%"
                    style={{ objectFit: 'contain' }}
                    borderRadius="md"
                  />
                )}
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  )
}

// ── Badge definitions ─────────────────────────────────────────────────────────

const BADGE_DEFINITIONS = [
  { id: 'badge1', label: 'AIH Ace', description: '15+ approved AIH flights', image: '/badges/badge1.png', hasBack: false, isCombinedDoubleSided: false },
  { id: 'badge2', label: 'IX Veteran', description: '20+ approved IX flights', image: '/badges/badge2.png', hasBack: false, isCombinedDoubleSided: false },
  { id: 'badge3', label: 'Career Power', description: '40+ hours in career mode', image: '/badges/badge3.png', hasBack: true, isCombinedDoubleSided: true },
  { id: 'badge4', label: 'Senior Pilot', description: 'Rank above junior first officer', image: '/badges/badge4a.png', backImage: '/badges/badge4b.png', hasBack: true, isCombinedDoubleSided: false },
  { id: 'badge5', label: 'Lotus Privé', description: 'Lotus Privé member badge', image: '/badges/lotus.png', hasBack: false, isCombinedDoubleSided: false }
]


// ── Payload normalizer ────────────────────────────────────────────────────────

const normalizeBadgePayload = (payload) => {
  // New payload shape from /api/users/badges:
  // { badges: number[] }
  // Convert to structure expected by earnedBadgesList logic.
  const normalized = { badge1: [], badge2: [], badge3: [], badge4: [], badge5: [] }

  if (!payload) return normalized

  const indexes = Array.isArray(payload.badges) ? payload.badges : []

  // We store membership arrays as [ifcNameLower] so the existing matching
  // code can stay unchanged.
  // Caller does:
  //   members.some(m => m.toLowerCase() === normalizedUserName)
  // So we push the same normalizedUserName later by overriding in filter.
  // Here we just keep placeholders; BasicInfo will handle matching via indexes.

  // Return empty membership arrays; earnedBadgesList will be computed using indexes.
  return normalized
}


// ── GlassBadgeCard ────────────────────────────────────────────────────────────

function GlassBadgeCard({ badge, ifcName, season, size }) {
  return (
    <Box
      position="relative"
      borderRadius="2xl"
      overflow="hidden"
      padding="3"
      display="flex"
      alignItems="center"
      justifyContent="center"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 100%)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1.5px solid rgba(212,175,55,0.75)',
        boxShadow: 'none',
      }}
    >
      {/* subtle inner glow */}
      <Box
        position="absolute"
        inset="0"
        borderRadius="2xl"
        pointerEvents="none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.06) 0%, transparent 70%)',
        }}
      />
      <BadgeIcon badge={badge} ifcName={ifcName} season={season} size={size} />
    </Box>
  )
}

// ── BasicInfo ─────────────────────────────────────────────────────────────────

export default function BasicInfo({ ifcName, image, flightTime, rank, badgePayload, lotusStatus: lotusStatusFromParent }) {
  const [ isLoadingBadges, setIsLoadingBadges ] = useState(false)
  const [ badgePayloadState, setBadgePayloadState ] = useState(null)

  // Sync prop -> state for internal usage.
  useEffect(() => {
    if (badgePayload) setBadgePayloadState(badgePayload)
  }, [ badgePayload ])


  const season = getCurrentSeason()

  const parseFlightTime = (timeStr) => {
    if (!timeStr) return 0
    const [ hours, minutes ] = timeStr.split(':').map(Number)
    return hours + (minutes / 60)
  }

  useEffect(() => {
    const updateRank = async () => {
      try { await updateUserRank(rank) } catch (e) { console.error(e) }
    }
    updateRank()
  }, [ rank ])

  const rankData = [
    { name: 'Yuvraj', hours: 0 },
    { name: 'Rajkumar', hours: 80 },
    { name: 'Rajvanshi', hours: 160 },
    { name: 'Rajdhiraj', hours: 450 },
    { name: 'Maharaja', hours: 900 },
    { name: 'Samrat', hours: 1500 },
    { name: 'Chhatrapati', hours: 2000 },
    { name: 'Aakashratha Club', hours: 2500 },
  ]

  const currentHours = parseFlightTime(flightTime)
  const currentRankIndex = rankData.findIndex(r => r.name === rank)
  let progress = 0, nextRank = null, remainingHours = 0





  // Lotus badge5 can be derived directly from Lotus status endpoint as well.
  // This avoids relying on /api/crewcenter?module=badges for Lotus membership.
  const [ lotusStatus, setLotusStatus ] = useState(null)
  useEffect(() => {
    const loadLotus = async () => {
      try {
        const res = await fetch('/api/chanda/lotus/status', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        setLotusStatus(data)
      } catch {
        // ignore
      }
    }
    loadLotus()
  }, [])

// Derive earned badges from users.badges indexes (provided by ProfileContainer).
  // users.badges stores indexes 0..4 (4 = badge5/Lotus), but we still gate badge5 via lotusStatus.
  const earnedBadgesList = BADGE_DEFINITIONS.filter((badge) => {
    if (!normalizedUserName) return false

    if (badge.id === 'badge5') {
      return lotusStatus?.active === true
    }

    const idxMap = {
      badge1: 0,
      badge2: 1,
      badge3: 2,
      badge4: 3,
      badge5: 4,
    }

    const idx = idxMap[badge.id]
    const indexes = Array.isArray(badgesFromProps) ? badgesFromProps : []
    return indexes.includes(idx)
  })


  if (currentRankIndex !== -1 && currentRankIndex < rankData.length - 1) {
    const cur = rankData[ currentRankIndex ]
    nextRank = rankData[ currentRankIndex + 1 ]
    progress = Math.min(((currentHours - cur.hours) / (nextRank.hours - cur.hours)) * 100, 100)
    remainingHours = Math.max(nextRank.hours - currentHours, 0)
  }

  const badgeCount = earnedBadgesList.length
  // Badge display size: shrink slightly when 5 badges to keep grid tidy
  const badgeSize = badgeCount >= 5 ? 100 : 120

  return (
    <Container maxW="100%" py="8" px="4">
      <Stack spacing="6">

        {/* ── TOP: Profile + Badges horizontal card ─────────────────────── */}
        <Box
          bg="bg.subtle"
          borderWidth="1px"
          borderColor="border"
          rounded="2xl"
          shadow="sm"
          overflow="hidden"
        >
          <Flex
            direction={{ base: 'column', md: 'row' }}
            minH={{ md: '220px' }}
          >

            {/* LEFT — Profile column */}
            <Flex
              direction="column"
              align="center"
              justify="center"
              gap="2"
              px="8"
              py="8"
              flexShrink={0}
              width={{ base: '100%', md: '240px' }}
              borderBottom={{ base: '1px solid', md: 'none' }}
              borderColor="border"
              textAlign="center"
              position="relative"
            >
              {/* Golden sharp-ended separator (reduced height) */}
              <Box
                display={{ base: 'none', md: 'block' }}
                position="absolute"
                right="-1px"
                top="14px"
                bottom="14px"
                width="1px"
                pointerEvents="none"
                style={{
                  background: 'rgba(212, 175, 55, 0.85)',
                  borderRadius: 0,
                }}
              />
              {/* Avatar */}
              <Box
                width="88px"
                height="88px"
                rounded="xl"
                overflow="hidden"
                border="2px solid"
                borderColor="border"
                flexShrink={0}
              >
                <Avatar.Root width="100%" height="100%" rounded="xl">
                  <Avatar.Image src={image} alt={ifcName} width="100%" height="100%" objectFit="cover" />
                  <Avatar.Fallback
                    width="100%" height="100%"
                    display="flex" alignItems="center" justifyContent="center"
                    fontSize="2xl" fontWeight="bold" color="fg" bg="bg.muted"
                  >
                    {ifcName?.charAt(0)}
                  </Avatar.Fallback>
                </Avatar.Root>
              </Box>

              {/* Name */}
              <Heading size="lg" color="fg" fontWeight="bold" lineHeight="1.1" mt="1">
                {ifcName}
              </Heading>

              {/* Rank */}
              <Box>
                <Text fontSize="xs" color="fg" opacity={0.55} fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                  Rank
                </Text>
                <Text fontSize="md" color="fg" fontWeight="bold">
                  {rank}
                </Text>
              </Box>

              {/* Flight Time */}
              <Box>
                <Text fontSize="xs" color="fg" opacity={0.55} fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                  Flight Time
                </Text>
                <Text fontSize="md" color="fg" fontWeight="bold">
                  {flightTime}
                </Text>
              </Box>
            </Flex>

            {/* RIGHT — Badges panel */}
            <Flex
              flex="1"
              align="center"
              justify="center"
              px={{ base: '5', md: '8' }}
              py={{ base: '6', md: '8' }}
              // shift top padding up when 5 badges to fit grid
              pt={{ base: '6', md: badgeCount >= 5 ? '4' : '8' }}
            >
              {isLoadingBadges ? (
                <Text color="fg" opacity={0.7} fontSize="sm">Checking badge status…</Text>
              ) : badgeCount === 0 ? (
                <Text color="fg" opacity={0.45} fontSize="sm" textAlign="center">
                  No badges earned yet.
                </Text>
              ) : (
                /* Badges container — glassmorphism box (no shadow) */
                <Box
                  borderRadius="3xl"
                  px="5"
                  py="5"
                  width="100%"
                  style={{
                    background: 'linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.015) 100%)',
                    border: '1px solid rgba(0,0,0,0.10)',
                    boxShadow: 'none',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                  }}
                >
                  {/* 2-per-row grid, centred, equal rows */}
                  <Flex
                    wrap="wrap"
                    gap="4"
                    justify="center"
                    align="center"
                  >
                    {earnedBadgesList.map(badge => (
                      <GlassBadgeCard
                        key={badge.id}
                        badge={badge}
                        ifcName={ifcName}
                        season={season}
                        size={badgeSize}
                      />
                    ))}
                  </Flex>
                </Box>
              )}
            </Flex>

          </Flex>
        </Box>

        {/* ── BOTTOM: Progress bar card ──────────────────────────────────── */}
        {nextRank && (
          <Box
            bg="bg.subtle"
            borderWidth="1px"
            borderColor="border"
            rounded="2xl"
            shadow="sm"
            px="8"
            py="5"
          >
            <Stack spacing="3">
              <Flex justify="space-between" align="center">
                <Text color="fg" fontSize="xs" fontWeight="semibold" opacity={0.8} textTransform="uppercase" letterSpacing="wider">
                  Progress to {nextRank.name}
                </Text>
                <Text color="fg" fontSize="sm" fontWeight="medium">
                  {remainingHours.toFixed(2)}h remaining
                </Text>
              </Flex>
              <Progress.Root value={progress} colorPalette="purple" variant="subtle" size="md" rounded="full">
                <Progress.Track>
                  <Progress.Range />
                </Progress.Track>
              </Progress.Root>
            </Stack>
          </Box>
        )}

      </Stack>
    </Container>
  )
}