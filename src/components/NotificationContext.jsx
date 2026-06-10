'use client'

// Notifications feature removed.
// Kept as a minimal stub to avoid breaking any legacy imports.

export function NotificationProvider({ children }) {
  return children
}

export const useNotifications = () => ({ eventsUnseen: 0, pirepsUnseen: 0 })

