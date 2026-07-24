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
  Float,
  Circle,
  Badge,
} from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import NoPrefetchLink from '@/components/NoPrefetchLink';
import {
  FiUser, FiBookOpen, FiFilePlus, FiMap, FiBriefcase, FiTrendingUp,
  FiCalendar, FiStar, FiAward, FiGlobe, FiBook, FiDatabase, FiTruck,
  FiUserPlus, FiUsers, FiEdit, FiCheckSquare, FiBarChart2, FiServer, FiHeart
} from 'react-icons/fi';
import RoleSelectorSegmentGroup from '@/components/RoleSelectorSegmentGroup';
import { useSidebar } from '@/components/SidebarContext';

// External links (Discord, etc.) should stay as plain <a> hard-navigations;
// only in-app routes get next/link so navigation doesn't full-page-reload.
const isExternalHref = (href) => /^https?:\/\//.test(href || '');

// Small crimson "NEW" pill matching the AI-recommendations feature accent.
const NewBadge = () => (
  <Badge
    bg="#be123c"
    color="white"
    fontSize="9px"
    fontWeight="800"
    letterSpacing="0.08em"
    px="1.5"
    py="0"
    borderRadius="full"
    lineHeight="1.4"
    textTransform="uppercase"
    flexShrink={0}
  >
    New
  </Badge>
);

const SidebarComponent = ({ isAdmin = false, careerMode = false, ceo = false }) => {


  const { sidebarMode: currentValue, updateSidebarMode } = useSidebar();

  // "NEW" badge on the Routes item (AI recommendations launch). Shown until the
  // pilot opens Routes once, then remembered in localStorage so it never
  // reappears. Default hidden so SSR and the first client render match; the
  // effect reveals it after reading storage.
  const NEW_BADGE_KEY = 'routes-ai-recs-seen';
  const [ showRoutesNew, setShowRoutesNew ] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(NEW_BADGE_KEY) !== '1') setShowRoutesNew(true);
    } catch { /* storage unavailable — just don't show the badge */ }
  }, []);

  const dismissRoutesNew = () => {
    setShowRoutesNew(false);
    try { localStorage.setItem(NEW_BADGE_KEY, '1'); } catch { /* ignore */ }
  };

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

  // Scale the desktop nav content to fit the available vertical space so it
  // never needs a scrollbar, regardless of viewport height or item count.
  const navAreaRef = useRef(null);
  const navContentRef = useRef(null);
  const [ navScale, setNavScale ] = useState(1);

  useEffect(() => {
    const recalcScale = () => {
      const area = navAreaRef.current;
      const content = navContentRef.current;
      if (!area || !content) return;

      const availableHeight = area.clientHeight;
      const contentHeight = content.scrollHeight;

      if (contentHeight > availableHeight && availableHeight > 0) {
        setNavScale(Math.max(availableHeight / contentHeight, 0.6));
      } else {
        setNavScale(1);
      }
    };

    recalcScale();

    const resizeObserver = new ResizeObserver(recalcScale);
    if (navAreaRef.current) resizeObserver.observe(navAreaRef.current);
    if (navContentRef.current) resizeObserver.observe(navContentRef.current);

    window.addEventListener('resize', recalcScale);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', recalcScale);
    };
  }, [ currentValue, isAdmin ]);





  const BUTTON_SECTIONS = {


    dashboard: [ { label: "Profile", href: "/crew/dashboard", icon: FiUser } ],
    pireps: [
      { label: "Logbook", href: "/crew/pireps/logbook", icon: FiBookOpen, notifKey: 'pireps' },
      { label: "File", href: "/crew/pireps/file", icon: FiFilePlus }
    ],
    plan: [
      { label: "Routes", href: "/crew/routes", icon: FiMap, isNew: true },
      { label: "Simbrief", href: "/crew/plan/simbrief", icon: FiBriefcase },
      { label: "Career Mode", href: "/crew/career", disabled: !careerMode, icon: FiTrendingUp }
    ],
    community: [
      { label: "Events", href: "/crew/community/events", icon: FiCalendar, notifKey: 'events' },
      { label: "Routes of the Week", href: "https://discord.com/channels/1246895842581938276/1270078880576966666", icon: FiStar },
      { label: "Leaderboard", href: "/crew/community/leaderboard", icon: FiAward },
      { label: "Live Map", href: "/crew/community/live-map", icon: FiGlobe },
      { label: "Contributions", href: "/crew/chanda", icon: FiHeart }
    ],
    resources: [
      { label: "Flying Manual", href: "/crew/resources/flying-manual", icon: FiBook },
      // Was "Simbrief" → /crew/resources/simbrief, a route that doesn't exist (168×
      // 404/24h, each still rendered through the dynamic crew segment). Repurposed to
      // Ranks; external Discord link → rendered as a plain <a>, so no prefetch.
      { label: "Ranks", href: "https://discord.com/channels/1246895842581938276/1277594854989234290", icon: FiBarChart2 }
    ],
  };

  const adminButtons = [
    { label: "Route Database", href: "/crew/admin/routes", icon: FiDatabase },
    { label: "Fleet Database", href: "/crew/admin/fleet", icon: FiTruck },
    { label: "Recruits", href: "/crew/admin/recruits", icon: FiUserPlus },
    { label: "User Console", href: "/crew/admin/users", icon: FiUsers },
    { label: "ROTW & Events", href: "/crew/admin/rotw", icon: FiEdit },
    { label: "Pireps", href: "/crew/admin/pireps", icon: FiCheckSquare },
    { label: "Contributions", href: "/crew/admin/chanda", icon: FiHeart },
    { label: "Statistics", href: "/crew/admin/statistics", icon: FiBarChart2 },
    ...(ceo ? [ { label: "Server Config", href: "/crew/admin/server-config", icon: FiServer } ] : []),
  ];

  const sectionHeaderProps = {
    fontWeight: "700",
    fontSize: "11px",
    letterSpacing: "wider",
    color: "#888",
    _dark: { color: "gray.400" },
    textTransform: "uppercase",
    width: "100%"
  };

  const desktopButtonProps = {
    variant: "ghost",
    size: "xs",
    width: "100%",
    fontSize: "14px",
    fontWeight: "500",
    color: "#222",
    _dark: { color: "gray.100" },
    pl: "4",
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
      {buttons.map(({ label, href, disabled, isNew }, idx) => {
        return (
          <Box key={idx} position="relative" display="flex" width="100%">
            <Button
              {...desktopButtonProps}
              as={href && !disabled ? (isExternalHref(href) ? "a" : NoPrefetchLink) : "button"}
              href={href}
              {...(disabled ? { disabled: true } : {})}
              onClick={isNew && showRoutesNew ? dismissRoutesNew : undefined}
              flex={1}
            >
              <HStack gap={2} width="100%">
                <Text as="span">{label}</Text>
                {isNew && showRoutesNew && <NewBadge />}
              </HStack>
            </Button>

          </Box>
        );
      })}
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
      <HStack spacing={2} align="center" justify="center">
        {buttons.map(({ label, href, disabled, icon, isSegmentControl, isNew }, idx) => {
          if (isSegmentControl) {


            return (
              <Box key="segment-control" bg="transparent" borderRadius="md">
                <RoleSelectorSegmentGroup
                  onChange={handleValueChange}
                  value={currentValue}
                />
              </Box>
            );
          }

          return (
            <Box
              key={idx}
              position="relative"
              as={!disabled && !isExternalHref(href) ? NoPrefetchLink : "a"}
              href={!disabled ? href : undefined}
              _hover={{ textDecoration: 'none' }}
              onClick={(e) => {
                if (disabled) { e.preventDefault(); return; }
                if (isNew && showRoutesNew) dismissRoutesNew();
              }}
              aria-disabled={disabled}
            >
              {isNew && showRoutesNew && (
                <Float placement="top-end" offsetX="1" offsetY="1">
                  <NewBadge />
                </Float>
              )}
              <VStack
                w="72px"
                minH="58px"
                py="1"
                px="1"
                bg="transparent"
                borderRadius="md"
                justifyContent="center"
                alignItems="center"
                spacing="1"
                transition="background 0.2s ease-in-out"
                _hover={{ bg: !disabled ? { base: 'blue.50', _dark: 'whiteAlpha.100' } : 'transparent' }}
                opacity={disabled ? 0.5 : 1}
                cursor={disabled ? 'not-allowed' : 'pointer'}
              >
                <Icon as={icon} boxSize="20px" flexShrink={0} color={{ base: "gray.700", _dark: "gray.300" }} />
                {/* Fixed 2-line label area → every item's icon sits at the exact same height */}
                <Box h="26px" width="100%" display="flex" alignItems="center" justifyContent="center">
                  <Text fontSize="11px" lineHeight="1.15" color={{ base: "gray.600", _dark: "gray.400" }} textAlign="center" noOfLines={2}>
                    {label}
                  </Text>
                </Box>
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
        display={{ base: 'none', md: 'flex' }}
        flexDirection="column"
        bg={{ base: "white", _dark: "gray.800" }}
        px={5}
        py={30}
        w="250px"
        h="calc(100vh - 60px)"
        borderRightWidth="1px"
        borderColor={{ base: "gray.200", _dark: "gray.700" }}
        position="fixed"
        top="60px"
        left={0}
        css={{ "&": { transition: "background-color 0.2s" } }}
      >
        {/* Nav content area — scales down to fit available height, never scrolls */}
        <Box ref={navAreaRef} width="100%" flex="1" minH="0" overflow="hidden">
          <VStack
            ref={navContentRef}
            width={`${100 / navScale}%`}
            align="stretch"
            style={{ transform: `scale(${navScale})`, transformOrigin: 'top left' }}
          >
            {currentValue !== "admin" ? (
              Object.entries(BUTTON_SECTIONS).map(([ section, buttons ]) => (
                <div key={section} style={{ width: '100%' }}>
                  <Text {...sectionHeaderProps}>{section.toUpperCase()}</Text>
                  {renderDesktopButtons(buttons)}
                </div>
              ))
            ) : (
              <div style={{ width: '100%' }}>
                <Text {...sectionHeaderProps}>ADMIN TOOLS</Text>
                {renderDesktopButtons(adminButtons)}
              </div>
            )}
          </VStack>
        </Box>

        {/* Role toggle — always anchored to the bottom; never moves with mode/scroll.
            mt="auto" pushes it to the bottom of the fixed sidebar column. */}
        {isAdmin && (
          <Box width="100%" pt="3" mt="auto" flexShrink={0}>
            <RoleSelectorSegmentGroup onChange={handleValueChange} value={currentValue} />
          </Box>
        )}
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
        pt={3}
        pb={2}
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
