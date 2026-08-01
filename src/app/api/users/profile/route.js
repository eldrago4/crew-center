import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/apiAuth'
import { updateProfileEdits } from '@/lib/profile'
import { AIRCRAFT } from '@/data/fleet'

const MAX_DISPLAY_NAME = 30
const MAX_BIO = 280

export async function PATCH(request) {
  const { session, error } = await requireUser()
  if (error) return error

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const patch = {}

  if ('displayName' in body) {
    const displayName = String(body.displayName ?? '').trim()
    if (displayName.length > MAX_DISPLAY_NAME) {
      return NextResponse.json({ error: `displayName must be ${MAX_DISPLAY_NAME} characters or fewer` }, { status: 400 })
    }
    patch.displayName = displayName || null
  }

  if ('bio' in body) {
    const bio = String(body.bio ?? '').trim()
    if (bio.length > MAX_BIO) {
      return NextResponse.json({ error: `bio must be ${MAX_BIO} characters or fewer` }, { status: 400 })
    }
    patch.bio = bio || null
  }

  if ('favAircraft' in body) {
    const favAircraft = String(body.favAircraft ?? '').trim()
    if (favAircraft && !AIRCRAFT.some((a) => a.id === favAircraft)) {
      return NextResponse.json({ error: 'favAircraft must be a known fleet aircraft id' }, { status: 400 })
    }
    patch.favAircraft = favAircraft || null
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No editable fields provided' }, { status: 400 })
  }

  const edits = await updateProfileEdits(session.user.callsign, patch)
  if (!edits) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  return NextResponse.json({ edits })
}
