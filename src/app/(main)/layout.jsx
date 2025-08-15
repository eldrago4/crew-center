import { Provider as ChakraProvider } from "@/components/ui/provider"
import { Toaster, toaster } from "@/components/ui/toaster"
import Navbar, { MobileNavMenu } from "@/components/NavBar";

import Footer from "@/components/Footer"
// import { ColorModeButton } from "@/components/ui/color-mode"
export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
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
