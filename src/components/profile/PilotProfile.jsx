'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import styles from './pilotProfile.module.css'
import EditProfileModal from './EditProfileModal'
import { getAircraftById, getAirlineById } from '@/data/fleet'
import { TRAIL_META } from '@/app/shared/trails'
import {
  RANKS, RAJMATYA_HOURS, AKASHARATHA_HOURS,
  getRankBg, getRankColor, getRankProgress,
} from '@/lib/ranks'
import { getCurrentSeason, loadPixelFont, drawDynamicBadge, BADGE_DEFINITIONS, BADGE_INDEX_TO_ID } from '@/lib/badgeArt'

// ── Formatting helpers ────────────────────────────────────────────────────────

function fmtHoursMin(hours) {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return { h, m }
}

function fmtInterval(interval) {
  if (!interval) return '0:00'
  const [h, m] = String(interval).split(':')
  return `${parseInt(h) || 0}:${String(parseInt(m) || 0).padStart(2, '0')}`
}

function fmtDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function fmtDateLong(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}

const OPERATOR_META = [
  { key: 'airIndia', label: 'Air India', color: '#C9A96E' },
  { key: 'airIndiaExpress', label: 'Air India Express', color: '#5FAFB8' },
  { key: 'vistara', label: 'Vistara', color: '#8B7FD1' },
  { key: 'other', label: 'Other / codeshare', color: '#3A4A50' },
]

// ── Badge rendering (client canvas compositing, reused from badgeArt.js) ────────

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
  const isWide = badge.isCombinedDoubleSided

  return (
    <button
      type="button"
      className={styles.cabinetTile}
      onClick={() => canFlip && setFlipped((p) => !p)}
      title={badge.label}
      style={{ width: size, height: size, position: 'relative', perspective: 800, background: 'none', border: 'none', padding: 0 }}
    >
      <div style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d', transition: 'transform 400ms ease', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
        <img
          src={frontSrc}
          alt={badge.label}
          style={{
            position: 'absolute', inset: 0, width: isWide ? '200%' : '100%', height: '100%',
            objectFit: isWide ? 'cover' : 'contain', objectPosition: isWide ? 'left' : undefined,
            backfaceVisibility: 'hidden',
          }}
        />
        {canFlip && backSrc && (
          <img
            src={backSrc}
            alt={`${badge.label} back`}
            style={{
              position: 'absolute', inset: 0, width: isWide ? '200%' : '100%', height: '100%',
              objectFit: isWide ? 'cover' : 'contain', objectPosition: isWide ? 'right' : undefined,
              backfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
            }}
          />
        )}
      </div>
    </button>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function PilotProfile({ callsign, identity, edits, agg, trails, career, logbook, viewer = {} }) {
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

  const isActive = identity.lastActive
    ? Date.now() - new Date(identity.lastActive).getTime() < 15 * 60 * 1000
    : false

  const { h, m } = fmtHoursMin(identity.hours)
  const rankProgress = getRankProgress(identity.hours)
  const rankColor = getRankColor(identity.rank)
  const rankBg = getRankBg(identity.rank)

  const badgeList = BADGE_DEFINITIONS.filter((b) => identity.badges.includes(BADGE_INDEX_TO_ID.indexOf(b.id)))
  const aircraft = edits?.favAircraft ? getAircraftById(edits.favAircraft) : null
  const airline = aircraft ? getAirlineById(aircraft.airline) : null

  const isRajmatya = identity.hours >= RAJMATYA_HOURS
  const isAakashratha = identity.hours >= AKASHARATHA_HOURS

  const operatorTotal = OPERATOR_META.reduce((sum, o) => sum + (agg.operatorHours?.[o.key] || 0), 0)
  let acc = 0
  const donutStops = OPERATOR_META.map((o) => {
    const val = agg.operatorHours?.[o.key] || 0
    const pct = operatorTotal > 0 ? (val / operatorTotal) * 100 : 0
    const from = acc
    acc += pct
    return { ...o, val, pct, from, to: acc }
  })
  const donutGradient = operatorTotal > 0
    ? `conic-gradient(${donutStops.map((s) => `${s.color} ${s.from}% ${s.to}%`).join(', ')})`
    : '#1C2830'

  const sortedTrails = Object.entries(TRAIL_META)
    .map(([slug, meta]) => ({ slug, ...meta, done: trails?.[slug] || 0 }))
    .sort((a, b) => (b.done / b.legs) - (a.done / a.legs))
  const trailsCompleted = sortedTrails.filter((t) => t.done >= t.legs).length

  const publicUrl = `https://indianvirtual.com/team/${callsign}`

  const copyLink = () => {
    navigator.clipboard?.writeText(publicUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className={styles.page}>
      <div className={`${styles.tierBg} ${styles.base}`} />
      <div className={`${styles.tierBg}`} style={{ background: rankBg }} />

      <div className={styles.inner}>
        {showBack && (
          <div className={styles.backRow}>
            <button type="button" className={styles.backBtn} onClick={() => router.back()}>
              ← Back
            </button>
          </div>
        )}

        {/* ── Header ── */}
        <div className={styles.header}>
          <div>
            <div className={styles.eyebrow}>Total Flight Time</div>
            <div className={styles.statLine}>
              <span className={`${styles.mono} ${styles.big}`}>{h}</span>
              <span className={styles.unit}>h {m}m</span>
            </div>
            <div className={styles.rule} />
            <div className={styles.metaRow}>
              <div className={styles.metaItem}>
                <div className={`${styles.mono} ${styles.val}`}>#{identity.rankPosition}</div>
                <div className={styles.lbl}>leaderboard rank</div>
              </div>
              <div className={styles.metaItem}>
                <div className={`${styles.mono} ${styles.val}`}>{agg.approvedCount}</div>
                <div className={styles.lbl}>approved flights</div>
              </div>
              <div className={styles.metaItem}>
                <div className={`${styles.mono} ${styles.val}`}>{fmtDate(agg.joinedDate)}</div>
                <div className={styles.lbl}>joined</div>
              </div>
            </div>
            {edits?.bio && <p className={styles.bio}>{edits.bio}</p>}
          </div>

          <div className={styles.avatarWrap}>
            <div className={styles.avatarRing}>
              <div className={styles.ringOuter} />
              <div className={styles.ringInner}>
                {avatarUrl && <img src={avatarUrl} alt={displayName} />}
              </div>
              {isActive && (
                <div className={styles.activeDot}>
                  <span className={styles.dot} />
                  <span>ACTIVE</span>
                </div>
              )}
            </div>

            <div className={styles.nameRow}>
              <span className={styles.callsignChip}>{callsign}</span>
              <span className={styles.name}>{displayName}</span>
            </div>

            <div className={styles.rankRow}>
              <span className={styles.bar} />
              <span className={styles.rankLabel} style={{ color: rankColor }}>{identity.rank}</span>
              <span className={styles.bar} />
            </div>

            {badgeList.length > 0 && (
              <div className={styles.badgeRow}>
                {badgeList.map((b) => (
                  <div key={b.id} className={styles.badgeTileSm}>
                    <img src={b.image} alt={b.label} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.linksCol}>
            {aircraft && (
              <div className={styles.aircraftCard}>
                <div className={styles.aircraftHead}>
                  <span className={styles.eyebrow}>Favourite Aircraft</span>
                  <span className={styles.b612} style={{ color: '#C9A96E' }}>{aircraft.type}{airline ? ` · ${airline.name}` : ''}</span>
                </div>
                <div className={styles.aircraftFrame}>
                  <Image src={aircraft.image} alt={aircraft.type} fill sizes="380px" />
                </div>
              </div>
            )}
            <div className={styles.linkBar}>
              <div className={styles.linkGroup}>
                {identity.discordId && (
                  <a className={styles.linkItem} href={`https://discord.com/users/${identity.discordId}`} target="_blank" rel="noreferrer">
                    Discord
                  </a>
                )}
                <span className={styles.linkSep} />
                <a className={styles.linkItem} href={`https://community.infiniteflight.com/new-message?username=${encodeURIComponent(identity.ifcName)}`} target="_blank" rel="noreferrer">
                  Forum
                </a>
                <span className={styles.linkSep} />
                <button type="button" className={styles.linkItem} onClick={copyLink} style={{ flex: '0 0 42px' }}>
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

        {/* ── Climb ladder ── */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionTitle}>
              <h2>The climb</h2>
              <span className={styles.sectionSub}>RANK BY LOGGED HOURS</span>
            </div>
            {rankProgress.nextRank && (
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                {fmtInterval(`${Math.floor(rankProgress.hoursToNext)}:${Math.round((rankProgress.hoursToNext % 1) * 60)}`)}h to <span style={{ color: 'var(--ink)' }}>{rankProgress.nextRank}</span>
              </span>
            )}
          </div>
          <div className={styles.ladder}>
            {RANKS.map((r, i) => {
              const isCurrent = r.rank === rankProgress.rank
              const heightPct = 12 + (i / (RANKS.length - 1)) * 88
              return (
                <div key={r.rank} className={isCurrent ? styles.ladderColYou : styles.ladderCol}>
                  {isCurrent && <div className={styles.ladderYouTag}>YOU ARE HERE · {Math.round(rankProgress.percent)}%</div>}
                  <div className={styles.ladderBar} style={{ height: `${heightPct}px`, opacity: isCurrent ? 1 : 0.3 + (i / RANKS.length) * 0.4 }} />
                  <div className={styles.ladderName} style={{ color: isCurrent ? 'var(--ink)' : undefined }}>{r.rank}</div>
                  <div className={styles.ladderHours}>{r.hours}h</div>
                </div>
              )
            })}
            <div className={styles.ladderCol}>
              <div className={`${styles.ladderBar} ${styles.ladderTarget}`} style={{ height: '96px', background: 'none' }} />
              <div className={styles.ladderName}>Chhatrapati</div>
              <div className={styles.ladderHours}>2000h</div>
            </div>
          </div>
        </div>

        {/* ── Clubs + Badge cabinet ── */}
        <div className={styles.section} style={{ display: 'grid', gridTemplateColumns: badgeList.length > 2 ? '1fr 1fr' : '1fr', gap: 28 }}>
          <div>
            <div className={styles.eyebrow} style={{ marginBottom: 14 }}>Clubs</div>
            <div className={styles.clubsCol}>
              <div className={`${styles.clubCard} ${isRajmatya ? styles.clubCardMember : ''}`}>
                <div className={styles.clubDisc} style={{ background: isRajmatya ? 'radial-gradient(circle at 34% 30%, #5E5236, #231F16)' : '#1C2830', border: `1px solid ${isRajmatya ? '#6B5C3C' : '#2A3941'}` }} />
                <div style={{ flex: 1 }}>
                  <div className={styles.clubName} style={{ color: isRajmatya ? undefined : 'var(--muted)' }}>Rajmatya Club</div>
                  <div className={styles.clubMeta}>{RAJMATYA_HOURS} h and above</div>
                </div>
                <div className={`${styles.clubTag} ${isRajmatya ? styles.clubTagOn : styles.clubTagOff}`}>{isRajmatya ? 'MEMBER' : 'LOCKED'}</div>
              </div>
              <div className={`${styles.clubCard} ${isAakashratha ? styles.clubCardMember : ''}`}>
                <div className={styles.clubDisc} style={{ background: isAakashratha ? 'radial-gradient(circle at 34% 30%, #5E5236, #231F16)' : '#1C2830', border: `1px solid ${isAakashratha ? '#6B5C3C' : '#2A3941'}` }} />
                <div style={{ flex: 1 }}>
                  <div className={styles.clubName} style={{ color: isAakashratha ? undefined : 'var(--muted)' }}>Aakashratha Club</div>
                  <div className={styles.clubMeta}>
                    {AKASHARATHA_HOURS} h and above{!isAakashratha ? ` · ${(AKASHARATHA_HOURS - identity.hours).toFixed(0)}h remaining` : ''}
                  </div>
                </div>
                <div className={`${styles.clubTag} ${isAakashratha ? styles.clubTagOn : styles.clubTagOff}`}>{isAakashratha ? 'MEMBER' : 'LOCKED'}</div>
              </div>
            </div>
          </div>

          {badgeList.length > 2 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <span className={styles.eyebrow}>Badge cabinet</span>
                <span className={styles.mono} style={{ fontSize: 9.5, color: 'var(--muted-2)' }}>{badgeList.length} EARNED</span>
              </div>
              <div className={styles.cabinet}>
                {badgeList.map((b) => (
                  <ProfileBadge key={b.id} badge={b} ifcName={identity.ifcName} season={season} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Stats strip ── */}
        <div className={styles.statsStrip}>
          <div className={styles.statCell}><div className={styles.mono} style={{ fontSize: 23 }}>{agg.airportsVisited.length}</div><div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>airports visited</div></div>
          <div className={styles.statCell}><div className={`${styles.mono}`} style={{ fontSize: 23 }}>{agg.countries.length}</div><div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>countries</div></div>
          <div className={styles.statCell}><div className={styles.mono} style={{ fontSize: 23 }}>{agg.uniqueRoutes.length}</div><div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>unique routes</div></div>
          <div className={styles.statCell}><div className={styles.mono} style={{ fontSize: 23 }}>{agg.eventsFlown}</div><div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>events flown</div></div>
          <div className={styles.statCell}><div className={styles.mono} style={{ fontSize: 23 }}>{trailsCompleted}<span style={{ color: 'var(--muted-2)', fontSize: 16 }}>/{Object.keys(TRAIL_META).length}</span></div><div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>trails completed</div></div>
          <div className={styles.statCell}>
            <div className={styles.mono} style={{ fontSize: 23 }}>{agg.longestFlight ? fmtInterval(`${Math.floor(agg.longestFlight.hours)}:${Math.round((agg.longestFlight.hours % 1) * 60)}`) : '—'}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>longest{agg.longestFlight ? ` · ${agg.longestFlight.departureIcao}–${agg.longestFlight.arrivalIcao}` : ''}</div>
          </div>
        </div>

        {/* ── Where the hours went ── */}
        {operatorTotal > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <div className={styles.sectionTitle}><h2>Where the hours went</h2></div>
            </div>
            <div className={styles.donutRow}>
              <div className={styles.donut} style={{ background: donutGradient }}>
                <div className={styles.donutHole}>
                  <span className={styles.mono} style={{ fontSize: 16 }}>{agg.approvedCount}</span>
                  <span style={{ fontSize: 9.5, color: 'var(--muted)', letterSpacing: '0.08em' }}>FLIGHTS</span>
                </div>
              </div>
              <div className={styles.legend}>
                {donutStops.filter((s) => s.val > 0).map((s) => (
                  <div key={s.key} className={styles.legendRow}>
                    <span className={styles.legendSwatch} style={{ background: s.color }} />
                    <span className={styles.legendLbl}>{s.label}</span>
                    <span className={styles.legendVal}>{Math.round(s.val)}h</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Trails ── */}
        <div className={styles.section}>
          <div className={styles.trailsHead}>
            <img src="/fonts/hero-vistaar.png" alt="" className={styles.trailsWordmark} />
            <div className={styles.sectionTitle}>
              <h2>Trails</h2>
              <span className={styles.sectionSub}>{trailsCompleted} DONE · {Object.keys(TRAIL_META).length - trailsCompleted} OPEN</span>
            </div>
          </div>
          <div className={styles.trailRows}>
            {sortedTrails.slice(0, 6).map((t) => (
              <div key={t.slug} className={styles.trailRow}>
                <span style={{ color: t.done > 0 ? '#CFC6B6' : 'var(--muted-2)' }}>{t.name}</span>
                <div className={styles.trailBar}>
                  <div
                    className={`${styles.trailBarFill} ${t.done >= t.legs ? styles.trailBarFillDone : ''}`}
                    style={{ width: `${(t.done / t.legs) * 100}%` }}
                  />
                </div>
                <span className={styles.trailCount}>{t.done}/{t.legs}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, fontSize: 12, color: 'var(--muted)' }}>
            <a href="/operations/trails">All {Object.keys(TRAIL_META).length} trails →</a>
          </div>
        </div>

        {/* ── Career mode ── */}
        {identity.careerMode && career && (
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.archivo} style={{ fontSize: 24, letterSpacing: '-0.02em' }}>Career mode</span>
              <span className={styles.mono} style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--teal)', border: '1px solid rgba(95,175,184,0.4)', padding: '4px 9px', borderRadius: 3 }}>ENROLLED</span>
            </div>
            <div className={styles.careerGrid}>
              <div className={`${styles.careerCol} ${styles.careerColBordered}`}>
                <div className={styles.eyebrow}>Home base</div>
                <div className={styles.mono} style={{ fontSize: 30, marginTop: 6 }}>{career.homeBase || '—'}</div>
                <div style={{ height: 1, background: 'var(--line-2)', margin: '16px 0' }} />
                <div className={styles.eyebrow} style={{ marginBottom: 10 }}>Type ratings</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {career.typeRatings.length === 0 && <span style={{ fontSize: 12, color: 'var(--muted)' }}>None yet</span>}
                  {career.typeRatings.map((rating) => (
                    <div key={rating} className={styles.typeRating}>
                      <span className={styles.b612} style={{ fontSize: 12.5 }}>{rating}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.careerCol}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <div>
                    <div className={styles.eyebrow}>Career rank</div>
                    <div style={{ fontWeight: 500, fontSize: 26, marginTop: 4 }}>{career.rank || '—'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className={styles.mono} style={{ fontSize: 22 }}>{Number(career.flightHours).toFixed(2)}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>career hours</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--line-2)' }}>
                  <div><div className={styles.mono} style={{ fontSize: 18 }}>{career.totalFlights}</div><div style={{ fontSize: 10.5, color: 'var(--muted)' }}>career legs</div></div>
                  <div><div className={styles.mono} style={{ fontSize: 18 }}>₹{Number(career.careerEarnings).toLocaleString('en-IN')}</div><div style={{ fontSize: 10.5, color: 'var(--muted)' }}>career earnings</div></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Logbook ── */}
        <div className={styles.section} style={{ borderBottom: 'none' }}>
          <div className={styles.sectionTitle} style={{ marginBottom: 16 }}>
            <h2>Logbook</h2>
            <span className={styles.sectionSub}>LAST {logbook?.length || 0} APPROVED FLIGHTS</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(logbook || []).map((p, i) => (
              <div key={i} className={styles.logRow}>
                <div style={{ minWidth: 100 }}>
                  <div className={styles.mono} style={{ fontSize: 15 }}>{p.flightNumber}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 3 }}>{fmtDateLong(p.date)}</div>
                </div>
                <div className={styles.logRoute}>
                  <span className={styles.mono} style={{ fontSize: 18 }}>{p.departureIcao}</span>
                  <span className={styles.logDots} />
                  <span className={styles.mono} style={{ fontSize: 18 }}>{p.arrivalIcao}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--muted)' }}>
                  <span>{p.aircraft}</span>
                  <span className={styles.mono}>{fmtInterval(p.flightTime)}h</span>
                </div>
              </div>
            ))}
            {(!logbook || logbook.length === 0) && (
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>No approved flights yet.</span>
            )}
          </div>
        </div>
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
