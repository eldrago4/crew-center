'use client'

import dynamic from 'next/dynamic'

// /crew (the login page) was the one top-1102 route not fixed by the crew-shell
// change — it's the pre-login page and has no nav, so its ~2s cold-isolate CPU
// spike comes from rendering the Chakra login form + its module-init
// (js-cookie, react-icons, CallsignInput) on the server. The actual UI now lives
// in CrewLoginClient and is loaded client-only, so a cold isolate renders just
// the cheap placeholder below (plain CSS, no Chakra) — the form hydrates a beat
// later. This page is only reached by full page loads, so there's no SSR/SEO cost
// to lose, and the dark bg + spinner placeholder avoids a flash.
const CrewLoginClient = dynamic(() => import('./CrewLoginClient'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        backgroundColor: '#0b0f19',
        backgroundImage: 'url(/login-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '3px solid rgba(255,255,255,0.18)',
          borderTopColor: '#38b2ac',
          animation: 'crewlogin-spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes crewlogin-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  ),
})

export default function CrewLoginPage() {
  return <CrewLoginClient />
}
