'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import styles from './pilotProfile.module.css'
import { profileFontClass } from './fonts'
import EditProfileModal from './EditProfileModal'
import { getAircraftById, getAircraftByCode, getAirlineById } from '@/data/fleet'
import { OPERATOR_BY_ID, OTHER_OPERATOR } from '@/data/operators'
import { TRAIL_META, TRAIL_MULTIPLIER } from '@/app/shared/trails'
import { profileShareUrl } from '@/lib/profileLink'
import {
  RANKS, RAJMATYA_HOURS, AKASHARATHA_HOURS,
  getRankBg, getRankColor, getRankProgress,
} from '@/lib/ranks'
import { getCurrentSeason, loadPixelFont, drawDynamicBadge, BADGE_DEFINITIONS, BADGE_INDEX_TO_ID } from '@/lib/badgeArt'
import { CAREER_RANKS, getCareerProgress } from '@/lib/careerRanks'

const NetworkMap = dynamic(() => import('./NetworkMap'), { ssr: false })

// ── Formatting helpers ────────────────────────────────────────────────────────

// Decimal hours -> "H:MM", the mono format the design uses everywhere.
function hm(hours) {
  const total = Math.max(0, Math.round((Number(hours) || 0) * 60))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

function fmtInterval(interval) {
  if (!interval) return '0:00'
  const [h, m] = String(interval).split(':')
  return `${parseInt(h) || 0}:${String(parseInt(m) || 0).padStart(2, '0')}`
}

function fmtMonthYear(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function fmtDateLong(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
}

function fmtDateShort(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase()
}

const MONTH_INITIALS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Where the touchdown dot sits on the runway strip; the roll bar and exit tick
// are both measured from here.
const TOUCHDOWN_PCT = 12

// ── Badge rendering (client canvas compositing, reused from badgeArt.js) ────────
//
// Badge art ships at very different canvas ratios, so each tile is normalised by
// ART, not by file (this is the design's own note): badge1/badge2/lotus are wide and
// short -> fit to WIDTH. The two round medals are matched on HEIGHT so their discs
// come out the same diameter — badge3.webp is a 2:1 two-sided sheet (front = left
// half, disc ~94% of sheet height) and badge4a.webp is a ~1.43:1 canvas whose disc
// fills ~95% of the height but only ~66% of the width, so object-fit:contain renders
// it ~30% shorter than badge3 until it's fitted to height with the padding clipped.
function badgeImgStyle(badge, side = 'front') {
  if (badge.isCombinedDoubleSided) {
    // 2:1 sheet — show one half, fitted to height.
    return {
      width: '200%',
      height: '100%',
      objectFit: 'cover',
      objectPosition: side === 'back' ? 'right' : 'left',
    }
  }
  if (badge.id === 'badge4') {
    // Fit to HEIGHT so its disc matches badge3's; the empty side padding clips.
    return { height: '100%', width: 'auto', maxWidth: 'none', objectFit: 'cover' }
  }
  // Wings / rosette art — fit to WIDTH. badge1 and badge2 are the widest and
  // shortest in the set, so fitting to width alone leaves them reading much
  // smaller than the round medals; scale them up to the same optical weight.
  // Their faces don't clip (see badgeFaceClip), so the overflow is free.
  const scale = badge.id === 'badge1' || badge.id === 'badge2' ? 1.35 : 1
  return {
    width: '100%',
    height: 'auto',
    maxHeight: '100%',
    objectFit: 'contain',
    transform: scale === 1 ? undefined : `scale(${scale})`,
    transformOrigin: 'center',
  }
}

// Only the two round medals need their art clipped to the tile (badge3 shows one
// half of a 2:1 sheet, badge4 has its side padding cropped off). The wide art can
// overflow so it isn't boxed in.
function badgeNeedsClip(badge) {
  return badge.isCombinedDoubleSided || badge.id === 'badge4'
}

function ProfileBadge({ badge, ifcName, season, size = 78 }) {
  const [flipped, setFlipped] = useState(false)
  const [frontSrc, setFrontSrc] = useState(badge.image)
  const [backSrc, setBackSrc] = useState(badge.backImage || null)
  const rendered = useRef(false)

  useEffect(() => {
    if (rendered.current || !badge.hasBack) return
    rendered.current = true

    const loadImg = (src) => new Promise((resolve, reject) => {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })

    if (badge.isCombinedDoubleSided) {
      loadImg(badge.image)
        .then((img) => loadImg(drawDynamicBadge(img, 'badge3front', ifcName, season)))
        .then((img) => {
          const url = drawDynamicBadge(img, 'badge3back', ifcName, season)
          setFrontSrc(url)
          setBackSrc(url)
        })
        .catch((e) => console.error('Badge3 draw failed:', e))
    } else {
      // badge4: keep the face stable (static front art) and composite the back only.
      loadPixelFont().then(() =>
        Promise.all([
          Promise.resolve(badge.image),
          loadImg(badge.backImage).then((img) => drawDynamicBadge(img, 'badge4back', ifcName, season)),
        ])
      ).then(([frontSrcUrl, backSrcUrl]) => {
        setFrontSrc(frontSrcUrl)
        setBackSrc(backSrcUrl)
      }).catch((e) => console.error('Badge4 draw failed:', e))
    }
  }, [badge, ifcName, season])

  const canFlip = badge.hasBack
  const isLotus = badge.id === 'badge5'

  return (
    <button
      type="button"
      className={styles.badgeTile}
      onClick={() => canFlip && setFlipped((p) => !p)}
      title={canFlip ? `${badge.label} — click to flip` : badge.label}
      aria-label={badge.label}
      style={{ width: size, height: size, cursor: canFlip ? 'pointer' : 'default' }}
    >
      {isLotus && <span className={styles.lotusGlow} aria-hidden="true" />}
      <span
        className={styles.badgeFlipper}
        style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
        <span className={`${styles.badgeFace} ${badgeNeedsClip(badge) ? styles.badgeFaceClip : ''}`}>
          <img src={frontSrc} alt={badge.label} style={badgeImgStyle(badge, 'front')} />
        </span>
        {canFlip && backSrc && (
          <span className={`${styles.badgeFace} ${styles.badgeFaceBack} ${badgeNeedsClip(badge) ? styles.badgeFaceClip : ''}`}>
            <img src={backSrc} alt={`${badge.label} back`} style={badgeImgStyle(badge, 'back')} />
          </span>
        )}
      </span>
    </button>
  )
}

// ── Logbook telemetry ──────────────────────────────────────────────────────────
//
// Sourced from the Infinite Flight Live API and matched to the PIREP by sector and
// date (src/lib/ifFlights.js). Every panel is independently optional: IF doesn't
// report the same fields for every flight, and a PIREP filed for a flight IF never
// saw has none at all — in which case the card is just its top row.

function FlightTelemetry({ telemetry }) {
  if (!telemetry) return null
  const { landing, dayNight, violations } = telemetry
  if (!landing && !dayNight && !violations) return null

  // Position on the smooth→hard scale, from the sink rate at touchdown.
  const fpm = landing ? Math.abs(landing.verticalSpeedFpm) : null
  const markerPct = fpm != null ? Math.min(100, Math.max(0, (fpm / 600) * 100)) : null

  // Roll bar scaled so the design's reference figures land where it drew them
  // (a 780 m roll ≈ 31% of the strip), capped so a very long rollout still fits.
  const rollPct = Number.isFinite(landing?.groundRollDistanceM)
    ? Math.min(70, (landing.groundRollDistanceM / 2500) * 100)
    : null

  const dayMin = dayNight?.dayMinutes ?? 0
  const nightMin = dayNight?.nightMinutes ?? 0
  const totalMin = dayMin + nightMin
  const dayPct = totalMin > 0 ? (dayMin / totalMin) * 100 : 0

  const asHm = (mins) => `${Math.floor(mins / 60)}:${String(Math.round(mins % 60)).padStart(2, '0')}`

  return (
    <>
      <div className={styles.telemetryRow}>
        {landing && (
          <div className={styles.telemetryCard}>
            <div className={styles.telemetryLabel}>Landing</div>
            <div className={styles.landingHead}>
              <span style={{ fontSize: 17, color: landing.grade.color }}>{landing.grade.label}</span>
              <span className={styles.mono} style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                {landing.verticalSpeedFpm} fpm
              </span>
            </div>
            <div className={styles.landingScale}>
              <span className={styles.landingMarker} style={{ left: `${markerPct}%`, background: landing.grade.color }} />
            </div>
          </div>
        )}

        {landing && (Number.isFinite(landing.centerlineDistanceM) || Number.isFinite(landing.groundRollDistanceM)) && (
          <div className={styles.telemetryCard}>
            <div className={styles.telemetryLabel}>Touchdown</div>
            <div style={{ fontSize: 16, margin: '5px 0 11px' }}>
              {Number.isFinite(landing.centerlineDistanceM)
                ? `${Math.abs(landing.centerlineDistanceM).toFixed(1)} m off centre`
                : 'Centreline not reported'}
              {Number.isFinite(landing.groundRollDistanceM) && (
                <span style={{ color: 'var(--muted)', fontSize: 12.5 }}>
                  {' '}· {Math.round(landing.groundRollDistanceM).toLocaleString()} m roll
                </span>
              )}
            </div>
            <div className={styles.runway}>
              <span className={styles.runwayCentreline} />
              {rollPct != null && (
                <span
                  className={styles.runwayRoll}
                  style={{ width: `${rollPct}%`, background: `linear-gradient(90deg, ${landing.grade.color}4D, transparent)` }}
                />
              )}
              {/* Where the aircraft left the runway: touchdown point plus the
                  distance it rolled, matching the design's exit tick. */}
              {rollPct != null && (
                <>
                  <span className={styles.runwayExit} style={{ left: `${TOUCHDOWN_PCT + rollPct}%` }} />
                  <span className={styles.runwayExitLabel} style={{ left: `${TOUCHDOWN_PCT + rollPct}%` }}>exit</span>
                </>
              )}
              <span className={styles.runwayTouch} style={{ background: landing.grade.color }} />
            </div>
            <div className={styles.telemetryFoot}>
              <span>{landing.maxGForce.toFixed(2)} G</span>
              {landing.groundSpeedKts != null && (
                <>
                  <span style={{ color: '#3A4A50' }}>·</span>
                  <span>{landing.groundSpeedKts} kt</span>
                </>
              )}
            </div>
          </div>
        )}

        {dayNight && (
          <div className={`${styles.telemetryCard} ${styles.telemetryCardNarrow}`}>
            <div className={styles.telemetryLabel}>Day / night flying</div>
            <div className={styles.dayNightBar}>
              <span style={{ width: `${dayPct}%`, background: 'linear-gradient(180deg, #C9A96E, #8E7548)' }} />
              <span style={{ width: `${100 - dayPct}%`, background: 'linear-gradient(180deg, #22313A, #161F26)' }} />
            </div>
            <div className={styles.mono} style={{ fontSize: 10, color: 'var(--muted)' }}>
              {dayMin > 0 ? `${asHm(dayMin)} day` : 'no day'} · {nightMin > 0 ? `${asHm(nightMin)} night` : 'no night'}
            </div>
          </div>
        )}
      </div>

      {violations > 0 && (
        <div className={styles.violationNote}>
          <span className={styles.violationDot} />
          <span>{violations} violation{violations === 1 ? '' : 's'} recorded on this flight</span>
        </div>
      )}
    </>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function PilotProfile({ callsign, identity, edits, agg, network, trails, career, logbook, viewer = {} }) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [copied, setCopied] = useState(false)

  const { isOwner = false, showBack = false } = viewer
  const displayName = edits?.displayName || identity.ifcName
  const season = getCurrentSeason()

  useEffect(() => {
    if (!identity.discordId) return
    fetch(`/api/get-avatar?userId=${identity.discordId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data?.avatarUrl && setAvatarUrl(data.avatarUrl))
      .catch(() => {})
  }, [identity.discordId])

  // users.lastActive is a timezone-less Postgres timestamp string ("2026-08-01
  // 12:34:56"); Safari returns Invalid Date for that form, so normalise to ISO-UTC
  // before comparing. "Active" uses the same 30-day window the admin roster does.
  const isActive = useMemo(() => {
    if (!identity.lastActive) return false
    const raw = String(identity.lastActive).trim()
    const iso = raw.includes('T') ? raw : `${raw.replace(' ', 'T')}Z`
    const t = new Date(iso).getTime()
    if (Number.isNaN(t)) return false
    return Date.now() - t < 30 * 24 * 60 * 60 * 1000
  }, [identity.lastActive])

  const rankProgress = getRankProgress(identity.hours)
  const rankColor = getRankColor(identity.rank)
  const rankBg = getRankBg(identity.rank)

  const badgeList = BADGE_DEFINITIONS.filter((b) => identity.badges.includes(BADGE_INDEX_TO_ID.indexOf(b.id)))
  const aircraft = edits?.favAircraft ? getAircraftById(edits.favAircraft) : null
  const airline = aircraft ? getAirlineById(aircraft.airline) : null
  const favAircraftHours = aircraft ? (agg.fleetHours?.[aircraft.code] ?? agg.fleetHours?.[aircraft.type]) : null

  const isRajmatya = identity.hours >= RAJMATYA_HOURS
  const isAakashratha = identity.hours >= AKASHARATHA_HOURS
  const aakashrathaPct = Math.min(100, Math.round((identity.hours / AKASHARATHA_HOURS) * 100))

  // ── Where the hours went: top 4 operators, rest folded into "Other" ──
  const operatorSlices = useMemo(() => {
    const entries = Object.entries(agg.operatorHours || {})
      .map(([id, hours]) => ({ ...(OPERATOR_BY_ID[id] || OTHER_OPERATOR), id, hours }))
      .filter((o) => o.hours > 0)
      .sort((a, b) => b.hours - a.hours)

    const top = entries.slice(0, 4)
    const restHours = entries.slice(4).reduce((sum, o) => sum + o.hours, 0)
    if (restHours > 0) top.push({ ...OTHER_OPERATOR, hours: restHours })

    const total = top.reduce((sum, o) => sum + o.hours, 0)
    let acc = 0
    return {
      total,
      slices: top.map((o) => {
        const pct = total > 0 ? (o.hours / total) * 100 : 0
        const from = acc
        acc += pct
        return { ...o, pct, from, to: acc }
      }),
    }
  }, [agg.operatorHours])

  const donutGradient = operatorSlices.total > 0
    ? `conic-gradient(${operatorSlices.slices.map((s) => `${s.color} ${s.from}% ${s.to}%`).join(', ')})`
    : '#1C2830'

  // ── Hours filed, last 12 months ──
  const monthly = useMemo(() => {
    const now = new Date()
    const months = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
      months.push({ key, month: d.getUTCMonth(), year: d.getUTCFullYear(), hours: agg.monthlyHours?.[key] || 0 })
    }
    const max = Math.max(...months.map((m) => m.hours), 1)
    const avg = months.reduce((s, m) => s + m.hours, 0) / 12
    const best = months.reduce((a, b) => (b.hours > a.hours ? b : a), months[0])
    const thisMonth = months[months.length - 1]

    // Consecutive months ending now with at least one filed hour.
    let streak = 0
    for (let i = months.length - 1; i >= 0; i--) {
      if (months[i].hours > 0) streak++
      else break
    }
    return { months, max, avg, best, thisMonth, streak }
  }, [agg.monthlyHours])

  // ── Fleet time ──
  const fleet = useMemo(() => {
    const entries = Object.entries(agg.fleetHours || {})
      .map(([type, hours]) => ({ type, hours }))
      .sort((a, b) => b.hours - a.hours)
    return { entries: entries.slice(0, 6), total: entries.length, max: entries[0]?.hours || 1 }
  }, [agg.fleetHours])

  // ── Top routes ──
  const topRoutes = useMemo(() => {
    const entries = Object.entries(agg.routePairs || {})
      .map(([pair, count]) => ({ pair: pair.replace('-', '–'), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)
    return { entries, max: entries[0]?.count || 1 }
  }, [agg.routePairs])

  // ── Trails ──
  const trailStats = useMemo(() => {
    const all = Object.entries(TRAIL_META)
      .map(([slug, meta]) => ({ slug, ...meta, done: trails?.[slug] || 0 }))
      .sort((a, b) => (b.done / b.legs) - (a.done / a.legs) || b.done - a.done)
    const done = all.filter((t) => t.done >= t.legs).length
    const open = all.filter((t) => t.done > 0 && t.done < t.legs).length
    return { all, done, open, untouched: all.length - done - open, total: all.length }
  }, [trails])

  // ── Events by quarter (last 5) ──
  const eventQuarters = useMemo(() => {
    const now = new Date()
    const out = []
    for (let i = 4; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i * 3, 1))
      const key = `${d.getUTCFullYear()}-Q${Math.floor(d.getUTCMonth() / 3) + 1}`
      out.push({ key, label: `Q${Math.floor(d.getUTCMonth() / 3) + 1} ${String(d.getUTCFullYear()).slice(-2)}`, count: agg.eventsByQuarter?.[key] || 0 })
    }
    const max = Math.max(...out.map((q) => q.count), 1)
    const avgMultiplier = agg.recentEvents?.length
      ? agg.recentEvents.reduce((s, e) => s + (e.multiplier || 1), 0) / agg.recentEvents.length
      : 0
    return { quarters: out, max, thisQuarter: out[out.length - 1].count, avgMultiplier }
  }, [agg.eventsByQuarter, agg.recentEvents])

  // ── Career ladder + last-6-months chart ──
  const careerProgress = useMemo(
    () => getCareerProgress(career?.rank, career?.flightHours),
    [career?.rank, career?.flightHours]
  )

  const careerMonthly = useMemo(() => {
    const now = new Date()
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
      months.push({ key, month: d.getUTCMonth(), year: d.getUTCFullYear(), hours: career?.monthlyHours?.[key] || 0 })
    }
    const first = months[0]
    const last = months[months.length - 1]
    const label = (m) => `${MONTH_NAMES[m.month]} ${String(m.year).slice(-2)}`
    return {
      months,
      max: Math.max(...months.map((m) => m.hours), 1),
      rangeLabel: `${label(first)} → ${label(last)}`.toUpperCase(),
    }
  }, [career?.monthlyHours])

  const airportsVisited = Object.keys(agg.airportCounts || {}).length
  const publicUrl = profileShareUrl(callsign)

  const copyLink = () => {
    navigator.clipboard?.writeText(publicUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className={`${styles.page} ${profileFontClass}`}>
      <div className={`${styles.tierBg} ${styles.base}`} />
      <div className={styles.tierBg} style={{ background: rankBg }} />

      {/* The public site's mobile navbar is position:fixed, so the public variant
          needs top clearance under 705px; the crew variant has no navbar. */}
      <div className={`${styles.inner} ${showBack ? '' : styles.underNavbar}`}>
        {showBack && (
          <div className={styles.backRow}>
            <button type="button" className={styles.backBtn} onClick={() => router.back()}>
              ← Back
            </button>
          </div>
        )}

        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.eyebrow}>Total Flight Time</div>
            <div className={styles.statLine}>
              <span className={`${styles.mono} ${styles.big}`}>{Math.floor(identity.hours)}</span>
              <span className={styles.unit}>h {Math.round((identity.hours % 1) * 60)}m</span>
            </div>
            <div className={styles.rule} />
            <div className={styles.metaRow}>
              <div className={styles.metaItem}>
                <div className={`${styles.mono} ${styles.val}`}>#{identity.rankPosition}</div>
                <div className={styles.lbl}>of {identity.totalPilots ?? '—'} pilots</div>
              </div>
              <div className={styles.metaItem}>
                <div className={`${styles.mono} ${styles.val}`}>{agg.approvedCount}</div>
                <div className={styles.lbl}>approved flights</div>
              </div>
              <div className={styles.metaItem}>
                <div className={`${styles.mono} ${styles.val}`}>{fmtMonthYear(agg.joinedDate)}</div>
                <div className={styles.lbl}>joined</div>
              </div>
            </div>
            {edits?.bio && <p className={styles.bio}>{edits.bio}</p>}
          </div>

          <div className={styles.avatarWrap}>
            <div className={styles.avatarRing}>
              <div className={styles.ringOuter} />
              <div className={styles.ringInner}>
                {avatarUrl
                  ? <img src={avatarUrl} alt={displayName} />
                  : <span className={styles.mono} style={{ fontSize: 9.5, color: '#6E7C82', letterSpacing: '0.1em' }}>PHOTO</span>}
              </div>
              {isActive && (
                <div className={styles.activeDot}>
                  <span className={styles.dot} />
                  <span>ACTIVE</span>
                </div>
              )}
            </div>

            <div className={styles.nameRow}>
              <span className={styles.nameLockup}>
                <span className={styles.callsignChip}>{callsign}</span>
                <span className={styles.name}>{displayName}</span>
              </span>
            </div>

            <div className={styles.rankRow}>
              <span className={styles.bar} />
              <span className={styles.rankLabel} style={{ color: rankColor }}>{identity.rank}</span>
              <span className={styles.bar} />
            </div>

            <div className={styles.badgeRow}>
              {badgeList.length > 0
                ? badgeList.map((b) => (
                    <ProfileBadge key={b.id} badge={b} ifcName={identity.ifcName} season={season} size={48} />
                  ))
                : <span className={styles.noBadges}>No badges earnt</span>}
            </div>
          </div>

          <div className={styles.linksCol}>
            {aircraft && (
              <div className={styles.aircraftCard}>
                <div className={styles.aircraftHead}>
                  <span className={styles.eyebrow}>Favourite Aircraft</span>
                  <span className={styles.b612} style={{ color: '#C9A96E', fontSize: 15 }}>
                    {aircraft.type}{airline ? ` · ${airline.name}` : ''}
                  </span>
                </div>
                <div className={styles.aircraftFrame}>
                  <Image src={aircraft.image} alt={aircraft.type} fill sizes="380px" style={{ objectFit: 'contain', padding: '8%' }} />
                  {favAircraftHours > 0 && (
                    <span className={styles.aircraftHours}>{hm(favAircraftHours)} h logged</span>
                  )}
                </div>
              </div>
            )}
            <div className={styles.linkBar}>
              <div className={styles.linkGroup}>
                {identity.discordId && (
                  <a className={styles.linkItem} href={`https://discord.com/users/${identity.discordId}`} target="_blank" rel="noreferrer">
                    <img src="/discord-dm.webp" alt="" className={styles.linkIcon} />Discord
                  </a>
                )}
                <span className={styles.linkSep} />
                <a className={styles.linkItem} href={`https://community.infiniteflight.com/new-message?username=${encodeURIComponent(identity.ifcName)}`} target="_blank" rel="noreferrer">
                  <img src="/ifc-dm.webp" alt="" className={styles.linkIcon} />Forum
                </a>
                <span className={styles.linkSep} />
                <button type="button" className={styles.linkItem} onClick={copyLink} title="Copy profile link" style={{ flex: '0 0 42px' }}>
                  {copied ? '✓' : '↗'}
                </button>
              </div>
              {isOwner && (
                <button type="button" className={styles.editBtn} onClick={() => setEditOpen(true)}>
                  Edit profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── The climb ── */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionTitle}>
              <h2>The climb</h2>
              <span className={styles.sectionSub}>RANK BY LOGGED HOURS</span>
            </div>
            {rankProgress.nextRank && (
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                {hm(rankProgress.hoursToNext)} h to <span style={{ color: 'var(--ink)' }}>{rankProgress.nextRank}</span>
              </span>
            )}
          </div>
          <div className={styles.ladder}>
            {RANKS.map((r, i) => {
              const isCurrent = r.rank === rankProgress.rank
              const isFuture = identity.hours < r.hours
              const height = 12 + (i / (RANKS.length - 1)) * 76
              return (
                <div key={r.rank} className={isCurrent ? styles.ladderColYou : styles.ladderCol}>
                  {isCurrent && (
                    <div className={styles.ladderYouTag}>YOU ARE HERE · {Math.round(rankProgress.percent)}%</div>
                  )}
                  {isFuture ? (
                    <div className={styles.ladderTarget} style={{ height }} />
                  ) : (
                    <div
                      className={styles.ladderBar}
                      style={{ height, opacity: isCurrent ? 1 : 0.34 + (i / RANKS.length) * 0.38, position: 'relative', overflow: 'hidden' }}
                    >
                      {isCurrent && (
                        <div style={{ position: 'absolute', inset: 0, right: `${100 - rankProgress.percent}%`, background: '#E7CE96' }} />
                      )}
                    </div>
                  )}
                  <div className={styles.ladderName} style={{ color: isCurrent ? 'var(--ink)' : undefined }}>{r.rank}</div>
                  <div className={styles.ladderHours} style={{ color: isCurrent ? 'var(--gold)' : undefined }}>{r.hours}h</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Clubs + Badge cabinet ── */}
        <div className={`${styles.section} ${styles.twoCol}`} style={{ gridTemplateColumns: badgeList.length > 2 ? '1fr 1fr' : '1fr' }}>
          <div>
            <div className={styles.eyebrow} style={{ marginBottom: 14 }}>Clubs</div>
            <div className={styles.clubsCol}>
              <div className={`${styles.clubCard} ${isRajmatya ? styles.clubCardMember : ''}`}>
                <div className={styles.clubDiscGold} />
                <div style={{ flex: 1 }}>
                  <div className={styles.clubName} style={{ color: isRajmatya ? undefined : 'var(--muted)' }}>Rajmatya Club</div>
                  <div className={styles.clubMeta}>{RAJMATYA_HOURS} h and above</div>
                </div>
                <div className={`${styles.clubTag} ${isRajmatya ? styles.clubTagOn : styles.clubTagOff}`}>
                  {isRajmatya ? 'MEMBER' : 'LOCKED'}
                </div>
              </div>

              <div className={`${styles.clubCard} ${isAakashratha ? styles.clubCardMember : ''}`}>
                {isAakashratha ? (
                  <div className={styles.clubDiscGold} />
                ) : (
                  <div
                    className={styles.clubDiscProgress}
                    style={{ background: `conic-gradient(#5FAFB8 0 ${aakashrathaPct}%, #22313A ${aakashrathaPct}% 100%)` }}
                  >
                    <div className={styles.clubDiscHole}>{aakashrathaPct}%</div>
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div className={styles.clubName} style={{ color: isAakashratha ? undefined : 'var(--muted)' }}>Aakashratha Club</div>
                  <div className={styles.clubMeta}>
                    {AKASHARATHA_HOURS} h and above
                    {!isAakashratha && ` · ${hm(AKASHARATHA_HOURS - identity.hours)} h remaining`}
                  </div>
                </div>
                <div className={`${styles.clubTag} ${isAakashratha ? styles.clubTagOn : styles.clubTagOff}`}>
                  {isAakashratha ? 'MEMBER' : 'LOCKED'}
                </div>
              </div>
            </div>
          </div>

          {badgeList.length > 2 && (
            <div>
              <div className={styles.panelHead}>
                <span className={styles.eyebrow}>Badge cabinet</span>
                <span className={styles.mono} style={{ fontSize: 9.5, color: 'var(--muted-2)' }}>{badgeList.length} EARNED</span>
              </div>
              <div className={styles.cabinet}>
                {badgeList.map((b) => (
                  <ProfileBadge key={b.id} badge={b} ifcName={identity.ifcName} season={season} size={86} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Stats strip ── */}
        <div className={styles.statsStrip}>
          <div className={styles.statCell}><div className={styles.statNum}>{airportsVisited}</div><div className={styles.statSub}>airports visited</div></div>
          <div className={styles.statCell}><div className={styles.statNum}>{agg.countries.length}</div><div className={styles.statSub}>countries</div></div>
          <div className={styles.statCell}><div className={styles.statNum}>{agg.uniqueRoutes.length}</div><div className={styles.statSub}>unique routes</div></div>
          <div className={styles.statCell}><div className={styles.statNum}>{agg.eventsFlown}</div><div className={styles.statSub}>events flown</div></div>
          <div className={styles.statCell}>
            <div className={styles.statNum}>{trailStats.done}<span style={{ color: 'var(--muted-2)', fontSize: 16 }}>/{trailStats.total}</span></div>
            <div className={styles.statSub}>trails completed</div>
          </div>
          <div className={styles.statCell}>
            <div className={styles.statNum}>{agg.longestFlight ? hm(agg.longestFlight.hours) : '—'}</div>
            <div className={styles.statSub}>
              longest{agg.longestFlight ? ` · ${agg.longestFlight.departureIcao}–${agg.longestFlight.arrivalIcao}` : ''}
            </div>
          </div>
        </div>

        {/* ── Network flown ── */}
        {network?.sectors?.length > 0 && (
          <div className={styles.section} style={{ borderTop: 'none' }}>
            <div className={styles.sectionHead}>
              <div className={styles.sectionTitle}>
                <h2>Network flown</h2>
                <span className={styles.sectionSub}>EVERY APPROVED SECTOR</span>
              </div>
              <div className={styles.mapLegend}>
                <span><span className={styles.legendLineGold} />most flown</span>
                <span><span className={styles.legendLineTeal} />other sectors</span>
                {network.hub && <span><span className={styles.legendHubRing} />home hub {network.hub}</span>}
              </div>
            </div>
            <div className={styles.mapFrame}>
              <NetworkMap network={network} />
              <div className={styles.mapStats}>
                {network.hub && (
                  <div className={styles.mapStat}>
                    <div className={styles.mono} style={{ fontSize: 17 }}>{network.hub}</div>
                    <div className={styles.mapStatSub}>home hub{network.hubCity ? ` · ${network.hubCity}` : ''}</div>
                  </div>
                )}
                {network.sectors[0] && (
                  <div className={styles.mapStat}>
                    <div className={styles.mono} style={{ fontSize: 17 }}>{network.sectors[0].from}–{network.sectors[0].to}</div>
                    <div className={styles.mapStatSub}>most flown · {network.sectors[0].count} sectors</div>
                  </div>
                )}
                <div className={styles.mapStat}>
                  <div className={styles.mono} style={{ fontSize: 17 }}>{network.continents}</div>
                  <div className={styles.mapStatSub}>continents touched</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Hours filed + Where the hours went ── */}
        <div className={styles.gridWide}>
          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <span className={styles.panelTitle}>Hours filed, last 12 months</span>
              <span className={styles.mono} style={{ fontSize: 9.5, letterSpacing: '0.14em', color: 'var(--muted-2)' }}>
                AVG {hm(monthly.avg)} / MONTH
              </span>
            </div>
            <div className={styles.barChart}>
              <div className={styles.avgLine} style={{ bottom: `${(monthly.avg / monthly.max) * 100}%` }}>
                <span className={styles.avgTag}>avg</span>
              </div>
              <div className={styles.bars}>
                {monthly.months.map((m, i) => {
                  const isBest = m.key === monthly.best.key && m.hours > 0
                  const isNow = i === monthly.months.length - 1
                  return (
                    <div
                      key={m.key}
                      className={styles.bar}
                      style={{
                        height: `${Math.max((m.hours / monthly.max) * 100, m.hours > 0 ? 3 : 1)}%`,
                        background: isNow ? '#C9A96E' : isBest ? '#5FAFB8' : '#2E4A50',
                      }}
                      title={`${m.key}: ${hm(m.hours)} h`}
                    />
                  )
                })}
              </div>
            </div>
            <div className={styles.barLabels}>
              {monthly.months.map((m, i) => {
                const isBest = m.key === monthly.best.key && m.hours > 0
                const isNow = i === monthly.months.length - 1
                return (
                  <span key={m.key} style={{ color: isNow ? '#C9A96E' : isBest ? '#5FAFB8' : undefined }}>
                    {MONTH_INITIALS[m.month]}
                  </span>
                )
              })}
            </div>
            <div className={styles.panelFooter}>
              <div>
                <div className={styles.mono} style={{ fontSize: 16, color: '#5FAFB8' }}>{hm(monthly.best.hours)}</div>
                <div className={styles.footSub}>best month · {MONTH_INITIALS[monthly.best.month]}{String(monthly.best.year).slice(-2)}</div>
              </div>
              <div>
                <div className={styles.mono} style={{ fontSize: 16 }}>{monthly.streak}</div>
                <div className={styles.footSub}>month filing streak</div>
              </div>
              <div>
                <div className={styles.mono} style={{ fontSize: 16 }}>{hm(monthly.thisMonth.hours)}</div>
                <div className={styles.footSub}>this month so far</div>
              </div>
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelTitle} style={{ marginBottom: 18 }}>Where the hours went</div>
            <div className={styles.donutRow}>
              <div className={styles.donut} style={{ background: donutGradient }}>
                <div className={styles.donutHole}>
                  <span className={styles.mono} style={{ fontSize: 16 }}>{agg.approvedCount}</span>
                  <span style={{ fontSize: 9.5, color: 'var(--muted)', letterSpacing: '0.08em' }}>FLIGHTS</span>
                </div>
              </div>
              <div className={styles.legend}>
                {operatorSlices.slices.map((s) => (
                  <div key={s.id} className={styles.legendRow}>
                    <span className={styles.legendSwatch} style={{ background: s.color }} />
                    <span className={styles.legendLbl}>{s.label}</span>
                    <span className={styles.legendVal}>{hm(s.hours)}</span>
                  </div>
                ))}
              </div>
            </div>
            {topRoutes.entries.length > 0 && (
              <div className={styles.subPanel}>
                <div className={styles.mono} style={{ fontSize: 9.5, letterSpacing: '0.16em', color: 'var(--muted-2)', marginBottom: 12 }}>
                  TOP ROUTES
                </div>
                <div className={styles.rowList}>
                  {topRoutes.entries.map((r, i) => (
                    <div key={r.pair} className={styles.routeRow}>
                      <span className={styles.mono}>{r.pair}</span>
                      <div className={styles.miniTrack}>
                        <div className={styles.miniFill} style={{ width: `${(r.count / topRoutes.max) * 100}%`, opacity: 1 - i * 0.15 }} />
                      </div>
                      <span className={styles.miniVal}>{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Fleet time + Trails ── */}
        <div className={styles.gridEven}>
          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <span className={styles.panelTitle}>Fleet time</span>
              <span className={styles.mono} style={{ fontSize: 9.5, letterSpacing: '0.14em', color: 'var(--muted-2)' }}>
                {fleet.total} TYPES FLOWN
              </span>
            </div>
            <div className={styles.rowList}>
              {fleet.entries.map((f, i) => (
                <div key={f.type} className={styles.fleetRow}>
                  <span className={styles.b612}>{f.type}</span>
                  <div className={styles.track}>
                    <div
                      className={styles.trackFill}
                      style={{ width: `${(f.hours / fleet.max) * 100}%`, background: i < 2 ? '#C9A96E' : i < 4 ? '#5FAFB8' : '#3A4A50', opacity: 1 - i * 0.08 }}
                    />
                  </div>
                  <span className={styles.fleetVal}>{hm(f.hours)}</span>
                </div>
              ))}
              {fleet.entries.length === 0 && <span className={styles.emptyNote}>No approved flights yet.</span>}
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <div className={styles.trailsTitle}>
                <img src="/fonts/hero-vistaar.png" alt="" className={styles.trailsWordmark} />
                <span className={styles.panelTitle}>Trails</span>
              </div>
              <span className={styles.mono} style={{ fontSize: 9.5, letterSpacing: '0.14em', color: 'var(--muted-2)' }}>
                {trailStats.done} DONE · {trailStats.total - trailStats.done} REMAINING · ×{TRAIL_MULTIPLIER} PER LEG
              </span>
            </div>
            <div className={styles.trailSegments}>
              <div style={{ flex: Math.max(trailStats.done, 0.001), background: '#C9A96E' }} />
              <div style={{ flex: Math.max(trailStats.open, 0.001), background: '#5FAFB8' }} />
              <div style={{ flex: Math.max(trailStats.untouched, 0.001), background: '#1C2830' }} />
            </div>
            <div className={styles.rowList}>
              {trailStats.all.slice(0, 6).map((t) => {
                const complete = t.done >= t.legs
                return (
                  <div key={t.slug} className={styles.trailRow}>
                    <span style={{ color: t.done > 0 ? '#CFC6B6' : 'var(--muted-2)' }}>{t.name}</span>
                    <div className={styles.miniTrack}>
                      <div
                        className={styles.miniFill}
                        style={{ width: `${(t.done / t.legs) * 100}%`, background: complete ? '#C9A96E' : '#5FAFB8' }}
                      />
                    </div>
                    <span className={styles.miniVal} style={{ color: complete ? undefined : '#5FAFB8' }}>{t.done}/{t.legs}</span>
                  </div>
                )
              })}
            </div>
            <div className={styles.panelLink}>
              <a href="/operations/trails">All {trailStats.total} trails <span style={{ color: 'var(--gold)' }}>→</span></a>
            </div>
          </div>
        </div>

        {/* ── Career mode ── */}
        {identity.careerMode && career && (
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <div className={styles.careerHeading}>
                <span className={styles.invaCareerMark}>INVACareer</span>
                <span className={styles.archivo} style={{ fontSize: 25, letterSpacing: '-0.02em' }}>Career mode</span>
              </div>
              <span className={styles.enrolledTag}>ENROLLED</span>
            </div>
            <div className={styles.careerGrid}>
              <div className={`${styles.careerCol} ${styles.careerColBordered}`}>
                <div className={styles.eyebrow}>Home base</div>
                <div className={styles.mono} style={{ fontSize: 34, lineHeight: 1, marginTop: 8 }}>{career.homeBase || '—'}</div>
                {career.homeBaseCity && <div className={styles.homeBaseCity}>{career.homeBaseCity}</div>}
                <div className={styles.careerDivider} />
                <div className={styles.eyebrow} style={{ marginBottom: 10 }}>Type ratings</div>
                <div className={styles.ratingsCol}>
                  {career.typeRatings.length === 0 && <span className={styles.emptyNote}>None yet</span>}
                  {career.typeRatings.map((rating) => {
                    const ac = getAircraftByCode(rating)
                    return (
                      <div key={rating} className={styles.typeRating}>
                        {ac && <img src={ac.image} alt="" className={styles.typeRatingArt} />}
                        <span className={styles.b612} style={{ fontSize: 12.5 }}>{rating}</span>
                        <span style={{ flex: 1 }} />
                        <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>rated</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className={styles.careerCol}>
                <div className={styles.careerTopRow}>
                  <div>
                    <div className={styles.eyebrow}>Career rank</div>
                    <div style={{ fontWeight: 500, fontSize: 28, marginTop: 4 }}>{career.rank || '—'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className={styles.mono} style={{ fontSize: 24 }}>{hm(career.flightHours)}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      hours of flying experience
                      {careerProgress.nextRank && ` · ${hm(careerProgress.hoursToNext)} to ${careerProgress.nextRank}`}
                    </div>
                  </div>
                </div>
                {/* Ladder: every rung below the current rank is already achieved,
                    which is what stands in for a promotion history nobody stores. */}
                <div className={styles.careerLadder}>
                  {CAREER_RANKS.map((r, i) => {
                    const achieved = i <= careerProgress.index
                    const isCurrent = i === careerProgress.index
                    return (
                      <div key={r.rank} className={styles.careerRung}>
                        <div
                          className={styles.careerRungBar}
                          style={{
                            background: achieved ? 'var(--teal)' : 'var(--line-2)',
                            height: isCurrent ? 8 : 4,
                            marginTop: isCurrent ? -2 : 0,
                          }}
                        />
                        <span style={{ fontSize: 11.5, color: isCurrent ? 'var(--ink)' : achieved ? 'var(--muted)' : 'var(--muted-2)' }}>
                          {r.rank}
                        </span>
                      </div>
                    )
                  })}
                </div>

                <div className={styles.careerStats}>
                  <div><div className={styles.mono} style={{ fontSize: 19 }}>{career.totalFlights}</div><div className={styles.footSub}>career legs</div></div>
                  <div>
                    <div className={styles.mono} style={{ fontSize: 19 }}>
                      {career.landingPassRate != null ? `${career.landingPassRate}%` : '—'}
                    </div>
                    <div className={styles.footSub}>landing rate pass</div>
                  </div>
                  <div><div className={styles.mono} style={{ fontSize: 19 }}>{career.basesServed ?? '—'}</div><div className={styles.footSub}>bases served</div></div>
                  <div><div className={styles.mono} style={{ fontSize: 19 }}>{careerProgress.promotions}</div><div className={styles.footSub}>promotions</div></div>
                </div>
              </div>

              <div className={`${styles.careerCol} ${styles.careerColAside}`}>
                <div className={styles.eyebrow} style={{ marginBottom: 14 }}>Career Power badge</div>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ width: 60, height: 60, overflow: 'hidden', flex: 'none' }}>
                    <img src="/badges/badge3.webp" alt="Career Power" style={{ width: '200%', height: '100%', objectFit: 'cover', objectPosition: 'left' }} />
                  </div>
                  <div style={{ fontSize: 12.5, color: '#CFC6B6', lineHeight: 1.4 }}>
                    Unlocked at 40 career hours — the only badge that crosses the two ledgers.
                  </div>
                </div>

                {careerMonthly.months.some((m) => m.hours > 0) && (
                  <>
                    <div className={styles.careerDivider} />
                    <div className={styles.eyebrow} style={{ marginBottom: 12 }}>Career hours by month</div>
                    <div className={styles.careerBars}>
                      {careerMonthly.months.map((m, i) => (
                        <div
                          key={m.key}
                          style={{
                            flex: 1,
                            height: `${Math.max((m.hours / careerMonthly.max) * 100, m.hours > 0 ? 4 : 2)}%`,
                            background: i === careerMonthly.months.length - 1 ? 'var(--teal)' : '#2E4A50',
                          }}
                          title={`${m.key}: ${hm(m.hours)} h`}
                        />
                      ))}
                    </div>
                    <div className={styles.mono} style={{ fontSize: 9, color: 'var(--muted-2)', marginTop: 7 }}>
                      {careerMonthly.rangeLabel}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Logbook ── */}
        <div className={styles.section}>
          <div className={styles.sectionTitle} style={{ marginBottom: 16 }}>
            <h2>Logbook</h2>
            <span className={styles.sectionSub}>LAST {logbook?.length || 0} FLIGHTS</span>
          </div>
          <div className={styles.logList}>
            {(logbook || []).map((p, i) => (
              <div key={i} className={styles.logCard}>
                <div className={styles.logTop}>
                  <div className={styles.logId}>
                    <div className={styles.mono} style={{ fontSize: 15 }}>{p.flightNumber}</div>
                    <div className={styles.logSub}>{fmtDateLong(p.date)}</div>
                  </div>
                  <div className={styles.logRoute}>
                    <span className={styles.mono}>{p.departureIcao}</span>
                    <span className={styles.logDots} />
                    <span className={styles.mono}>{p.arrivalIcao}</span>
                  </div>
                  <div className={styles.logMeta}>
                    <div className={styles.mono} style={{ fontSize: 15 }}>
                      {fmtInterval(p.flightTime)}
                      {p.multiplier > 1 && <span style={{ color: '#5FAFB8', fontSize: 12 }}> ×{p.multiplier}</span>}
                    </div>
                    <div className={styles.logSub}>
                      <span className={styles.b612}>{p.aircraft}</span>
                      {p.trailName ? ` · ${p.trailName}` : ''}
                    </div>
                  </div>
                </div>
                <FlightTelemetry telemetry={p.telemetry} />
              </div>
            ))}
            {(!logbook || logbook.length === 0) && <span className={styles.emptyNote}>No approved flights yet.</span>}
          </div>
        </div>

        {/* ── Events ── */}
        {agg.eventsFlown > 0 && (
          <div className={styles.section} style={{ borderBottom: 'none' }}>
            <div className={styles.sectionTitle} style={{ marginBottom: 16 }}>
              <h2>Events</h2>
              <span className={styles.sectionSub}>{agg.eventsFlown} FLOWN</span>
            </div>
            <div className={styles.eventsGrid}>
              <div className={styles.eventsList}>
                {(agg.recentEvents || []).map((e, i) => (
                  <div key={i}>
                    {i > 0 && <div className={styles.eventDivider} />}
                    <div className={styles.eventRow}>
                      <span className={styles.eventDate}>{fmtDateShort(e.date)}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14.5 }}>{e.name}</div>
                        <div className={styles.eventMeta}>
                          {e.departureIcao}–{e.arrivalIcao} · <span className={styles.b612}>{e.aircraft}</span> · {hm(e.hours)}
                        </div>
                      </div>
                      <span className={styles.mono} style={{ fontSize: 11, color: 'var(--gold)' }}>×{e.multiplier}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.eventsAside}>
                <div className={styles.mono} style={{ fontSize: 9.5, letterSpacing: '0.16em', color: 'var(--muted-2)', marginBottom: 11 }}>
                  ATTENDANCE BY QUARTER
                </div>
                <div className={styles.quarterBars}>
                  {eventQuarters.quarters.map((q, i) => (
                    <div
                      key={q.key}
                      style={{
                        flex: 1,
                        height: `${Math.max((q.count / eventQuarters.max) * 100, 4)}%`,
                        background: i === eventQuarters.quarters.length - 1 ? '#C9A96E' : '#2E4A50',
                      }}
                      title={`${q.label}: ${q.count}`}
                    />
                  ))}
                </div>
                <div className={styles.quarterLabels}>
                  <span>{eventQuarters.quarters[0].label}</span>
                  <span>{eventQuarters.quarters[eventQuarters.quarters.length - 1].label}</span>
                </div>
                <div className={styles.quarterFooter}>
                  <div>
                    <div className={styles.mono} style={{ fontSize: 17 }}>{eventQuarters.thisQuarter}</div>
                    <div className={styles.footSub}>this quarter</div>
                  </div>
                  <div>
                    <div className={styles.mono} style={{ fontSize: 17 }}>×{eventQuarters.avgMultiplier.toFixed(2)}</div>
                    <div className={styles.footSub}>avg multiplier</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isOwner && editOpen && (
        <EditProfileModal
          initial={{ displayName: edits?.displayName || '', bio: edits?.bio || '', favAircraft: edits?.favAircraft || '' }}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
