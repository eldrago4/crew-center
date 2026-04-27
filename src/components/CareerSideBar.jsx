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
    FiCalendar, FiStar, FiAward, FiGlobe, FiBook
} from 'react-icons/fi';

const CareerSideBar = () => {
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
        dashboard: [ { label: "Profile", href: "/crew/career/profile", icon: FiUser } ],
        pireps: [
            { label: "Logbook", href: "/crew/career/pireps/logbook", icon: FiBookOpen },
            { label: "File", href: "/crew/career/pireps/file", icon: FiFilePlus }
        ],
        plan: [
            { label: "Routes", href: "/crew/career/routes", icon: FiMap },
            { label: "Simbrief", href: "/crew/career/plan/simbrief", icon: FiBriefcase },
            { label: "Career Mode", href: "/crew/career/plan/career-mode", icon: FiTrendingUp }
        ],
        community: [
            { label: "Events", href: "/crew/career/community/events", icon: FiCalendar },
            { label: "Routes of the Week", href: "/crew/career/community/rotw", icon: FiStar },
            { label: "Leaderboard", href: "/crew/career/community/leaderboard", icon: FiAward },
            { label: "Live Map", href: "/crew/career/community/live-map", icon: FiGlobe }
        ],
        resources: [
            { label: "Flying Manual", href: "/crew/career/resources/flying-manual", icon: FiBook },
            { label: "Simbrief", href: "/crew/career/resources/simbrief", icon: FiBriefcase }
        ],
    };

    const sectionHeaderProps = {
        fontWeight: "light",
        fontSize: "2xs",
        color: "gray.300",
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
            bg: 'gray.700',
            color: 'gray.100',
        },
        color: "gray.300"
    };

    const renderDesktopButtons = (buttons) => (
        <ButtonGroup orientation="vertical" spacing={4} width="100%">
            {buttons.map(({ label, href }, idx) => (
                <Button
                    key={idx}
                    {...desktopButtonProps}
                    as="a"
                    href={href}
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
            <HStack spacing={3}>
                {buttons.map(({ label, href, icon }, idx) => (
                    <Box
                        key={idx}
                        as="a"
                        href={href}
                        _hover={{ textDecoration: 'none' }}
                    >
                        <VStack
                            w="80px"
                            h="70px"
                            p={2}
                            bg="gray.800"
                            borderRadius="md"
                            justifyContent="center"
                            alignItems="center"
                            spacing={1}
                            transition="background 0.2s ease-in-out"
                            _hover={{ bg: 'gray.700' }}
                        >
                            <Icon as={icon} boxSize="24px" color="gray.300" />
                            <Text fontSize="11px" color="gray.300" textAlign="center" noOfLines={2}>
                                {label}
                            </Text>
                        </VStack>
                    </Box>
                ))}
            </HStack>
        </Flex>
    );

    const baseMobileButtons = Object.values(BUTTON_SECTIONS).flat();

    return (
        <>
            <Box
                display={{ base: 'none', md: 'block' }}
                bg="gray.900"
                px={5}
                py={30}
                w="250px"
                h="100vh"
                borderRightWidth="1px"
                borderColor="gray.700"
                position="fixed"
                top="60px"
                left={0}
            >
                <VStack width="100%">
                    {Object.entries(BUTTON_SECTIONS).map(([ section, buttons ]) => (
                        <div key={section} style={{ width: '100%' }}>
                            <Text {...sectionHeaderProps}>{section.toUpperCase()}</Text>
                            {renderDesktopButtons(buttons)}
                        </div>
                    ))}
                </VStack>
            </Box>

            <Box
                display={{ base: 'block', md: 'none' }}
                position="fixed"
                top="45px"
                left={0}
                right={0}
                bg="gray.900"
                borderBottomWidth="1px"
                borderColor="gray.700"
                px={3}
                pt={2}
                zIndex="docked"
                transform={isMobileNavVisible ? 'translateY(0)' : 'translateY(-100%)'}
                transition="transform 0.3s ease-in-out"
            >
                {renderMobileButtons(baseMobileButtons)}
            </Box>
        </>
    );
};

export default CareerSideBar;
