import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { Redis } from '@upstash/redis'
import {
    extractField, extractBlock, extractPlanHtml,
    extractBookmarks, annotateBookmarks, htmlToText,
} from '@/lib/simbrief'


let _redis = null
function getRedis() {
  if (!_redis) _redis = Redis.fromEnv()
  return _redis
}
const EXISTS_TTL_SECONDS = 10 * 60
const MISSING_TTL_SECONDS = 12
const OFP_TTL_SECONDS = 24 * 60 * 60

export async function GET(request) {
    const session = await auth()
    if (!session?.user?.callsign) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const ofpId = searchParams.get('id')
    const check = searchParams.get('check') // just existence check

    if (!ofpId || !/^\d{8,12}_[a-zA-Z0-9]{6,32}$/.test(ofpId)) {
        return NextResponse.json({ error: 'Invalid OFP ID' }, { status: 400 })
    }

    const normalizedOfpId = ofpId.toUpperCase()
    const xmlUrl = `https://www.simbrief.com/ofp/flightplans/xml/${normalizedOfpId}.xml`
    const existsCacheKey = `simbrief:ofp:${normalizedOfpId}:exists`
    // v2: previous cache entries hold entity-escaped plan_html (rendered as raw
    // tag source in the viewer); bump the key so they are not served.
    const dataCacheKey = `simbrief:ofp:${normalizedOfpId}:data:v2`

    if (check) {
        try {
            const cached = await getRedis().get(existsCacheKey)
            if (cached !== null && cached !== undefined) {
                return NextResponse.json({ exists: cached === true || cached === 'true' }, {
                    headers: { 'Cache-Control': 'private, max-age=10' },
                })
            }
        } catch (error) {
            console.warn('SimBrief OFP exists cache read failed:', error)
        }

        // HEAD check — just tell client if OFP exists yet
        const res = await fetch(xmlUrl, { method: 'HEAD' })
        try {
            await getRedis().set(existsCacheKey, res.ok, { ex: res.ok ? EXISTS_TTL_SECONDS : MISSING_TTL_SECONDS })
        } catch (error) {
            console.warn('SimBrief OFP exists cache write failed:', error)
        }
        return NextResponse.json({ exists: res.ok }, {
            headers: { 'Cache-Control': 'private, max-age=10' },
        })
    }

    try {
        try {
            const cached = await getRedis().get(dataCacheKey)
            if (cached) {
                return NextResponse.json(typeof cached === 'string' ? JSON.parse(cached) : cached, {
                    headers: { 'Cache-Control': 'private, max-age=300' },
                })
            }
        } catch (error) {
            console.warn('SimBrief OFP data cache read failed:', error)
        }

        const res = await fetch(xmlUrl)
        if (!res.ok) return NextResponse.json({ error: 'OFP not found' }, { status: 404 })

        const xml = await res.text()

        const get = (tag) => extractField(xml, tag)

        // plan_html is entity-encoded in the feed; extractPlanHtml decodes it so
        // the viewer gets real markup instead of escaped tag source
        const rawPlanHtml = extractPlanHtml(xml)
        const planHtml = annotateBookmarks(rawPlanHtml)
        const planText = htmlToText(rawPlanHtml)

        const payload = {
            planHtml,
            planText,
            bookmarks: extractBookmarks(rawPlanHtml),
            layout: get('ofp_layout') || '',
            // <icao_code> repeats per airport, so scope these to their block
            origin: extractField(extractBlock(xml, 'origin'), 'icao_code') || '',
            destination: extractField(extractBlock(xml, 'destination'), 'icao_code') || '',
            flightNumber: get('flight_number') || '',
            route: get('route') || '',
            flightTime: get('est_time_enroute') || '',
        }

        try {
            await Promise.all([
                getRedis().set(dataCacheKey, payload, { ex: OFP_TTL_SECONDS }),
                getRedis().set(existsCacheKey, true, { ex: EXISTS_TTL_SECONDS }),
            ])
        } catch (error) {
            console.warn('SimBrief OFP cache write failed:', error)
        }

        return NextResponse.json(payload, {
            headers: { 'Cache-Control': 'private, max-age=300' },
        })
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
