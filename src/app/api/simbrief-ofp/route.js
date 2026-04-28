import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

function extractField(xml, tag) {
    const m = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'))
    if (!m) return null
    // Strip CDATA wrapper if present
    return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim()
}

export async function GET(request) {
    const session = await auth()
    if (!session?.user?.callsign) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const ofpId = searchParams.get('id')
    const check = searchParams.get('check') // just existence check

    if (!ofpId || !/^\d{10}_[a-f0-9]{10}$/.test(ofpId)) {
        return NextResponse.json({ error: 'Invalid OFP ID' }, { status: 400 })
    }

    const xmlUrl = `https://www.simbrief.com/ofp/flightplans/xml/${ofpId}.xml`

    if (check) {
        // HEAD check — just tell client if OFP exists yet
        const res = await fetch(xmlUrl, { method: 'HEAD' })
        return NextResponse.json({ exists: res.ok })
    }

    try {
        const res = await fetch(xmlUrl)
        if (!res.ok) return NextResponse.json({ error: 'OFP not found' }, { status: 404 })

        const xml = await res.text()

        // Extract key fields
        const get = (tag) => extractField(xml, tag)

        // plan_html is inside <text> block
        const textBlock = get('text') || ''
        const planHtml = extractField(textBlock || xml, 'plan_html') || get('plan_html') || ''

        // Clean plan text: strip HTML tags, decode entities
        const planText = planHtml
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
            .trim()

        return NextResponse.json({
            planText,
            origin: get('icao_code') || '',
            destination: get('icao_code'),
            flightNumber: get('flight_number') || '',
            aircraft: get('icao_code') || '',
            route: get('route') || '',
            flightTime: get('est_time_enroute') || '',
            fuelRamp: get('planned_ramp') || '',
            alternateIcao: get('icao_code') || '',
            raw: xml.length < 50000 ? xml : null, // only return raw XML if not huge
        })
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
