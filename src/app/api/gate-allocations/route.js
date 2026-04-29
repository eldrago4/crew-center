import { NextResponse } from 'next/server'
import { updateModuleValue, fetchModuleValue } from '@/app/(crew)/crew/pireps/file/fleetModule'
import db from '@/db/client.js'
import { crewcenter } from '@/db/schema'
import { eq } from 'drizzle-orm'

const MODULE = 'gate_allocations'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get('eventId')

  if (!eventId) {
    return NextResponse.json({ error: 'eventId is required' }, { status: 400 })
  }

  const rows = await db.select().from(crewcenter).where(eq(crewcenter.module, MODULE))
  if (rows.length === 0) return NextResponse.json({})
  const data = rows[0].value?.[eventId] ?? {}
  return NextResponse.json(data)
}

export async function POST(request) {
  const body = await request.json()
  const { eventId, departureAllocations, arrivalAllocations, simbriefData, briefingSent, pilotOrder } = body

  if (!eventId) {
    return NextResponse.json({ error: 'eventId is required' }, { status: 400 })
  }

  let all = {}
  try {
    all = (await fetchModuleValue(MODULE)) || {}
  } catch { /* first write — start empty */ }

  all[eventId] = {
    departureAllocations: departureAllocations ?? [],
    arrivalAllocations: arrivalAllocations ?? [],
    simbriefData: simbriefData ?? null,
    pilotOrder: pilotOrder ?? [],
    briefingSent: briefingSent ?? false,
  }

  await updateModuleValue(MODULE, all)
  return NextResponse.json({ success: true })
}
