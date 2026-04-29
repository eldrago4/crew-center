import { NextResponse } from 'next/server'

function extractField(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  if (!m) return null
  return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim()
}

function extractBlock(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return m ? m[1] : ''
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')?.trim()

  if (!username) {
    return NextResponse.json({ error: 'username is required' }, { status: 400 })
  }

  const res = await fetch(
    `https://www.simbrief.com/api/xml.fetcher.php?username=${encodeURIComponent(username)}`
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'SimBrief API error' }, { status: res.status })
  }

  const xml = await res.text()

  // Check for SimBrief error (e.g. no OFP found)
  const status = extractField(xml, 'status')
  if (status && status !== 'Success') {
    return NextResponse.json(
      { error: 'No OFP found for this username. Make sure a plan has been filed recently.' },
      { status: 404 }
    )
  }

  const origBlock = extractBlock(xml, 'origin')
  const destBlock = extractBlock(xml, 'destination')
  const fuelBlock = extractBlock(xml, 'fuel')
  const weightsBlock = extractBlock(xml, 'weights')
  const imagesBlock = extractBlock(xml, 'images')

  // Extract map URLs from <link> children inside <images>
  const mapUrls = []
  const mapRegex = /<link>([^<]+)<\/link>/gi
  let m
  while ((m = mapRegex.exec(imagesBlock)) !== null) {
    const url = m[1].trim()
    if (url.startsWith('http')) mapUrls.push(url)
  }

  return NextResponse.json({
    pax: extractField(xml, 'pax_count_actual') || extractField(xml, 'pax_count') || '0',
    cargo: extractField(weightsBlock || xml, 'cargo_hold_weight') || '0',
    fuelRamp: extractField(fuelBlock || xml, 'plan_ramp') || '0',
    fuelBurn: extractField(fuelBlock || xml, 'plan_burn') || '0',
    origRunway: extractField(origBlock || xml, 'plan_rwy') || '',
    destRunway: extractField(destBlock || xml, 'plan_rwy') || '',
    origMetar: extractField(origBlock || xml, 'metar') || '',
    destMetar: extractField(destBlock || xml, 'metar') || '',
    mapUrls,
  })
}
