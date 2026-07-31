'use client'

import dynamic from 'next/dynamic'
import { ShellSkeleton } from './skeletons'

// ─── Why the crew app renders client-only ────────────────────────────────────
//
// On Cloudflare Workers the crew tree kept tripping 1102 (exceededCpu). Two
// separate costs added up, and both are paid by the Worker on every /crew/*
// request:
//
//   1. Render — Chakra v3 is CSS-in-JS, so every <Box> re-computes styles through
//      Emotion during the SSR pass. A crew page renders hundreds of them, which
//      is where the ~270ms of warm CPU per request went.
//   2. Module init — React's Flight client evaluates EVERY client module the RSC
//      payload references, whether or not it ends up rendered (`requireModule` runs
//      as the "I" rows are parsed, not when the element renders). So merely naming
//      a Chakra-importing component in the payload pulled Chakra, Emotion,
//      react-icons and recharts into a cold isolate — the ~2s spikes.
//
// `dynamic(..., { ssr: false })` fixes both: the inner chunk is never evaluated on
// the server, and the server renders the `loading` placeholder instead. The rule
// that follows from cost #2 is what shapes this whole directory:
//
//   ⚠️  Every client component the crew server tree references must be a TINY
//       gate module like this one. A layout or page that imports a Chakra
//       component directly — even one <Box> — undoes the fix for its whole route.
//       Put the real UI behind a gate and keep the server file to data + props.
//
// The crew app is authenticated and noindex, so it loses nothing by not being
// server-rendered. See CLOUDFLARE.md.

const load = () => import('./CrewRuntimeInner')

// next/dynamic only starts fetching when the component renders, and the three
// boundaries nest (runtime → chrome → page), so leaving it at that would make the
// browser fetch them one after another. Kicking the import off at module-eval
// time — this module is in the initial bundle, since the server payload names it
// — lets the chunks download in parallel; webpack dedupes the second call.
if (typeof window !== 'undefined') load()

const Inner = dynamic(load, { ssr: false, loading: () => <ShellSkeleton /> })

export default function CrewRuntime({ session, children }) {
  return <Inner session={session}>{children}</Inner>
}
