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

const SidebarComponent = ({ isAdmin = false, careerMode = false, ceo = false }) => {
  const [currentValue, setCurrentValue] = useState("pilot");
  const [isMobileNavVisible, setIsMobileNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  // --- Scroll handler to show/hide mobile nav ---
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Hide only if scrolling down and past the header
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


  // --- Data with Icons ---
  const BUTTON_SECTIONS = {
    dashboard: [{ label: "Profile", href: "/crew/dashboard", icon: FiUser }],
    pireps: [
      { label: "Logbook", href: "/crew/pireps/logbook", icon: FiBookOpen },
      { label: "File", href: "/crew/pireps/file", icon: FiFilePlus }
    ],
    plan: [
      { label: "Routes", href: "/crew/routes", icon: FiMap },
      { label: "Simbrief", href: "/crew/plan/simbrief", icon: FiBriefcase },
      { label: "Career Mode", href: "/crew/plan/career-mode", disabled: !careerMode, icon: FiTrendingUp }
    ],
    community: [
      { label: "Events", href: "/crew/community/events", icon: FiCalendar },
      { label: "Routes of the Week", href: "/crew/community/rotw", icon: FiStar },
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
    ...(ceo ? [{ label: "Server Config", href: "/crew/admin/server-config", icon: FiServer }] : []),
  ];

  // --- Style Props ---
  const sectionHeaderProps = {
    fontWeight: "light",
    fontSize: "2xs",
    color: "gray.500",
    textTransform: "uppercase",
    width: "100%",
    mt: 0.5,
    mb: 0,
  };

  const desktopButtonProps = {
    variant: "ghost",
    size: "sm",
    width: "100%",
    justifyContent: "flex-start",
    transition: "all 0.2s ease-in-out",
    _hover: {
      bg: 'blue.50',
      color: 'blue.600',
    },
  };

  // --- Event Handlers ---
  const handleValueChange = (value) => {
    setCurrentValue(value);
  };

  // --- Render Functions ---

  // Renders buttons for the original desktop sidebar
  const renderDesktopButtons = (buttons) => (
    <ButtonGroup orientation="vertical" spacing={0} width="80%">
      {buttons.map(({ label, href, disabled }, idx) => (
        <Button
          key={idx}
          {...desktopButtonProps}
          as={href && !disabled ? "a" : "button"}
          href={href}
          isDisabled={disabled}
        >
          {label}
        </Button>
      ))}
    </ButtonGroup>
  );

  // Renders the new "square chunk" buttons for the mobile bar
  const renderMobileButtons = (buttons) => (
    <Flex
      as="nav"
      overflowX="auto"
      // Hide scrollbar for a cleaner look on supported browsers
      css={{
        '&::-webkit-scrollbar': {
          display: 'none',
        },
        'scrollbarWidth': 'thin',
        'scrollbarColor': '#A0AEC0 transparent'
      }}
    >
      <HStack spacing={3}>
        {buttons.map(({ label, href, disabled, icon, isSegmentControl }, idx) => {
          if (isSegmentControl) {
            return (
              <Box key="segment-control" p={2} bg="transparent" borderRadius="md">
                <RoleSelectorSegmentGroup
                  mobileOrientation={true}
                  onChange={handleValueChange}
                  defaultValue={currentValue}
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
                w="80px"
                h="70px"
                p={2}
                bg="transparent"
                borderRadius="md"
                justifyContent="center"
                alignItems="center"
                spacing={1}
                transition="background 0.2s ease-in-out"
                _hover={{ bg: !disabled ? 'blue.50' : 'transparent' }}
                opacity={disabled ? 0.5 : 1}
                cursor={disabled ? 'not-allowed' : 'pointer'}
              >
                <Icon as={icon} boxSize="24px" color="gray.700" />
                <Text fontSize="11px" color="gray.600" textAlign="center" noOfLines={2}>
                  {label}
                </Text>
              </VStack>
            </Box>
          );
        })}
      </HStack>
    </Flex>
  );

  // Determine which set of buttons to show in the mobile view
  const baseMobileButtons = currentValue === 'admin'
    ? adminButtons
    : Object.values(BUTTON_SECTIONS).flat();

  const mobileButtonsToShow = isAdmin
    ? [...baseMobileButtons, { isSegmentControl: true }]
    : baseMobileButtons;

  // --- Component Return ---
  return (
    <>
      {/* ===== DESKTOP SIDEBAR ===== */}
      <Box
        display={{ base: 'none', md: 'block' }}
        bg="white"
        px={4}
        py={4}
        w="250px"
        h="100vh"
        borderRightWidth="1px"
        borderColor="gray.200"
        position="fixed"
        top="60px"
        left={0}
      >
        <VStack width="100%" align="flex-start" spaceY={-2.5}>
          {isAdmin && (
            <RoleSelectorSegmentGroup onChange={handleValueChange} defaultValue={currentValue} />
          )}
          {currentValue !== "admin" ? (
            <>
              {Object.entries(BUTTON_SECTIONS).map(([section, buttons]) => (
                <Box key={section} w="100%">
                  <Text {...sectionHeaderProps}>{section}</Text>
                  {renderDesktopButtons(buttons)}
                </Box>
              ))}
            </>
          ) : (
            <Box w="100%">
              <Text {...sectionHeaderProps}>ADMIN TOOLS</Text>
              {renderDesktopButtons(adminButtons)}
            </Box>
          )}
        </VStack>
      </Box>

      {/* ===== MOBILE TOP BAR ===== */}
      <Box
        display={{ base: 'block', md: 'none' }}
        position="fixed"
        top="45px"
        left={0}
        right={0}
        bg="white"
        borderBottomWidth="1px"
        borderColor="gray.200"
        px={3}
        zIndex="docked"
        transform={isMobileNavVisible ? 'translateY(0)' : 'translateY(-100%)'}
        transition="transform 0.3s ease-in-out"
      >
        {renderMobileButtons(mobileButtonsToShow)}
      </Box>
    </>
  );
};

export default SidebarComponent;
