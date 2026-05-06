import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

function extractField(xml, tag) {
    const m = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'))
    if (!m) return null
    return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim()
}

function extractPlanHtml(xml) {
    // Match <![CDATA[...]]> inside <plan_html> — non-greedy on ]]> which won't appear in HTML
    const cdata = xml.match(/<plan_html[^>]*>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/plan_html>/i)
    if (cdata) return cdata[1].trim()
    // Fallback: plain content (no CDATA wrapper)
    const plain = xml.match(/<plan_html[^>]*>([\s\S]*?)<\/plan_html>/i)
    return plain ? plain[1].trim() : ''
}

export async function GET(request) {
    const session = await auth()
    if (!session?.user?.callsign) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const ofpId = searchParams.get('id')
    const check = searchParams.get('check') // just existence check

    if (!ofpId || !/^\d{8,12}_[a-fA-F0-9]{6,32}$/.test(ofpId)) {
        return NextResponse.json({ error: 'Invalid OFP ID' }, { status: 400 })
    }

    const normalizedOfpId = ofpId.toUpperCase()
    const xmlUrl = `https://www.simbrief.com/ofp/flightplans/xml/${normalizedOfpId}.xml`

    if (check) {
        // HEAD check — just tell client if OFP exists yet
        const res = await fetch(xmlUrl, { method: 'HEAD' })
        return NextResponse.json({ exists: res.ok })
    }

    try {
        const res = await fetch(xmlUrl)
        if (!res.ok) return NextResponse.json({ error: 'OFP not found' }, { status: 404 })

        const xml = await res.text()

        const get = (tag) => extractField(xml, tag)

        // Extract plan_html directly with a CDATA-aware extractor to avoid
        // false early-termination when the HTML contains XML-like tags
        const planHtml = extractPlanHtml(xml)

        // Clean plan text: strip HTML tags, decode entities
        const planText = planHtml
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
            .trim()

        return NextResponse.json({
            planHtml,
            planText,
            origin: get('icao_code') || '',
            flightNumber: get('flight_number') || '',
            route: get('route') || '',
            flightTime: get('est_time_enroute') || '',
        })
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
