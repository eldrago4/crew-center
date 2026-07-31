import CrewPage from '@/components/crew-runtime/CrewPage'

// Server entry: the UI lives in ./LeaderboardView.jsx, loaded client-only through the CrewPage
// registry so the Worker never renders Chakra for this route.
// See src/components/crew-runtime/CrewRuntime.jsx.
export default function Page() {
  return <CrewPage id="leaderboard" />
}
