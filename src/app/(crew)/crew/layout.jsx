import { Providers } from "@/components/CrewProviders"
// import { useColorMode } from "@/components/ui/color-mode"

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers forcedTheme="light">{children}</Providers>
      </body>
    </html>
  )
}