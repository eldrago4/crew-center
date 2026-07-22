'use client'

import { IconButton, ClientOnly, Span } from '@chakra-ui/react'
import * as React from 'react'
import { usePathname } from 'next/navigation'
import { LuMoon, LuSun } from 'react-icons/lu'

const STORAGE_KEY = 'chakra-ui-color-mode'

// The same policy as the root layout's parse-time script: /crew login is dark-only,
// the crew app follows the stored preference (falling back to the OS), everything
// else — the public site — is always light. Keep the two in sync if either changes.
function resolveModeForPath(path) {
  if (path === '/crew') return 'dark'
  if (path && path.indexOf('/crew/') === 0) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'dark' || stored === 'light') return stored
    } catch (e) { }
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    } catch (e) {
      return 'light'
    }
  }
  return 'light'
}

function applyClass(mode) {
  document.documentElement.classList.toggle('dark', mode === 'dark')
}

// useLayoutEffect flips the class before paint on soft navigations; fall back to
// useEffect on the server so SSR doesn't warn.
const useIsoLayoutEffect =
  typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect

const ColorModeContext = React.createContext(null)

// A real provider again (it was briefly a pass-through, which left every
// useColorMode() with its own isolated state — toggling in DashNav couldn't
// re-render any other subscriber). One shared state, one source of truth.
export function ColorModeProvider({ children }) {
  const pathname = usePathname()

  const [ colorMode, setColorModeState ] = React.useState(() => {
    if (typeof window === 'undefined') return 'light'
    // First client render: trust the class the root layout's parse-time script set
    // before paint. Reading storage here could disagree with a path-forced mode
    // (login's dark) and flip the theme right after hydration.
    try {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    } catch (e) {
      return 'light'
    }
  })

  // Re-resolve on EVERY navigation. The parse-time script only runs on full
  // document loads, so a soft navigation into /crew/* used to arrive with no
  // `dark` class (the app "forgot" the preference and rendered light), and a
  // soft navigation out to the public site kept the crew `dark` class on
  // always-light pages. This effect is the soft-navigation half of the script.
  // Storage is deliberately NOT written here — only genuine toggles persist, so
  // the login page's forced dark can never overwrite a stored preference.
  useIsoLayoutEffect(() => {
    const mode = resolveModeForPath(pathname)
    applyClass(mode)
    setColorModeState(mode)
  }, [ pathname ])

  const setColorMode = React.useCallback((mode) => {
    setColorModeState(mode)
    try {
      applyClass(mode)
      localStorage.setItem(STORAGE_KEY, mode)
    } catch (e) { }
  }, [])

  const toggleColorMode = React.useCallback(() => {
    setColorModeState((current) => {
      const next = current === 'dark' ? 'light' : 'dark'
      try {
        applyClass(next)
        localStorage.setItem(STORAGE_KEY, next)
      } catch (e) { }
      return next
    })
  }, [])

  const value = React.useMemo(
    () => ({ colorMode, setColorMode, toggleColorMode }),
    [ colorMode, setColorMode, toggleColorMode ],
  )

  return (
    <ColorModeContext.Provider value={value}>
      {children}
    </ColorModeContext.Provider>
  )
}

export function useColorMode() {
  const ctx = React.useContext(ColorModeContext)
  if (ctx) return ctx
  // Rendered outside a provider (shouldn't happen — both the public and crew
  // trees mount ColorModeProvider). Degrade to a read-only view of the DOM class.
  const dark =
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark')
  return {
    colorMode: dark ? 'dark' : 'light',
    setColorMode: () => { },
    toggleColorMode: () => { },
  }
}

export function useColorModeValue(light, dark) {
  const { colorMode } = useColorMode()
  return colorMode === 'dark' ? dark : light
}

export function ColorModeIcon({ visibleIcon }) {
  const { colorMode } = useColorMode()
  if (visibleIcon) {
    return visibleIcon
  }
  return colorMode === 'dark' ? <LuMoon /> : <LuSun />
}

export const ColorModeButton = React.forwardRef(
  function ColorModeButton(props, ref) {
    const { toggleColorMode } = useColorMode()
    return (
      <ClientOnly fallback={<IconButton disabled variant="ghost" size="sm" aria-label="Loading" />}>
        <IconButton
          onClick={toggleColorMode}
          variant="ghost"
          aria-label="Toggle color mode"
          size="sm"
          ref={ref}
          {...props}
        >
          <ColorModeIcon />
        </IconButton>
      </ClientOnly>
    )
  },
)

export const LightMode = React.forwardRef(function LightMode(props, ref) {
  return (
    <Span
      color="fg"
      display="contents"
      className="chakra-theme light"
      ref={ref}
      {...props}
    />
  )
})

export const DarkMode = React.forwardRef(function DarkMode(props, ref) {
  return (
    <Span
      color="fg"
      display="contents"
      className="chakra-theme dark"
      ref={ref}
      {...props}
    />
  )
})
