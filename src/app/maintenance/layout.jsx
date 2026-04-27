import { Provider as ChakraProvider } from "@/components/ui/provider"
import { Toaster } from "@/components/ui/toaster"

export default function MaintenanceLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <ChakraProvider>
                    {children}
                    <Toaster />
                </ChakraProvider>
            </body>
        </html>
    )
}
