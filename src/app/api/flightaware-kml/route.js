import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

function parseKmlWaypoints(kml) {
    const points = []

    // Format 1: <gx:coord>lon lat alt</gx:coord>  (inside gx:Track)
    const gxRe = /<gx:coord>([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)<\/gx:coord>/g
    let m
    while ((m = gxRe.exec(kml)) !== null) {
        points.push({ lon: parseFloat(m[1]), lat: parseFloat(m[2]), altM: parseFloat(m[3]) })
    }
    if (points.length > 0) return points

    // Format 2: <coordinates>lon,lat,alt lon,lat,alt...</coordinates>
    const lsMatch = kml.match(/<coordinates>([\s\S]*?)<\/coordinates>/)
    if (lsMatch) {
        for (const entry of lsMatch[1].trim().split(/\s+/)) {
            const parts = entry.split(',')
            if (parts.length >= 3) {
                const lon = parseFloat(parts[0])
                const lat = parseFloat(parts[1])
                const altM = parseFloat(parts[2])
                if (!isNaN(lat) && !isNaN(lon)) points.push({ lat, lon, altM })
            }
        }
    }

    return points
}

function formatWaypoint(lat, lon, altM) {
    const altFt = altM * 3.28084
    const fl = Math.round(altFt / 100)
    if (fl < 50) return null  // skip ground / low-altitude points

    const latAbs = Math.abs(lat)
    const latDeg = Math.floor(latAbs)
    const latMin = Math.floor((latAbs - latDeg) * 60)
    const latHem = lat >= 0 ? 'N' : 'S'

    const lonAbs = Math.abs(lon)
    const lonDeg = Math.floor(lonAbs)
    const lonMin = Math.floor((lonAbs - lonDeg) * 60)
    const lonHem = lon >= 0 ? 'E' : 'W'

    const latStr = `${String(latDeg).padStart(2, '0')}${String(latMin).padStart(2, '0')}${latHem}`
    const lonStr = `${String(lonDeg).padStart(3, '0')}${String(lonMin).padStart(2, '0')}${lonHem}`

    return `${latStr}${lonStr}/F${fl}`
}

export async function POST(request) {
    const session = await auth()
    if (!session?.user?.callsign) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let url, kmlContent
    try { ({ url, kmlContent } = await request.json()) } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    let kml
    if (kmlContent) {
        // Direct KML content from file upload
        kml = kmlContent
    } else if (url) {
        if (!url.includes('flightaware.com')) {
            return NextResponse.json({ error: 'Must be a flightaware.com URL' }, { status: 400 })
        }
        const kmlUrl = url.replace(/\/google_earth\/?$/, '').replace(/\/$/, '') + '/google_earth'
        try {
            const res = await fetch(kmlUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; INVACrewCenter/1.0)' },
                cache: 'no-store',
                signal: AbortSignal.timeout(15000),
            })
            if (!res.ok) return NextResponse.json({ error: `FlightAware returned ${res.status}` }, { status: 502 })
            kml = await res.text()
        } catch (err) {
            return NextResponse.json({ error: `Fetch failed: ${err.message}` }, { status: 502 })
        }
    } else {
        return NextResponse.json({ error: 'Provide a flightaware.com URL or KML file content' }, { status: 400 })
    }

    let waypoints = parseKmlWaypoints(kml)
    if (waypoints.length === 0) {
        return NextResponse.json({ error: 'No waypoints found in KML' }, { status: 422 })
    }

    // Keep only cruise-altitude points (above ~5000 ft / 1500 m)
    waypoints = waypoints.filter(w => w.altM > 1500)
    if (waypoints.length === 0) {
        return NextResponse.json({ error: 'No cruise-altitude waypoints found' }, { status: 422 })
    }

    // Sample up to 12 evenly-spaced waypoints across the cruise portion
    const target = Math.min(12, waypoints.length)
    const step = Math.max(1, Math.floor(waypoints.length / target))
    const sampled = []
    for (let i = 0; i < waypoints.length && sampled.length < target; i += step) {
        sampled.push(waypoints[i])
    }

    const routeParts = sampled.map(w => formatWaypoint(w.lat, w.lon, w.altM)).filter(Boolean)
    if (routeParts.length === 0) {
        return NextResponse.json({ error: 'Could not format any waypoints' }, { status: 422 })
    }

    return NextResponse.json({ route: routeParts.join(' ') })
}
