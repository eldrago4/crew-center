import FlyingManualContainer from '@/components/FlyingManualContainer'

// Gating (login + ifc-name) is handled by resources/flying-manual/layout.jsx; this
// page's auth() result was never used. The manual content is fetched client-side.
export default function FlyingManualPage() {
  return <FlyingManualContainer />;
}

