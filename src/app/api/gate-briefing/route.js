import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { updateModuleValue } from '@/app/(crew)/crew/pireps/file/fleetModule'
import { fetchModuleValue } from '@/app/(crew)/crew/pireps/file/fleetModule'

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const MODULE = 'gate_allocations'

async function openDmChannel(discordId) {
  const res = await fetch('https://discord.com/api/v10/users/@me/channels', {
    method: 'POST',
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ recipient_id: discordId }),
  })
  if (!res.ok) throw new Error(`DM channel open failed: ${res.status}`)
  const data = await res.json()
  return data.id
}

async function sendDmWithImage({ channelId, embed, imageBuffer }) {
  const boundary = '----FormBoundaryGateBriefing'
  const payloadJson = JSON.stringify({
    embeds: [embed],
    attachments: [{ id: 0, filename: 'gate.png' }],
  })

  // Build multipart body manually for edge/node compatibility
  const enc = new TextEncoder()
  const parts = []

  parts.push(enc.encode(
    `--${boundary}\r\nContent-Disposition: form-data; name="payload_json"\r\nContent-Type: application/json\r\n\r\n`
  ))
  parts.push(enc.encode(payloadJson))
  parts.push(enc.encode(
    `\r\n--${boundary}\r\nContent-Disposition: form-data; name="files[0]"; filename="gate.png"\r\nContent-Type: image/png\r\n\r\n`
  ))
  parts.push(imageBuffer)
  parts.push(enc.encode(`\r\n--${boundary}--\r\n`))

  const totalLen = parts.reduce((s, p) => s + p.length, 0)
  const body = new Uint8Array(totalLen)
  let offset = 0
  for (const p of parts) { body.set(p, offset); offset += p.length }

  const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body,
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Send message failed (${res.status}): ${errText}`)
  }
}

function buildEmbed({ allocation, eventMeta, simbriefData }) {
  const fields = []

  if (allocation.sequenceNumber) {
    fields.push({ name: 'Slot', value: `#${allocation.sequenceNumber}`, inline: true })
  }
  fields.push(
    { name: 'Aircraft', value: eventMeta.aircraft || '—', inline: true },
    { name: 'Your Gate', value: `${allocation.gateName} (${allocation.icao})`, inline: true },
    { name: 'Pushback', value: eventMeta.pushbackTime || '—', inline: true },
  )

  if (simbriefData) {
    fields.push(
      { name: 'Pax / Cargo', value: `${simbriefData.pax} pax / ${Number(simbriefData.cargo).toLocaleString()} kg`, inline: true },
      { name: 'Fuel (Ramp)', value: `${Number(simbriefData.fuelRamp).toLocaleString()} kg`, inline: true },
    )
    if (simbriefData.origRunway) fields.push({ name: 'Dep Runway', value: simbriefData.origRunway, inline: true })
    if (simbriefData.destRunway) fields.push({ name: 'Arr Runway', value: simbriefData.destRunway, inline: true })
    if (simbriefData.origMetar) fields.push({ name: `${eventMeta.departureIcao} METAR`, value: `\`\`\`${simbriefData.origMetar}\`\`\``, inline: false })
    if (simbriefData.destMetar) fields.push({ name: `${eventMeta.arrivalIcao} METAR`, value: `\`\`\`${simbriefData.destMetar}\`\`\``, inline: false })
  }

  return {
    title: `Pre-Flight Briefing — ${eventMeta.flightNumber || ''} | ${eventMeta.departureIcao} → ${eventMeta.arrivalIcao}`,
    description: `**${eventMeta.title}**`,
    color: 0x6366f1,
    fields,
    image: { url: 'attachment://gate.png' },
    footer: { text: 'Indian Virtual • Pre-Flight Briefing' },
    timestamp: new Date().toISOString(),
  }
}

export async function POST(request) {
  const session = await auth()
  if (!session?.user?.permissions?.includes('staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { eventId, allocations, eventMeta, simbriefData } = await request.json()

  if (!eventId || !allocations?.length) {
    return NextResponse.json({ error: 'eventId and allocations are required' }, { status: 400 })
  }

  const results = await Promise.allSettled(
    allocations.map(async (allocation) => {
      const embed = buildEmbed({ allocation, eventMeta, simbriefData })

      // Convert dataURL base64 to Uint8Array
      let imageBuffer = new Uint8Array(0)
      if (allocation.imageDataUrl) {
        const base64 = allocation.imageDataUrl.replace(/^data:image\/png;base64,/, '')
        const binary = atob(base64)
        imageBuffer = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) imageBuffer[i] = binary.charCodeAt(i)
      }

      const channelId = await openDmChannel(allocation.discordId)
      await sendDmWithImage({ channelId, embed, imageBuffer })

      // Follow-up message: SimBrief chart images
      if (simbriefData?.mapUrls?.length) {
        const mapEmbeds = simbriefData.mapUrls.slice(0, 10).map((url, i) => ({
          color: 0x1e293b,
          image: { url },
          ...(i === 0 ? { author: { name: 'SimBrief Charts' } } : {}),
        }))
        await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
          method: 'POST',
          headers: { Authorization: `Bot ${BOT_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ embeds: mapEmbeds }),
        })
      }

      return allocation.discordId
    })
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  const failed = results
    .filter(r => r.status === 'rejected')
    .map((r, i) => ({ discordId: allocations[i]?.discordId, error: r.reason?.message }))

  // Mark briefingSent in DB
  try {
    const all = (await fetchModuleValue(MODULE)) || {}
    if (all[eventId]) {
      all[eventId].briefingSent = true
      await updateModuleValue(MODULE, all)
    }
  } catch { /* non-fatal */ }

  return NextResponse.json({ sent, failed })
}
