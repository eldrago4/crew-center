'use client';

import {
  Box,
  VStack,
  Text,
  Button,
  ButtonGroup,
} from '@chakra-ui/react';
import { useState } from 'react';
import RoleSelectorSegmentGroup from '@/components/RoleSelectorSegmentGroup';

const SidebarComponent = ({ isAdmin = false }) => {
  const [ currentValue, setCurrentValue ] = useState("pilot");

  // Updated BUTTON_SECTIONS to include href for each item
  const BUTTON_SECTIONS = {
    dashboard: [ { label: "Profile", href: "/crew/dashboard" } ],
    pireps: [
      { label: "Logbook", href: "/crew/pireps/logbook" },
      { label: "File", href: "/crew/pireps/file" }
    ],
    plan: [
      { label: "Routes", href: "/crew/routes" },
      { label: "Simbrief", href: "/crew/plan/simbrief" }
    ],
    community: [
      { label: "Events", href: "/crew/community/events" },
      { label: "Routes of the Week", href: "/crew/community/rotw" },
      { label: "Leaderboard", href: "/crew/community/leaderboard" },
      { label: "Live Map", href: "/crew/community/live-map" }
    ],
    resources: [
      { label: "Flying Manual", href: "/crew/resources/flying-manual" },
      { label: "Simbrief", href: "/crew/resources/simbrief" }
    ],
  };

  const adminButtons = [
    { label: "Route Database", href: "/crew/admin/routes" }, // Added href
    { label: "Fleet Database", href: "/crew/admin/fleet" }, // Added href
    { label: "Recruits", href: "/crew/admin/recruits" }, // Added href
    { label: "User Console", href: "/crew/admin/users", asChild: true }, // Changed to /admin/users for consistency
    { label: "ROTW & Events", href: "/crew/admin/rotw" }, // Added href
    { label: "Pireps", href: "/crew/admin/pireps" }, // Added href
    { label: "Statistics", href: "/crew/admin/statistics" }, // Added href
  ];

  // sectionButtons now directly references BUTTON_SECTIONS as it contains the full objects
  const sectionButtons = BUTTON_SECTIONS;

  const sectionHeaderProps = {
    fontWeight: "light",
    fontSize: "2xs",
    color: "gray.500",
    textTransform: "uppercase",
    width: "100%"
  };

  const buttonProps = {
    variant: "ghost",
    size: "xs",
    width: "100%",
    margin: "-5px",
    justifyContent: "flex-start",
    _hover: {
      bg: 'blue.200',
      fontWeight: 'bold'
    }
  };

  const handleValueChange = (value) => {
    setCurrentValue(value);
  };

  const renderButtons = (buttons) => (
    <>
      {buttons.map(({ label, href, asChild }, idx) => {
        // If href is provided, render as a link, otherwise as a regular button
        if (href) {
          return (
            <Button key={idx} {...buttonProps} asChild>
              <a href={href}>{label}</a>
            </Button>
          );
        }
        return (
          <Button key={idx} {...buttonProps}>
            {label}
          </Button>
        );
      })}
    </>
  );

  return (
    <Box
      bg="white"
      px={5}
      py={30}
      borderRadius="md"
      width="100%"
      height="100vh"
      borderRightWidth={1}
      marginTop="60px"
    >
      <VStack width="100%">
        {currentValue !== "admin" && (
          <>
            {Object.entries(sectionButtons).map(([ section, buttons ]) => (
              <div key={section} style={{ width: '100%' }}>
                <Text {...sectionHeaderProps}>{section.toUpperCase()}</Text>
                <ButtonGroup orientation="vertical" spacing={4} width="100%">
                  {renderButtons(buttons)}
                </ButtonGroup>
              </div>
            ))}
          </>
        )}

        {isAdmin && (
          <RoleSelectorSegmentGroup onChange={handleValueChange} defaultValue={currentValue} />
        )}

        {currentValue === "admin" && (
          <>
            <Text {...sectionHeaderProps}>ADMIN TOOLS</Text>
            <ButtonGroup orientation="vertical" spacing={4} width="100%">
              {renderButtons(adminButtons)}
            </ButtonGroup>
          </>
        )}
      </VStack>
    </Box>
  );
};

export default SidebarComponent;
