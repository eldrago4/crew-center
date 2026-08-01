import { Suspense } from 'react'
import { connection } from 'next/server'
import { notFound } from 'next/navigation'
import { getProfileData } from '@/lib/profile'
import PilotProfile from '@/components/profile/PilotProfile'

export async function generateMetadata({ params }) {
  const { callsign } = await params
  const profile = await getProfileData(callsign.toUpperCase())
  if (!profile) return { title: 'Pilot not found · Indian Virtual' }

  const name = profile.edits?.displayName || profile.identity.ifcName
  const title = `${name} (${callsign.toUpperCase()}) · Indian Virtual`
  const description = `${name} — ${profile.identity.rank} at Indian Virtual, ${profile.agg.approvedCount} approved flights logged.`

  return {
    title,
    description,
    openGraph: { title, description, url: `https://indianvirtual.com/team/${callsign.toUpperCase()}` },
    alternates: { canonical: `https://indianvirtual.com/team/${callsign.toUpperCase()}` },
  }
}

async function PublicProfileData({ callsign }) {
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
      viewer={{ isOwner: false, showBack: false }}
    />
  )
}

// generateMetadata reads runtime data (params) via getProfileData, and this page
// has no static shell to preserve — everything on it is per-pilot. Per the Cache
// Components migration guide, connection() must NOT be awaited directly in the
// page body (that would block the static shell); instead a Suspense-wrapped
// DynamicMarker declares the route intentionally dynamic.
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

export default async function PublicPilotProfilePage({ params }) {
  const { callsign } = await params
  const upperCallsign = callsign.toUpperCase()

  return (
    <>
      <DynamicMarker />
      <Suspense fallback={null}>
        <PublicProfileData callsign={upperCallsign} />
      </Suspense>
    </>
  )
}
