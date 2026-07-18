'use client'

import { useState, useRef } from 'react'
import { TRAILS, TYPES, ICAO, aircraftBadges } from './trailsData'

// City → "City (ICAO)" for leg rows, when we have the code.
function withIcao(city) {
  const code = ICAO[city]
  return code ? `${city} (${code})` : city
}

const GROUPED = TYPES.map(t => ({
  ...t,
  items: TRAILS.filter(x => x.type === t.key),
})).filter(g => g.items.length)

// ─── Left index item ────────────────────────────────────────────────────────────

function IndexItem({ trail, selected, onSelect }) {
  const Icon = trail.icon
  const badges = aircraftBadges(trail).slice(0, 4)
  return (
    <button
      type="button"
      onClick={() => onSelect(trail.id)}
      className="trd-item"
      style={{
        background: selected ? trail.bg : 'transparent',
        borderColor: selected ? trail.border : 'transparent',
      }}
    >
      <span
        className="trd-item-icon"
        style={{ background: trail.bg, borderColor: trail.border, color: trail.color }}
      >
        <Icon />
      </span>
      <span className="trd-item-text">
        <span className="trd-item-name">{trail.name}</span>
        <span className="trd-item-tag" style={{ color: trail.color }}>{trail.tagline}</span>
        <span className="trd-item-meta">{trail.region} · {trail.stat}</span>
        <span className="trd-item-badges">
          {badges.map(b => (
            <span key={b} style={{ background: trail.bg, border: `1px solid ${trail.border}`, color: trail.color }}>{b}</span>
          ))}
        </span>
      </span>
    </button>
  )
}

// ─── Right detail pane ──────────────────────────────────────────────────────────

function DetailPane({ trail }) {
  const Icon = trail.icon
  const badges = aircraftBadges(trail)
  return (
    <div className="trd-detail-inner">
      <div className="trd-detail-head">
        <span
          className="trd-detail-icon"
          style={{ background: trail.bg, borderColor: trail.border, color: trail.color }}
        >
          <Icon />
        </span>
        <div className="trd-detail-head-right">
          <div className="trd-detail-region" style={{ color: trail.color }}>{trail.region}</div>
          <div className="trd-detail-stat">{trail.stat}</div>
        </div>
      </div>

      <h2 className="trd-detail-name">{trail.name}</h2>
      <p className="trd-detail-tag" style={{ color: trail.color }}>{trail.tagline}</p>

      <div className="trd-detail-aircraft">
        <span className="trd-label">Aircraft</span>
        {badges.map(b => (
          <span key={b} className="trd-ac-badge" style={{ background: trail.bg, border: `1px solid ${trail.border}`, color: trail.color }}>{b}</span>
        ))}
      </div>

      <p className="trd-detail-desc">{trail.description}</p>

      {trail.itinerary && (
        <div className="trd-block">
          <div className="trd-label">Flight plan</div>
          <div className="trd-itinerary" style={{ background: trail.bg, border: `1px solid ${trail.border}` }}>
            {trail.itinerary.map((line, i) =>
              line === ''
                ? <div key={i} style={{ height: 6 }} />
                : <div key={i}>{line}</div>
            )}
          </div>
        </div>
      )}

      <div className="trd-block">
        <div className="trd-label">{trail.sequenced ? 'All legs' : 'Recommended legs'}</div>
        <div className="trd-legs">
          {trail.legs.map((l, i) => (
            <div className="trd-leg" key={l.fn + i}>
              <span className="trd-leg-fn">{l.fn}</span>
              <span className="trd-leg-route">
                {withIcao(l.from)} <span className="trd-leg-arrow">→</span> {withIcao(l.to)}
                <span className="trd-leg-ac"> · {l.ac}</span>
              </span>
              <span className="trd-leg-block">{l.block}</span>
              {l.note && <div className="trd-leg-note" style={{ color: trail.color }}>{l.note}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Directory (split view) ──────────────────────────────────────────────────────

export default function TrailsDirectory() {
  const [selectedId, setSelectedId] = useState(TRAILS[0].id)
  const detailRef = useRef(null)
  const selected = TRAILS.find(t => t.id === selectedId) || TRAILS[0]

  function handleSelect(id) {
    setSelectedId(id)
    // On stacked (mobile) layout the detail sits below the index — bring it into view.
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 899px)').matches) {
      requestAnimationFrame(() => {
        detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }

  return (
    <section className="trd-wrap">
      <style>{STYLES}</style>
      <div className="trd-split">
        {/* Grouped index */}
        <aside className="trd-index" aria-label="Trail directory">
          {GROUPED.map(group => (
            <div className="trd-group" key={group.key}>
              <div className="trd-group-head">{group.title} · {group.items.length}</div>
              <div className="trd-group-items">
                {group.items.map(trail => (
                  <IndexItem
                    key={trail.id}
                    trail={trail}
                    selected={trail.id === selectedId}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            </div>
          ))}
        </aside>

        {/* Detail */}
        <div className="trd-detail" ref={detailRef}>
          <DetailPane trail={selected} />
        </div>
      </div>
    </section>
  )
}

// ─── Styles ─────────────────────────────────────────────────────────────────────

const STYLES = `
  .trd-wrap { max-width: 1240px; margin: 0 auto; padding: 40px 24px 64px; }
  .trd-split {
    display: flex;
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(15,23,42,0.06);
  }

  /* Index */
  .trd-index {
    width: 340px;
    flex-shrink: 0;
    border-right: 1px solid #E2E8F0;
    background: #FBFBFA;
    max-height: 760px;
    overflow-y: auto;
    padding: 20px 14px;
    box-sizing: border-box;
  }
  .trd-group { margin-bottom: 22px; }
  .trd-group:last-child { margin-bottom: 0; }
  .trd-group-head {
    font-size: 10.5px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase;
    color: #94A3B8; padding: 0 10px 8px;
  }
  .trd-group-items { display: flex; flex-direction: column; gap: 2px; }

  .trd-item {
    display: flex; gap: 11px; align-items: flex-start; text-align: left;
    width: 100%; padding: 10px; border-radius: 12px; cursor: pointer;
    border: 1px solid transparent; background: transparent;
    font-family: inherit; transition: background .15s ease, border-color .15s ease;
  }
  .trd-item:hover { background: #F1F5F9; }
  .trd-item-icon {
    width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    border: 1px solid; font-size: 14px;
  }
  .trd-item-text { min-width: 0; display: flex; flex-direction: column; }
  .trd-item-name {
    font-size: 14px; font-weight: 700; color: #0F172A; line-height: 1.25;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .trd-item-tag {
    font-size: 11px; font-style: italic; margin: 1px 0;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .trd-item-meta { font-size: 11px; color: #94A3B8; }
  .trd-item-badges { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 5px; }
  .trd-item-badges span {
    font-size: 9.5px; font-weight: 700; padding: 2px 6px; border-radius: 5px;
  }

  /* Detail */
  .trd-detail { flex: 1; min-width: 0; max-height: 760px; overflow-y: auto; background: #FFFFFF; }
  .trd-detail-inner { padding: 36px 40px 44px; }
  .trd-detail-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .trd-detail-icon {
    width: 54px; height: 54px; border-radius: 15px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    border: 1px solid; font-size: 22px;
  }
  .trd-detail-head-right { text-align: right; flex-shrink: 0; }
  .trd-detail-region { font-size: 10.5px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
  .trd-detail-stat { font-size: 12px; color: #94A3B8; margin-top: 3px; }
  .trd-detail-name {
    font-size: 34px; font-weight: 900; letter-spacing: -0.03em; color: #0F172A;
    margin: 20px 0 6px; line-height: 1.05; text-wrap: balance;
  }
  .trd-detail-tag { font-size: 15px; font-weight: 600; font-style: italic; margin: 0; line-height: 1.4; }

  .trd-detail-aircraft { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; row-gap: 8px; margin-top: 18px; }
  .trd-ac-badge { font-size: 11.5px; font-weight: 700; padding: 4px 9px; border-radius: 6px; }

  .trd-label { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #94A3B8; }
  .trd-detail-aircraft .trd-label { margin-right: 4px; }

  .trd-detail-desc { font-size: 15px; color: #475569; line-height: 1.75; margin: 18px 0 0; }

  .trd-block { margin-top: 22px; }
  .trd-block .trd-label { margin-bottom: 6px; }
  .trd-itinerary {
    border-radius: 10px; padding: 14px 16px; color: #334155;
    font-family: 'SF Mono', 'Courier New', monospace; font-size: 12.5px; line-height: 1.8;
    display: flex; flex-direction: column;
  }

  .trd-legs { display: flex; flex-direction: column; }
  .trd-leg {
    display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap;
    padding: 10px 0; border-top: 1px solid #F1F5F9; font-size: 14.5px;
  }
  .trd-leg-fn { font-weight: 700; color: #0F172A; flex-shrink: 0; font-variant-numeric: tabular-nums; }
  .trd-leg-route { color: #475569; flex: 1; min-width: 220px; }
  .trd-leg-arrow { color: #CBD5E1; }
  .trd-leg-ac { color: #94A3B8; }
  .trd-leg-block { color: #94A3B8; font-size: 12.5px; flex-shrink: 0; font-variant-numeric: tabular-nums; }
  .trd-leg-note { width: 100%; font-size: 12.5px; font-style: italic; }

  @media (max-width: 1023px) {
    .trd-wrap { padding: 32px 20px 52px; }
    .trd-index { width: 300px; }
    .trd-detail-inner { padding: 30px 30px 38px; }
  }

  @media (max-width: 899px) {
    .trd-wrap { padding: 28px 16px 44px; }
    .trd-split { flex-direction: column; }
    .trd-index {
      width: 100%; max-height: none; border-right: none; border-bottom: 1px solid #E2E8F0;
    }
    .trd-detail { max-height: none; scroll-margin-top: 12px; }
    .trd-detail-name { font-size: 28px; }
    .trd-detail-inner { padding: 26px 20px 34px; }
  }
`
