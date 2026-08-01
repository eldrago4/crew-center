import { Suspense } from "react"
import { Provider as ChakraProvider } from "@/components/ui/provider"
import { Toaster, toaster } from "@/components/ui/toaster"
import Navbar, { MobileNavMenu } from "@/components/NavBar";
import Footer from "@/components/Footer"
import { LightMode } from "@/components/ui/color-mode"

const BASE = 'https://indianvirtual.com'
const OG_IMAGE = `${BASE}/invaHomeBg.png`

export const metadata = {
    metadataBase: new URL(BASE),
    title: {
        default: 'Indian Virtual — Infinite Flight Virtual Airline',
        template: '%s | Indian Virtual',
    },
    description: 'Indian Virtual is a premier virtual airline in India, mirroring the operations of Air India and Air India Express in the virtual skies of Infinite Flight — real scheduled route networks and community events for enthusiasts.',
    keywords: [
        'Indian Virtual', 'Indian Virtual Airline', 'INVA', 'virtual airline India',
        'Infinite Flight virtual airline', 'Infinite Flight community', 'IFC',
        'virtual pilot India', 'Air India virtual', 'Air India Express virtual',
        'Air India Group virtual airline', 'Vistara virtual', 'IndiGo virtual',
        'scheduled route network', 'flight simulation India', 'online pilot community',
    ],
    authors: [ { name: 'Indian Virtual', url: BASE } ],
    creator: 'Indian Virtual',
    publisher: 'Indian Virtual',
    category: 'Aviation',
    robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
    openGraph: {
        type: 'website',
        locale: 'en_IN',
        url: BASE,
        siteName: 'Indian Virtual',
        title: 'Indian Virtual — Infinite Flight Virtual Airline',
        description: 'A premier virtual airline in India, mirroring Air India and Air India Express operations on Infinite Flight — real scheduled routes, community events, and 200+ pilots.',
        images: [ { url: OG_IMAGE, width: 1200, height: 630, alt: 'Indian Virtual — Virtual Airline' } ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Indian Virtual — Infinite Flight Virtual Airline',
        description: 'Mirroring Air India and Air India Express operations in the virtual skies of Infinite Flight — real scheduled routes and community events.',
        images: [ OG_IMAGE ],
    },
    alternates: {
        canonical: BASE,
    },
    icons: {
        icon: '/favicon.ico',
    },
    other: {
        'theme-color': '#2b4bee',
    },
}

const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Indian Virtual',
    alternateName: 'INVA',
    url: BASE,
    logo: `${BASE}/favicon.ico`,
    description: 'Indian Virtual (INVA) is a premier virtual airline in India, mirroring the operations of Air India and Air India Express in the virtual skies of Infinite Flight — following real scheduled route networks and running community events for enthusiasts, with 200+ pilots.',
    // Spelled out for search engines as well as readers: naming the airlines we
    // recreate is nominative — it describes what we fly, not who we are. The same
    // statement is carried in the site footer and in Terms §9.
    disambiguatingDescription: 'An independent, non-commercial virtual airline run by flight-simulation enthusiasts. Not affiliated with, endorsed by, or connected to Air India Limited, Air India Express, Vistara, or Infinite Flight LLC.',
    foundingDate: '2020',
    areaServed: 'IN',
    sameAs: [
        'https://discord.gg/indianvirtual',
        'https://community.infiniteflight.com',
    ],
}

// Group layout for the public site — NOT a root layout. The single <html>/<body>
// is rendered once by src/app/layout.jsx; this used to render its own pair too,
// nesting them under the root's. Browsers silently drop the inner tags so pages
// worked, but it was invalid and it's why this was misleadingly named RootLayout.
// It now mirrors (crew)/crew/layout.jsx: providers and chrome only, no document
// shell. The JSON-LD moves out of <head> into the body — Google reads it anywhere,
// and it's the pattern Next documents for structured data in the App Router.
export default function MainLayout({ children }) {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {/* Every existing (main) page is static/cacheable, so this never visibly
                suspends today. ChakraProvider's ColorModeProvider calls usePathname(),
                which Cache Components treats as needing a Suspense boundary above it
                once any (main) route is genuinely dynamic (e.g. /team/[callsign]) —
                without this, that route's dynamism has nowhere to be caught and blocks
                the whole layout. Mirrors (crew)/crew/layout.jsx's existing Suspense
                wrap, which sits above its own Providers for the same reason. */}
            <Suspense fallback={null}>
                <ChakraProvider>
                    {/* Pins the whole public site light, including on client-side
                        navigation back from /crew, where the root theme script never re-runs. */}
                    <LightMode>
                        <Navbar />
                        <MobileNavMenu />
                        {children}
                        <Toaster />
                        <Footer />
                    </LightMode>
                </ChakraProvider>
            </Suspense>
        </>
    )
}
