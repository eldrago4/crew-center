import { auth } from '@/auth'
import FlyingManualContainer from '@/components/FlyingManualContainer'

export default async function DashboardPage() {
  const session = await auth();

  return <FlyingManualContainer />;
}

