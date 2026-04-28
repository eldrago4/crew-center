import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const AVOID_FIRS = 'OPLR,OPKR,LLLL,OSTT,EGRON,BIVIN,PASTA,PG,BIREX,IDEBA,SK,RK,MERUN'

function md5(str) {
    return crypto.createHash('md5').update(str).digest('hex')
}

export async function POST(request) {
    const session = await auth()
    if (!session?.user?.callsign) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apiKey = process.env.SIMBRIEF_API_KEY
    if (!apiKey) {
        return NextResponse.json({ error: 'SimBrief API key not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { orig, dest, type, airframeId, fltnum, airline, route, fl, units,
            contpct, resvrule, navlog, etops, stepclimbs, tlr, notams, maps,
            date, deph, depm, ci, pax, cargo } = body

    if (!orig || orig.length !== 4) return NextResponse.json({ error: 'Invalid origin ICAO' }, { status: 400 })
    if (!dest || dest.length !== 4) return NextResponse.json({ error: 'Invalid destination ICAO' }, { status: 400 })
    if (!type) return NextResponse.json({ error: 'Aircraft type required' }, { status: 400 })
    if (orig.toUpperCase() === dest.toUpperCase()) return NextResponse.json({ error: 'Origin and destination cannot be the same' }, { status: 400 })

    const outputPage = 'https://indianvirtual.site/crew/plan/simbrief'
    const timestamp = Math.floor(Date.now() / 1000)

    // SimBrief API code: MD5(apiKey + orig + dest + type + timestamp + outputPage)
    const typeForHash = (airframeId || type).toUpperCase()
    const apiCode = md5(apiKey + orig.toUpperCase() + dest.toUpperCase() + typeForHash + timestamp + outputPage)

    const params = {
        apicode: apiCode,
        outputpage: outputPage,
        timestamp,
        orig: orig.toUpperCase(),
        dest: dest.toUpperCase(),
        type: airframeId || type.toUpperCase(),
        avoid: AVOID_FIRS,
        airline: airline || 'INVA',
        units: units || 'KGS',
        ...(fltnum && { fltnum }),
        ...(route && { route }),
        ...(fl && { fl }),
        ...(contpct !== undefined && { contpct }),
        ...(resvrule && { resvrule }),
        ...(navlog !== undefined && { navlog: navlog ? 1 : 0 }),
        ...(etops !== undefined && { etops: etops ? 1 : 0 }),
        ...(stepclimbs !== undefined && { stepclimbs: stepclimbs ? 1 : 0 }),
        ...(tlr !== undefined && { tlr: tlr ? 1 : 0 }),
        ...(notams !== undefined && { notams: notams ? 1 : 0 }),
        ...(maps !== undefined && { maps: maps ? 'map' : 'none' }),
        ...(date && { date }),
        ...(deph !== undefined && { deph }),
        ...(depm !== undefined && { depm }),
        ...(ci !== undefined && { ci }),
        ...(pax !== undefined && { pax }),
        ...(cargo !== undefined && { cargo }),
    }

    const qs = Object.entries(params)
        .map(([ k, v ]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&')

    return NextResponse.json({
        simbriefUrl: `https://www.simbrief.com/ofp/ofp.loader.api.php?${qs}`,
    })
}
