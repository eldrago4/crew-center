import { Provider as ChakraProvider } from "@/components/ui/provider"
import { Toaster, toaster } from "@/components/ui/toaster"
import Navbar, { MobileNavMenu } from "@/components/NavBar";
import Footer from "@/components/Footer"

const BASE = 'https://indianvirtual.site'
const OG_IMAGE = `${BASE}/invaHomeBg.png`

export const metadata = {
    metadataBase: new URL(BASE),
    title: {
        default: 'Indian Virtual — Infinite Flight Virtual Airline',
        template: '%s | Indian Virtual',
    },
    description: 'Indian Virtual is India\'s premier virtual airline operating on Infinite Flight. Join 160+ pilots flying realistic operations with Air India, Vistara, IndiGo and more across India and the world.',
    keywords: [
        'Indian Virtual', 'Indian Virtual Airline', 'INVA', 'virtual airline India',
        'Infinite Flight virtual airline', 'Infinite Flight community', 'IFC',
        'virtual pilot India', 'Air India virtual', 'Vistara virtual',
        'IndiGo virtual', 'flight simulation India', 'online pilot community',
    ],
    authors: [{ name: 'Indian Virtual', url: BASE }],
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
        description: 'India\'s premier virtual airline on Infinite Flight. Join 160+ pilots flying realistic operations across India and the world.',
        images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'Indian Virtual — Virtual Airline' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Indian Virtual — Infinite Flight Virtual Airline',
        description: 'India\'s premier virtual airline on Infinite Flight. Join 160+ pilots flying realistic operations.',
        images: [OG_IMAGE],
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
    description: 'Indian Virtual is India\'s premier virtual airline operating on Infinite Flight, with 160+ pilots flying realistic operations.',
    foundingDate: '2020',
    areaServed: 'IN',
    sameAs: [
        'https://discord.gg/indianvirtual',
        'https://community.infiniteflight.com',
    ],
}

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            </head>
            <body>
                <ChakraProvider>
                    <Navbar />
                    <MobileNavMenu />
                    {children}
                    <Toaster />
                    <Footer />
                </ChakraProvider>
            </body>
        </html>
    )
}
