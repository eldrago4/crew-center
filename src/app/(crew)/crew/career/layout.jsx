import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import CareerChrome from '@/components/crew-runtime/CareerChrome'

export default async function CareerLayout({ children }) {
    const session = await auth()

    if (session?.user?.careerMode) {
        redirect('/api/career-sso-redirect')
    }

    return <CareerChrome session={session}>{children}</CareerChrome>
}
