'use client';

import {
  Box,
  VStack,
  Text,
  Button,
  ButtonGroup,
  Flex,
  Icon,
  HStack,
} from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import {
  FiUser, FiBookOpen, FiFilePlus, FiMap, FiBriefcase, FiTrendingUp,
  FiCalendar, FiStar, FiAward, FiGlobe, FiBook, FiDatabase, FiTruck,
  FiUserPlus, FiUsers, FiEdit, FiCheckSquare, FiBarChart2, FiServer
} from 'react-icons/fi';
import RoleSelectorSegmentGroup from '@/components/RoleSelectorSegmentGroup';
import { useSidebar } from '@/components/SidebarContext';

const SidebarComponent = ({ isAdmin = false, careerMode = false, ceo = false }) => {
  const { sidebarMode: currentValue, updateSidebarMode } = useSidebar();
  const [ isMobileNavVisible, setIsMobileNavVisible ] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsMobileNavVisible(false);
      } else {
        setIsMobileNavVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const BUTTON_SECTIONS = {
    dashboard: [ { label: "Profile", href: "/crew/dashboard", icon: FiUser } ],
    pireps: [
      { label: "Logbook", href: "/crew/pireps/logbook", icon: FiBookOpen },
      { label: "File", href: "/crew/pireps/file", icon: FiFilePlus }
    ],
    plan: [
      { label: "Routes", href: "/crew/routes", icon: FiMap },
      { label: "Simbrief", href: "/crew/plan/simbrief", icon: FiBriefcase },
      { label: "Career Mode", href: "/crew/career", disabled: !careerMode, icon: FiTrendingUp }
    ],
    community: [
      { label: "Events", href: "/crew/community/events", icon: FiCalendar },
      { label: "Routes of the Week", href: "https://discord.com/channels/1246895842581938276/1270078880576966666", icon: FiStar },
      { label: "Leaderboard", href: "/crew/community/leaderboard", icon: FiAward },
      { label: "Live Map", href: "/crew/community/live-map", icon: FiGlobe }
    ],
    resources: [
      { label: "Flying Manual", href: "/crew/resources/flying-manual", icon: FiBook },
      { label: "Simbrief", href: "/crew/resources/simbrief", icon: FiBriefcase }
    ],
  };

  const adminButtons = [
    { label: "Route Database", href: "/crew/admin/routes", icon: FiDatabase },
    { label: "Fleet Database", href: "/crew/admin/fleet", icon: FiTruck },
    { label: "Recruits", href: "/crew/admin/recruits", icon: FiUserPlus },
    { label: "User Console", href: "/crew/admin/users", icon: FiUsers },
    { label: "ROTW & Events", href: "/crew/admin/rotw", icon: FiEdit },
    { label: "Pireps", href: "/crew/admin/pireps", icon: FiCheckSquare },
    { label: "Statistics", href: "/crew/admin/statistics", icon: FiBarChart2 },
    ...(ceo ? [ { label: "Server Config", href: "/crew/admin/server-config", icon: FiServer } ] : []),
  ];

  const sectionHeaderProps = {
    fontWeight: "light",
    fontSize: "2xs",
    color: "gray.500",
    _dark: { color: "gray.400" },
    textTransform: "uppercase",
    width: "100%"
  };

  const desktopButtonProps = {
    variant: "ghost",
    size: "xs",
    width: "100%",
    justifyContent: "flex-start",
    transition: "all 0.2s ease-in-out",
    _hover: {
      bg: { base: 'blue.50', _dark: 'whiteAlpha.100' },
      color: { base: 'blue.600', _dark: 'white' },
    }
  };

  const handleValueChange = (value) => {
    updateSidebarMode(value);
  };

  const renderDesktopButtons = (buttons) => (
    <ButtonGroup orientation="vertical" spacing={4} width="100%">
      {buttons.map(({ label, href, disabled }, idx) => (
        <Button
          key={idx}
          {...desktopButtonProps}
          as={href && !disabled ? "a" : "button"}
          href={href}
          {...(disabled ? { disabled: true } : {})}
        >
          {label}
        </Button>
      ))}
    </ButtonGroup>
  );

  const renderMobileButtons = (buttons) => (
    <Flex
      as="nav"
      overflowX="auto"
      css={{
        '&::-webkit-scrollbar': { height: '6px' },
        '&::-webkit-scrollbar-track': { background: 'transparent' },
        '&::-webkit-scrollbar-thumb': { background: '#CBD5E0', borderRadius: '3px' },
        '&::-webkit-scrollbar-thumb:hover': { background: '#A0AEC0' },
        'scrollbarWidth': 'thin',
        'scrollbarColor': '#A0AEC0 transparent',
      }}
    >
      <HStack spacing={1}>
        {buttons.map(({ label, href, disabled, icon, isSegmentControl }, idx) => {
          if (isSegmentControl) {
            return (
              <Box key="segment-control" bg="transparent" borderRadius="md">
                <RoleSelectorSegmentGroup
                  orientation="vertical"
                  onChange={handleValueChange}
                  value={currentValue}
                />
              </Box>
            );
          }
          return (
            <Box
              key={idx}
              as="a"
              href={!disabled ? href : undefined}
              _hover={{ textDecoration: 'none' }}
              onClick={(e) => { if (disabled) e.preventDefault(); }}
              aria-disabled={disabled}
            >
              <VStack
                w="70px"
                h="50px"
                p={2}
                bg="transparent"
                borderRadius="md"
                justifyContent="center"
                alignItems="center"
                spacing={1}
                transition="background 0.2s ease-in-out"
                _hover={{ bg: !disabled ? { base: 'blue.50', _dark: 'whiteAlpha.100' } : 'transparent' }}
                opacity={disabled ? 0.5 : 1}
                cursor={disabled ? 'not-allowed' : 'pointer'}
              >
                <Icon as={icon} boxSize="20px" color={{ base: "gray.700", _dark: "gray.300" }} />
                <Text fontSize="10px" color={{ base: "gray.600", _dark: "gray.400" }} textAlign="center" noOfLines={2}>
                  {label}
                </Text>
              </VStack>
            </Box>
          );
        })}
      </HStack>
    </Flex>
  );

  const baseMobileButtons = currentValue === 'admin'
    ? adminButtons
    : Object.values(BUTTON_SECTIONS).flat();

  const mobileButtonsToShow = isAdmin
    ? [ ...baseMobileButtons, { isSegmentControl: true } ]
    : baseMobileButtons;

  return (
    <>
      <Box
        display={{ base: 'none', md: 'block' }}
        bg={{ base: "white", _dark: "gray.800" }}
        px={5}
        py={30}
        w="250px"
        h="100vh"
        borderRightWidth="1px"
        borderColor={{ base: "gray.200", _dark: "gray.700" }}
        position="fixed"
        top="60px"
        left={0}
        css={{ "&": { transition: "background-color 0.2s" } }}
      >
        <VStack width="100%">
          {currentValue !== "admin" && (
            <>
              {Object.entries(BUTTON_SECTIONS).map(([ section, buttons ]) => (
                <div key={section} style={{ width: '100%' }}>
                  <Text {...sectionHeaderProps}>{section.toUpperCase()}</Text>
                  {renderDesktopButtons(buttons)}
                </div>
              ))}
            </>
          )}

          {isAdmin && (
            <RoleSelectorSegmentGroup onChange={handleValueChange} value={currentValue} />
          )}

          {currentValue === "admin" && (
            <div style={{ width: '100%' }}>
              <Text {...sectionHeaderProps}>ADMIN TOOLS</Text>
              {renderDesktopButtons(adminButtons)}
            </div>
          )}
        </VStack>
      </Box>

      <Box
        display={{ base: 'block', md: 'none' }}
        position="fixed"
        top="60px"
        left={0}
        right={0}
        bg={{ base: "white", _dark: "gray.800" }}
        borderTopWidth="1px"
        borderBottomWidth="1px"
        borderColor={{ base: "gray.200", _dark: "gray.700" }}
        px={2}
        zIndex="docked"
        transform={isMobileNavVisible ? 'translateY(0)' : 'translateY(-100%)'}
        transition="transform 0.3s ease-in-out"
        css={{ "&": { transition: "background-color 0.2s" } }}
      >
        {renderMobileButtons(mobileButtonsToShow)}
      </Box>
    </>
  );
};

export default SidebarComponent;