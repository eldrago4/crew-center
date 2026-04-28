import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import SimbriefPlanner from '@/components/simbrief/SimbriefPlanner'

export const metadata = { title: 'SimBrief Dispatch | Indian Virtual' }

export default async function SimbriefPage() {
    const session = await auth()
    if (!session?.user) redirect('/login')

    return <SimbriefPlanner />
}
