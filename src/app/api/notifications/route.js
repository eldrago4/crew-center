import { NextResponse } from 'next/server'

// The notifications feature was removed — NotificationContext is a stub that always
// reports zero unseen. This endpoint is kept only so any lingering caller doesn't 404.
// It used to run auth() + a Redis GET + a pireps scan + a crewcenter read and then
// throw all of it away to return this exact constant, so just return the constant.
// It's the same for everyone, so it's publicly cacheable.
export async function GET() {
    return NextResponse.json(
        { rejectedPirepIds: [], eventIds: [] },
        { headers: { 'Cache-Control': 'public, max-age=3600' } },
    )
}
