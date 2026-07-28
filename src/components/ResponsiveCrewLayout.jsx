'use client'

import { Box } from '@chakra-ui/react'
import dynamic from 'next/dynamic'

// The top nav (DashNav → pulls in AigChat) and the sidebar (386 lines,
// react-icons, role selector) are the bulk of the crew shell's SSR render + a
// big share of the cold-isolate module-init cost — and they render on EVERY
// /crew page. On a cold isolate that pushes the render past the ~2s CPU limit,
// which is the dominant source of the 1102 (exceededCpu) errors. They're
// interactive chrome with no SEO value (authenticated, noindex), and the layout
// below already reserves their space (60px top / 250px left), so loading them
// client-only removes them from the worker's cold-start path with no layout
// shift — they hydrate in a beat later behind fixed-size placeholders.
const DashNav = dynamic(() => import("@/components/DashNav"), {
  ssr: false,
  loading: () => <Box h="60px" w="100%" bg={{ base: "white", _dark: "gray.900" }} />,
});
const SidebarComponent = dynamic(() => import("@/components/SideBar"), {
  ssr: false,
  loading: () => <Box h="100%" w={{ base: 0, md: "250px" }} />,
});


export default function ResponsiveCrewLayout({
  children,
  callsign,
  isAdmin = false,
  careerMode = false,
  ceo = false,
  showSidebar = true
}) {
  return (
    <Box minH="100vh">

      {/* Fixed DashNav at top */}
      <Box
        position="fixed"
        top="0"
        left="0"
        width="100vw"
        zIndex={20}
      >
        <DashNav callsign={callsign} />
      </Box>

      {/* Sidebar - renders both desktop and mobile versions */}
      {showSidebar && (
        <Box
          position="fixed"
          left="0"
          height="calc(100vh - 60px)"
          zIndex={10}
        >
          <SidebarComponent isAdmin={isAdmin} careerMode={careerMode} ceo={ceo} />
        </Box>
      )}

      {/* Main content area */}
      <Box
        // Add left padding only on desktop when sidebar is shown
        pl={{
          base: 0,
          md: showSidebar ? "250px" : 0
        }}
        // Add top padding for DashNav and mobile sidebar
        pt={{
          base: "8.5em",
          md: "60px"
        }}
        pr={{ base: 0, md: 4 }}
        pb={8}
        minH="calc(100vh - 60px)"
      >
        {children}
      </Box>
    </Box>

  );
}
