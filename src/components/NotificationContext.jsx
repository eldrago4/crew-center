'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

const Ctx = createContext({ eventsUnseen: 0, pirepsUnseen: 0 })
const REFRESH_MS = 10 * 60 * 1000
const FOCUS_REFRESH_STALE_MS = 2 * 60 * 1000

export function NotificationProvider({ children }) {
    const [eventsUnseen, setEventsUnseen] = useState(0)
    const [pirepsUnseen, setPirepsUnseen] = useState(0)
    const [notificationData, setNotificationData] = useState(null)
    const pathname = usePathname()

    useEffect(() => {
        let cancelled = false
        let interval
        let lastFetchAt = 0
        let inFlight = false
        const controller = new AbortController()

        function loadNotifications({ force = false } = {}) {
            if (cancelled || inFlight) return
            if (document.visibilityState === 'hidden' && !force) return

            inFlight = true
            lastFetchAt = Date.now()
            fetch('/api/notifications', { signal: controller.signal })
                .then(r => r.ok ? r.json() : null)
                .then(data => {
                    if (!cancelled && data) setNotificationData(data)
                })
                .catch(() => {})
                .finally(() => {
                    inFlight = false
                })
        }

        function refreshIfStale() {
            if (document.visibilityState !== 'visible') return
            if (Date.now() - lastFetchAt > FOCUS_REFRESH_STALE_MS) {
                loadNotifications({ force: true })
            }
        }

        loadNotifications({ force: true })
        interval = setInterval(loadNotifications, REFRESH_MS)
        window.addEventListener('focus', refreshIfStale)
        document.addEventListener('visibilitychange', refreshIfStale)

        return () => {
            cancelled = true
            controller.abort()
            clearInterval(interval)
            window.removeEventListener('focus', refreshIfStale)
            document.removeEventListener('visibilitychange', refreshIfStale)
        }
    }, [])

    useEffect(() => {
        if (!notificationData) return

        const onEventsPage = !!pathname?.includes('/crew/community/events')
        const onLogbookPage = !!pathname?.includes('/crew/pireps/logbook')

        try {
            const seen = new Set(JSON.parse(localStorage.getItem('inva-seen-events') || '[]'))
            const unseen = notificationData.eventIds.filter(id => !seen.has(String(id)))
            if (onEventsPage) {
                notificationData.eventIds.forEach(id => seen.add(String(id)))
                localStorage.setItem('inva-seen-events', JSON.stringify([...seen]))
                setEventsUnseen(0)
            } else {
                setEventsUnseen(unseen.length)
            }
        } catch {}

        try {
            const seen = new Set(JSON.parse(localStorage.getItem('inva-seen-rejected-pireps') || '[]'))
            const unseen = notificationData.rejectedPirepIds.filter(id => !seen.has(String(id)))
            if (onLogbookPage) {
                notificationData.rejectedPirepIds.forEach(id => seen.add(String(id)))
                localStorage.setItem('inva-seen-rejected-pireps', JSON.stringify([...seen]))
                setPirepsUnseen(0)
            } else {
                setPirepsUnseen(unseen.length)
            }
        } catch {}
    }, [notificationData, pathname])

    return (
        <Ctx.Provider value={{ eventsUnseen, pirepsUnseen }}>
            {children}
        </Ctx.Provider>
    )
}

export const useNotifications = () => useContext(Ctx)
