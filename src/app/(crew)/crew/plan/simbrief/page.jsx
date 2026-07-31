import CrewPage from '@/components/crew-runtime/CrewPage'

export const metadata = { title: 'SimBrief Dispatch | Indian Virtual' }

// Login gating is handled by plan/layout.jsx. The UI lives in ./SimbriefView.jsx,
// loaded client-only through the CrewPage registry so the Worker never renders
// Chakra for this route. See src/components/crew-runtime/CrewRuntime.jsx.
export default function SimbriefPage() {
  return <CrewPage id="simbrief" />
}
