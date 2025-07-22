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
  const [currentValue, setCurrentValue] = useState("pilot");

  const BUTTON_SECTIONS = {
    dashboard: [ "Profile" ],
    pireps: [
      "Logbook",
      "File"
    ],
    plan: [ "Routes",
      "Simbrief" ],
    community: [ "Events",
      "Routes of the Week",
      "Leaderboard",
      "Live Map" ],
    resources: [
      "Flying Manual",
      "Simbrief" ],
  };

  const adminButtons = [
    { label: "Route Database" },
    { label: "Fleet Database" },
    { label: "Recruits" },
    { label: "User Console", href: "/test/users", asChild: true },
    { label: "ROTW & Events" },
    { label: "Pireps" },
    { label: "Statistics" },
  ];

  const sectionButtons = {};
  for (const [section, labels] of Object.entries(BUTTON_SECTIONS)) {
    sectionButtons[section] = labels.map(label => ({ label }));
  }

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
        if (asChild) {
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
      height="calc(100vh - 60px)"
      borderRightWidth={1}
      marginTop="60px"
    >
      <VStack width="100%">
        {currentValue !== "admin" && (
          <>
            {Object.entries(sectionButtons).map(([section, buttons]) => (
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
