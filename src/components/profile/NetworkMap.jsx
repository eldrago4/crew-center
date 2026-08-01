'use client'

import { useEffect, useRef } from 'react'

// Great-circle interpolation between two [lng, lat] points — same maths as the
// design's own initMap(), so arcs bend the way a real sector does instead of
// drawing a straight Mercator line.
function greatCircle(a, b, n = 64) {
  const toR = (d) => (d * Math.PI) / 180
  const toD = (r) => (r * 180) / Math.PI
  const [lo1, la1] = a.map(toR)
  const [lo2, la2] = b.map(toR)
  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((la2 - la1) / 2) ** 2 +
          Math.cos(la1) * Math.cos(la2) * Math.sin((lo2 - lo1) / 2) ** 2
      )
    )
  if (!d) return [a, b]
  const out = []
  for (let i = 0; i <= n; i++) {
    const f = i / n
    const A1 = Math.sin((1 - f) * d) / Math.sin(d)
    const B1 = Math.sin(f * d) / Math.sin(d)
    const x = A1 * Math.cos(la1) * Math.cos(lo1) + B1 * Math.cos(la2) * Math.cos(lo2)
    const y = A1 * Math.cos(la1) * Math.sin(lo1) + B1 * Math.cos(la2) * Math.sin(lo2)
    const z = A1 * Math.sin(la1) + B1 * Math.sin(la2)
    out.push([toD(Math.atan2(y, x)), toD(Math.atan2(z, Math.sqrt(x * x + y * y)))])
  }
  return out
}

export default function NetworkMap({ network }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el || !network?.sectors?.length) return

    let cancelled = false
    let map

    // Stylesheet is fired off separately and deliberately not awaited: if it ever
    // fails to resolve it must not take the map down with it.
    import('maplibre-gl/dist/maplibre-gl.css').catch(() => {})

    // Dynamic import so maplibre only loads on the profile page.
    import('maplibre-gl')
      .then((mod) => {
        if (cancelled) return
        const maplibregl = mod.default ?? mod

        const airports = network.airports || {}
        const topCount = network.sectors[0]?.count ?? 1

        const lines = {
          type: 'FeatureCollection',
          features: network.sectors.map((s) => ({
            type: 'Feature',
            properties: { w: s.count, top: s.count >= topCount ? 1 : 0 },
            geometry: { type: 'LineString', coordinates: greatCircle(airports[s.from], airports[s.to]) },
          })),
        }

        const points = {
          type: 'FeatureCollection',
          features: Object.entries(airports).map(([code, coords]) => ({
            type: 'Feature',
            properties: { code, hub: code === network.hub ? 1 : 0 },
            geometry: { type: 'Point', coordinates: coords },
          })),
        }

        const hubCoords = network.hub ? airports[network.hub] : null

        try {
          map = new maplibregl.Map({
            container: el,
            style: {
              version: 8,
              // A style with no `glyphs` cannot render a symbol layer's text —
              // adding the ICAO labels below would throw without it.
              glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
              sources: {
                base: {
                  type: 'raster',
                  tiles: ['https://basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png'],
                  tileSize: 256,
                  attribution: '© OpenStreetMap · © CARTO',
                },
              },
              layers: [
                { id: 'bg', type: 'background', paint: { 'background-color': '#0E1417' } },
                {
                  id: 'base',
                  type: 'raster',
                  source: 'base',
                  paint: { 'raster-opacity': 0.42, 'raster-saturation': -0.5, 'raster-contrast': 0.1 },
                },
              ],
            },
            center: hubCoords || [72, 22],
            zoom: 1.75,
            attributionControl: { compact: true },
            dragRotate: false,
          })
        } catch {
          return
        }

        mapRef.current = map
        // Previously swallowed, which hid exactly the kind of failure that leaves
        // the basemap up and the data layers missing.
        map.on('error', (e) => console.warn('[NetworkMap]', e?.error?.message || e))

        map.on('load', () => {
          if (cancelled) return

          // Each layer is added independently: a glyph or font failure on the
          // labels must not stop the arcs and dots from drawing.
          const addLayerSafely = (spec) => {
            try {
              map.addLayer(spec)
            } catch (err) {
              console.warn(`[NetworkMap] layer "${spec.id}" failed:`, err?.message || err)
            }
          }

          try {
            map.addSource('lines', { type: 'geojson', data: lines })
            map.addSource('pts', { type: 'geojson', data: points })
          } catch (err) {
            console.warn('[NetworkMap] source failed:', err?.message || err)
            return
          }

          addLayerSafely({
            id: 'arcs',
            type: 'line',
            source: 'lines',
            layout: { 'line-cap': 'round' },
            paint: {
              'line-color': ['case', ['==', ['get', 'top'], 1], '#C9A96E', '#5FAFB8'],
              // Floor of 1.2px: when every sector has been flown once the whole
              // set sits on the low stop, and sub-pixel lines read as no map at all.
              'line-width': ['interpolate', ['linear'], ['get', 'w'], 1, 1.2, Math.max(topCount, 2), 3],
              'line-opacity': ['case', ['==', ['get', 'top'], 1], 0.95, 0.6],
            },
          })
          addLayerSafely({
            id: 'dots',
            type: 'circle',
            source: 'pts',
            paint: {
              'circle-radius': ['case', ['==', ['get', 'hub'], 1], 6, 2.6],
              'circle-color': ['case', ['==', ['get', 'hub'], 1], 'rgba(0,0,0,0)', '#F1EADC'],
              'circle-opacity': ['case', ['==', ['get', 'hub'], 1], 1, 0.85],
              'circle-stroke-width': ['case', ['==', ['get', 'hub'], 1], 2, 0],
              'circle-stroke-color': '#C9A96E',
            },
          })
          addLayerSafely({
            id: 'labels',
            type: 'symbol',
            source: 'pts',
            layout: {
              'text-field': ['get', 'code'],
              'text-font': ['Noto Sans Regular'],
              'text-size': 9.5,
              'text-offset': [0, 1.2],
              'text-anchor': 'top',
              'text-letter-spacing': 0.12,
              'text-allow-overlap': false,
            },
            paint: { 'text-color': '#8C9AA0', 'text-halo-color': '#0E1417', 'text-halo-width': 1.2 },
          })
        })
        map.scrollZoom.disable()
      })
      .catch(() => {})

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [network])

  return <div ref={containerRef} style={{ height: 430, width: '100%', background: 'repeating-linear-gradient(115deg,#141D22 0 9px,#111A1F 9px 18px)' }} />
}
