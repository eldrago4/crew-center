import { Provider as ChakraProvider } from "@/components/ui/provider"
import { Toaster } from "@/components/ui/toaster"

// Not a root layout — src/app/layout.jsx renders the one <html>/<body>. This used
// to render its own nested pair (same latent bug as the old (main) layout). It only
// needs to supply Chakra, since maintenance/page.jsx is a Chakra client component;
// the document shell and the theme script come from the root.
export default function MaintenanceLayout({ children }) {
    return (
        <ChakraProvider>
            {children}
            <Toaster />
        </ChakraProvider>
    )
}
