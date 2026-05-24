'use client'

import { IconButton, ClientOnly, Span } from '@chakra-ui/react'
import * as React from 'react'
import { LuMoon, LuSun } from 'react-icons/lu'

export function ColorModeProvider({ children }) {
  // No-op provider: Chakra handles color mode. Render children directly.
  return <>{children}</>
}

export function useColorMode() {
  const [ colorMode, setColorModeState ] = React.useState(() => {
    if (typeof window === 'undefined') return 'light'
    try {
      const stored = localStorage.getItem('chakra-ui-color-mode')
      if (stored) return stored
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    } catch (e) {
      return 'light'
    }
  })

  React.useEffect(() => {
    try {
      localStorage.setItem('chakra-ui-color-mode', colorMode)
      if (colorMode === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    } catch (e) { }
  }, [ colorMode ])

  const setColorMode = (val) => setColorModeState(val)
  const toggleColorMode = () => setColorModeState((v) => (v === 'dark' ? 'light' : 'dark'))

  return {
    colorMode,
    setColorMode,
    toggleColorMode,
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

