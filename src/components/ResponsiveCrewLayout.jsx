'use client'

import { Box } from '@chakra-ui/react'
import DashNav from "@/components/DashNav";
import SidebarComponent from "@/components/SideBar";

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
          top="50px"
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
          base: "170px",  // 60px for DashNav + ~70px for mobile sidebar
          md: "60px"      // Only DashNav on desktop
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
