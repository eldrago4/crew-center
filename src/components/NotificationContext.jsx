'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

const Ctx = createContext({ eventsUnseen: 0, pirepsUnseen: 0 })

export function NotificationProvider({ children }) {
    const [eventsUnseen, setEventsUnseen] = useState(0)
    const [pirepsUnseen, setPirepsUnseen] = useState(0)
    const pathname = usePathname()

    useEffect(() => {
        fetch('/api/notifications')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (!data) return

                const onEventsPage = !!pathname?.includes('/crew/community/events')
                const onLogbookPage = !!pathname?.includes('/crew/pireps/logbook')

                try {
                    const seen = new Set(JSON.parse(localStorage.getItem('inva-seen-events') || '[]'))
                    const unseen = data.eventIds.filter(id => !seen.has(String(id)))
                    if (onEventsPage) {
                        data.eventIds.forEach(id => seen.add(String(id)))
                        localStorage.setItem('inva-seen-events', JSON.stringify([...seen]))
                        setEventsUnseen(0)
                    } else {
                        setEventsUnseen(unseen.length)
                    }
                } catch {}

                try {
                    const seen = new Set(JSON.parse(localStorage.getItem('inva-seen-rejected-pireps') || '[]'))
                    const unseen = data.rejectedPirepIds.filter(id => !seen.has(String(id)))
                    if (onLogbookPage) {
                        data.rejectedPirepIds.forEach(id => seen.add(String(id)))
                        localStorage.setItem('inva-seen-rejected-pireps', JSON.stringify([...seen]))
                        setPirepsUnseen(0)
                    } else {
                        setPirepsUnseen(unseen.length)
                    }
                } catch {}
            })
            .catch(() => {})
    }, [pathname])

    return (
        <Ctx.Provider value={{ eventsUnseen, pirepsUnseen }}>
            {children}
        </Ctx.Provider>
    )
}

export const useNotifications = () => useContext(Ctx)
