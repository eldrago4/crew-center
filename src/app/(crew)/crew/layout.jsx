
export const metadata = {
    robots: { index: false, follow: false },
}

import { Suspense } from 'react'
import { Providers } from "@/components/CrewProviders"
import { Box } from '@chakra-ui/react'

// No auth() here: it used to fetch the session and derive callsign/isAdmin that the
// JSX never used. Gating is done by each section's own layout (dashboard/plan/admin/
// …), and CrewProviders already resolves the session once to seed SessionProvider.
//
// Cache Components: CrewProviders (auth() → cookies) and every section layout read
// runtime data, so the whole crew tree must sit under a Suspense boundary — this one
// covers all of it. The shell (this fallback) prerenders and is served instantly
// while the session-dependent UI streams in. The fallback renders OUTSIDE
// ChakraProvider (it IS the fallback for it), so it uses plain inline styles.
function CrewShellFallback() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1117' }}>
      <div aria-label="Loading" style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid rgba(255,255,255,0.15)', borderTopColor: '#89ceff',
        animation: 'crewspin 0.8s linear infinite',
      }} />
      <style>{'@keyframes crewspin { to { transform: rotate(360deg) } }'}</style>
    </div>
  )
}

export default function RootLayout({ children }) {
  return (
    <Suspense fallback={<CrewShellFallback />}>
      <Providers>
        <Box minH="100vh" bg="bg.default">
          {children}
        </Box>
      </Providers>
    </Suspense>
  )
}

