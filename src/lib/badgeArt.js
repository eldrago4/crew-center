// Shared badge-art helpers — extracted from src/components/dashboard/BasicInfo.jsx
// so the pilot-profile pages (src/app/(main)/team, src/app/(crew)/crew/team) can
// render the same dynamically-composited badges without duplicating the canvas
// logic. Pure browser-only functions (canvas/FontFace) — no React, no Chakra.

// ── Season helper ─────────────────────────────────────────────────────────────

export function getCurrentSeason() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const startYear = month < 3 ? year - 1 : year
  return `${startYear}-${String(startYear + 1).slice(-2)}`
}

// ── Font loader ───────────────────────────────────────────────────────────────

let pixelFontLoaded = false

export async function loadPixelFont() {
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

export function getPixelFont() {
  return document.fonts.check('12px RetroPixel') ? 'RetroPixel' : '"Courier New", monospace'
}

// ── Arc text helper ───────────────────────────────────────────────────────────
// rotationMode: 'top'    → chars face outward  (like MERIT AWARD / EMPLOYEES)
// rotationMode: 'bottom' → chars face inward/upward (like GUILD / VABB)

export function drawArcText(ctx, text, cx, cy, r, centerAngleDeg, fontSize, fontFamily, highlight, shadowColor, rotationMode = 'top') {
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

export function drawDynamicBadge(img, type, ifcName, season) {
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

// ── Badge definitions ─────────────────────────────────────────────────────────
// Order defines BasicInfo's 2×2 grid placement (row-major: top-left, top-right,
// bottom-left, bottom-right): badge1 | badge5 / badge2 | badge3. badge4 is kept
// last (not part of that 4-badge layout). users.badges stores indexes 0..4
// matching this array's order.
export const BADGE_DEFINITIONS = [
  { id: 'badge1', label: 'AIH Ace', description: '15+ approved AIH flights', image: '/badges/badge1.webp', hasBack: false, isCombinedDoubleSided: false },
  { id: 'badge5', label: 'Lotus Privé', description: 'Lotus Privé member badge', image: '/badges/lotus.webp', hasBack: false, isCombinedDoubleSided: false },
  { id: 'badge2', label: 'IX Veteran', description: '20+ approved IX flights', image: '/badges/badge2.webp', hasBack: false, isCombinedDoubleSided: false },
  { id: 'badge3', label: 'Career Power', description: '40+ hours in career mode', image: '/badges/badge3.webp', hasBack: true, isCombinedDoubleSided: true },
  { id: 'badge4', label: 'Senior Pilot', description: 'Rank above junior first officer', image: '/badges/badge4a.webp', backImage: '/badges/badge4b.webp', hasBack: true, isCombinedDoubleSided: false }
]

// index (0..4, from users.badges) -> BADGE_DEFINITIONS id.
export const BADGE_INDEX_TO_ID = ['badge1', 'badge2', 'badge3', 'badge4', 'badge5']
