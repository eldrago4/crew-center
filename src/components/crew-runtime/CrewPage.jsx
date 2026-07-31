'use client'

import dynamic from 'next/dynamic'
import { PageSkeleton } from './skeletons'

// One registry for every crew page body, so each `page.jsx` can stay a server file
// that does nothing but auth + data + `<CrewPage id="…" …props />`. A registry
// rather than a gate file per route: `dynamic()` only builds a lazy wrapper, so
// the whole table costs the Worker one small module instead of twenty, and each
// entry still becomes its own client chunk.
//
// Props are whatever the server page passes — keep them plain JSON. Anything that
// needs Chakra belongs in the view module, never in the page.
//
// The `{ ssr: false, loading: … }` object has to be written out at every call:
// Next parses next/dynamic's second argument statically and rejects a shared
// `const opts` with "next/dynamic options must be an object literal".
const Fallback = () => <PageSkeleton />

const PAGES = {
  'dashboard': dynamic(() => import('@/components/dashboard/DashboardView'), { ssr: false, loading: Fallback }),
  'routes': dynamic(() => import('@/app/(crew)/crew/routes/RoutesView'), { ssr: false, loading: Fallback }),
  'pireps-file': dynamic(() => import('@/app/(crew)/crew/pireps/file/FilePirepView'), { ssr: false, loading: Fallback }),
  'pireps-logbook': dynamic(() => import('@/app/(crew)/crew/pireps/logbook/LogbookView'), { ssr: false, loading: Fallback }),
  'simbrief': dynamic(() => import('@/app/(crew)/crew/plan/simbrief/SimbriefView'), { ssr: false, loading: Fallback }),
  'gates': dynamic(() => import('@/airport-gates'), { ssr: false, loading: Fallback }),
  'flying-manual': dynamic(() => import('@/components/FlyingManualContainer'), { ssr: false, loading: Fallback }),
  'chanda': dynamic(() => import('@/app/(crew)/crew/chanda/ChandaView'), { ssr: false, loading: Fallback }),
  'career': dynamic(() => import('@/app/(crew)/crew/career/CareerView'), { ssr: false, loading: Fallback }),
  'events': dynamic(() => import('@/app/(crew)/crew/community/events/EventsView'), { ssr: false, loading: Fallback }),
  'leaderboard': dynamic(() => import('@/app/(crew)/crew/community/leaderboard/LeaderboardView'), { ssr: false, loading: Fallback }),
  'admin-chanda': dynamic(() => import('@/app/(crew)/crew/admin/chanda/AdminChandaView'), { ssr: false, loading: Fallback }),
  'admin-fleet': dynamic(() => import('@/app/(crew)/crew/admin/fleet/AdminFleetView'), { ssr: false, loading: Fallback }),
  'admin-pireps': dynamic(() => import('@/app/(crew)/crew/admin/pireps/AdminPirepsView'), { ssr: false, loading: Fallback }),
  'admin-recruits': dynamic(() => import('@/app/(crew)/crew/admin/recruits/RecruitsView'), { ssr: false, loading: Fallback }),
  'admin-rotw': dynamic(() => import('@/app/(crew)/crew/admin/rotw/AdminRotwView'), { ssr: false, loading: Fallback }),
  'admin-routes': dynamic(() => import('@/app/(crew)/crew/admin/routes/RoutesClientRSC'), { ssr: false, loading: Fallback }),
  'admin-server-config': dynamic(() => import('@/app/(crew)/crew/admin/server-config/ServerConfigView'), { ssr: false, loading: Fallback }),
  'admin-statistics': dynamic(() => import('@/app/(crew)/crew/admin/statistics/StatisticsView'), { ssr: false, loading: Fallback }),
  'admin-users': dynamic(() => import('@/app/(crew)/crew/admin/users/UsersView'), { ssr: false, loading: Fallback }),
}

export default function CrewPage({ id, ...props }) {
  const View = PAGES[ id ]
  if (!View) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[CrewPage] no view registered for id "${id}"`)
    }
    return null
  }
  return <View {...props} />
}
