// Single loader for the brand typefaces, shared by the pilot-profile pages and the
// site footer so the same families aren't requested twice.
//
// Worth knowing: several components across the site ask for 'Playfair Display' and
// 'Nata Sans' by name, but nothing ever loaded them — no <link>, no next/font — so
// those rules have always fallen back to the generic serif/sans. Anything routed
// through here is actually loaded.

import { IBM_Plex_Sans_Condensed, IBM_Plex_Mono, B612_Mono, Archivo_Black, Kalam } from 'next/font/google'

export const plexSans = IBM_Plex_Sans_Condensed({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-condensed',
  display: 'swap',
})

export const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
})

export const b612Mono = B612_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-b612-mono',
  display: 'swap',
})

export const archivoBlack = Archivo_Black({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-archivo-black',
  display: 'swap',
})

export const kalam = Kalam({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-kalam',
  display: 'swap',
})

// Everything — used by the pilot-profile pages, which reference all five.
export const brandFontClass = [
  plexSans.variable,
  plexMono.variable,
  b612Mono.variable,
  archivoBlack.variable,
  kalam.variable,
].join(' ')

// Just what the footer needs.
export const footerFontClass = [plexSans.variable, plexMono.variable, archivoBlack.variable].join(' ')
