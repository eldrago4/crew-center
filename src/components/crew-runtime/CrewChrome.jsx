'use client'

import dynamic from 'next/dynamic'
import { ChromeSkeleton } from './skeletons'

// Gate for the crew chrome (sidebar provider + nav + sidebar + content padding).
// Every section layout renders this instead of importing ResponsiveCrewLayout, so
// the nav/sidebar module graph never reaches the Worker. See CrewRuntime.jsx for
// the reasoning.
const load = () => import('./CrewChromeInner')
if (typeof window !== 'undefined') load()

const Inner = dynamic(load, { ssr: false, loading: () => <ChromeSkeleton /> })

export default function CrewChrome(props) {
  return <Inner {...props} />
}
