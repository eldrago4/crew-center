import { Suspense } from 'react'
import { connection } from 'next/server'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { getProfileData } from '@/lib/profile'
import PilotProfile from '@/components/profile/PilotProfile'

export const metadata = {
  robots: { index: false, follow: false },
}

async function CrewProfileData({ callsign }) {
  const session = await auth()
  const isOwner = session?.user?.callsign === callsign

  const profile = await getProfileData(callsign)
  if (!profile) notFound()

  return (
    <PilotProfile
      callsign={callsign}
      identity={profile.identity}
      edits={profile.edits}
      agg={profile.agg}
      trails={profile.trails}
      career={profile.career}
      logbook={profile.logbook}
      viewer={{ isOwner, showBack: true }}
    />
  )
}

// Per the Cache Components migration guide, connection() must not be awaited
// directly in the page body — a Suspense-wrapped DynamicMarker declares the
// route intentionally dynamic without blocking the static shell.
const Connection = async () => {
  await connection()
  return null
}

async function DynamicMarker() {
  return (
    <Suspense>
      <Connection />
    </Suspense>
  )
}

export default async function CrewPilotProfilePage({ params }) {
  const { callsign } = await params
  const upperCallsign = callsign.toUpperCase()

  return (
    <>
      <DynamicMarker />
      <Suspense fallback={null}>
        <CrewProfileData callsign={upperCallsign} />
      </Suspense>
    </>
  )
}
