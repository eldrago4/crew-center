
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
// ChakraProvider (it IS the fallback for it), so it styles itself with plain CSS
// keyed off the `dark` class the root layout's parse-time script sets before paint
// — the one prerendered shell serves both themes (no hardcoded dark: a light-mode
// pilot must not get a dark flash before content streams in).
function CrewShellFallback() {
  return (
    <div className="crew-shell-fallback">
      <div className="crew-shell-spinner" aria-label="Loading" />
      <style>{`
        .crew-shell-fallback {
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          background: #fff;
        }
        .crew-shell-spinner {
          width: 36px; height: 36px; border-radius: 50%;
          border: 3px solid rgba(0,0,0,0.12); border-top-color: #006591;
          animation: crewspin 0.8s linear infinite;
        }
        html.dark .crew-shell-fallback { background: #111; }
        html.dark .crew-shell-spinner { border-color: rgba(255,255,255,0.15); border-top-color: #89ceff; }
        @keyframes crewspin { to { transform: rotate(360deg) } }
      `}</style>
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

