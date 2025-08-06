import { Provider as ChakraProvider } from "@/components/ui/provider"
// import { ColorModeButton } from "@/components/ui/color-mode"
export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                {children}
            </body>
        </html>
    )
}