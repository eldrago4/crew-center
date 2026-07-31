'use client'

import { SidebarProvider } from '@/components/SidebarContext'
import ResponsiveCrewLayout from '@/components/ResponsiveCrewLayout'

export default function CrewChromeInner({ children, ...shell }) {
  return (
    <SidebarProvider>
      <ResponsiveCrewLayout {...shell}>{children}</ResponsiveCrewLayout>
    </SidebarProvider>
  )
}
