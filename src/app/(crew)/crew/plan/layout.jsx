import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import ResponsiveCrewLayout from '@/components/ResponsiveCrewLayout'
import { SidebarProvider } from '@/components/SidebarContext'

export default async function PlanLayout({ children }) {
    const session = await auth()
    if (!session) redirect('/crew')

    const isAdmin = session.user.permissions?.length > 0 || false
    const careerMode = session.user.careerMode || false

    return (
        <SidebarProvider>
            <ResponsiveCrewLayout callsign={session.user.callsign} isAdmin={isAdmin} careerMode={careerMode}>
                {children}
            </ResponsiveCrewLayout>
        </SidebarProvider>
    )
}
