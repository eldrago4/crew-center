import { Provider as ChakraProvider } from "@/components/ui/provider"
import { SessionProvider } from 'next-auth/react'
import { Toaster } from "@/components/ui/toaster"
import { auth } from '@/auth'

export async function Providers({ children }) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('chakra-ui-color-mode');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })()
            `,
          }}
        />
      </head>
      <body>
        <SessionProvider session={session} refetchWhenOffline={false} refetchOnWindowFocus={false}>
          <ChakraProvider>
            {children}
            <Toaster />
          </ChakraProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
