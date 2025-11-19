import { Providers } from "@/components/CrewProviders"

export default function RootLayout({ children }) {
  return (
    <Providers>{children}</Providers>
  )
}
