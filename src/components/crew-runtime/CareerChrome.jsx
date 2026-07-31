'use client'

import dynamic from 'next/dynamic'
import { ShellSkeleton } from './skeletons'

// Career mode has its own providers + nav (a different Chakra system), so it gets
// its own gate rather than reusing CrewChrome. Same rule as everywhere else here:
// this file stays tiny, the Chakra lives in the inner chunk.
const load = () => import('./CareerChromeInner')
if (typeof window !== 'undefined') load()

const Inner = dynamic(load, { ssr: false, loading: () => <ShellSkeleton /> })

export default function CareerChrome(props) {
  return <Inner {...props} />
}
