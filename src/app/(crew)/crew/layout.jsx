
export const metadata = {
    robots: { index: false, follow: false },
}

import { auth } from '@/auth'
import CrewRuntime from '@/components/crew-runtime/CrewRuntime'

// The crew app renders on the client. This layout resolves the session (so
// SessionProvider is seeded without a round trip) and hands the whole tree to
// CrewRuntime, which is behind a `dynamic({ ssr: false })` boundary — the Worker
// therefore renders a plain-CSS spinner for any /crew/* request instead of
// running Chakra's CSS-in-JS through Emotion. See CrewRuntime.jsx for the full
// reasoning and the rule it imposes on everything below (/crew server files must
// never import a Chakra component).
//
// No Suspense boundary is needed any more: the ssr:false gate is the boundary,
// and its `loading` placeholder is what used to be CrewShellFallback.
export default async function RootLayout({ children }) {
    const session = await auth()

    return <CrewRuntime session={session}>{children}</CrewRuntime>
}
