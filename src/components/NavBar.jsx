"use client";
import {
  Menu,
  Portal,
  Flex,
  VStack,
  Box,
  Link,
  Button,
  HStack,
  Image,
  Grid,
  GridItem,
  IconButton,
  Text,
} from "@chakra-ui/react";
import { FaChevronDown } from "react-icons/fa";
import {
  FaRoute,
  FaCrown,
  FaTowerBroadcast,
  FaMedal,
  FaPlane,
  FaBriefcase,
  FaChartLine,
  FaBookOpen,
} from "react-icons/fa6";
import { CgMenuRight } from "react-icons/cg";
import { IoCloseOutline } from "react-icons/io5";
import NextImage from "next/image";
import NextLink from "next/link";
import { useEffect, useRef, useState } from "react";

const BLUE = "#2b4bee";
const ORANGE = "#ff6b35";
const PURPLE = "#8223F6";

// Rendered as three accented columns in the desktop mega-menu, and flattened
// for the mobile slide-in menu — so an entry here reaches both.
const OPERATIONS_MENU = [
  {
    heading: "The Network",
    accent: BLUE,
    items: [
      { label: "Routes", href: "/operations/routes", icon: FaRoute, description: "The full route map" },
      { label: "Maharaja Trails", href: "/operations/trails", icon: FaCrown, description: "Curated flight itineraries", badge: "NEW" },
      { label: "Hubs", href: "/hubs", icon: FaTowerBroadcast, description: "Where INVA calls home" },
    ],
  },
  {
    heading: "Fleet & Ranks",
    accent: ORANGE,
    items: [
      { label: "Fleet", href: "/fleet", icon: FaPlane, description: "Every aircraft we fly" },
      { label: "Ranks", href: "/ranks", icon: FaMedal, description: "The Maharaja's chain of command" },
    ],
  },
  {
    heading: "Resources",
    accent: PURPLE,
    items: [
      { label: "Career", href: "/career", icon: FaBriefcase, description: "Join the flight deck" },
      { label: "Stats", href: "/stats", icon: FaChartLine, description: "Network numbers, live" },
      { label: "Briefings", href: "/briefings", icon: FaBookOpen, description: "Read before you fly" },
    ],
  },
];

const MENU_LINKS = OPERATIONS_MENU.map(col => col.items);

const glassBg = {
  bg: "rgba(0,0,0,0.6)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};

function OperationsMenu({ open, setOpen }) {
  return (
    <Menu.Root
      open={open}
      onOpenChange={details => setOpen(details.open)}
      variant="subtle"
      size="sm"
      positioning={{
        placement: "bottom-start",
        gutter: 16,
        strategy: "absolute",
      }}
    >
      <Menu.Trigger asChild>
        <Button
          variant="ghost"
          fontWeight="700"
          fontSize="sm"
          size="sm"
          bg="white"
          color={BLUE}
          border="1px solid"
          borderColor="white"
          rounded="full"
          px={4}
          py={2.5}
          gap={2}
          letterSpacing="0.01em"
          transition="all 0.2s ease"
          boxShadow={open ? `0 0 0 4px rgba(43,75,238,0.25)` : "none"}
          _hover={{ bg: "white", color: BLUE }}
          _focus={{ boxShadow: "none" }}
        >
          Operations
          <Box
            as={FaChevronDown}
            fontSize="10px"
            transform={open ? "rotate(180deg)" : "rotate(0deg)"}
            transition="transform 0.25s ease"
          />
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content
            border="1px solid"
            borderColor="gray.100"
            boxShadow="0 24px 60px -12px rgba(15, 23, 42, 0.35)"
            bg="white"
            borderRadius="2xl"
            minW="600px"
            maxW="94vw"
            p={0}
            overflow="hidden"
            fontFamily="Inter, system-ui, sans-serif"
          >
            {/* Brand accent bar */}
            <Box h="4px" w="full" bgGradient="linear(90.18deg, #2D37DB 0%, #8223F6 95.74%)" />

            <Grid templateColumns="repeat(3, 1fr)" gap={0} px={7} py={6}>
              {OPERATIONS_MENU.map((col, idx) => (
                <Box
                  key={col.heading}
                  pr={idx < OPERATIONS_MENU.length - 1 ? 3 : 0}
                  pl={idx > 0 ? 3 : 0}
                  borderLeft={idx > 0 ? "1px solid" : "none"}
                  borderColor="gray.100"
                >
                  <Text
                    fontSize="10px"
                    fontWeight="800"
                    letterSpacing="0.14em"
                    textTransform="uppercase"
                    color={col.accent}
                    mb={3}
                  >
                    {col.heading}
                  </Text>
                  <VStack align="stretch" gap={1}>
                    {col.items.map(item => (
                      <Menu.Item
                        asChild
                        key={item.href}
                        value={item.label.toLowerCase()}
                        px={0}
                        py={0}
                        borderRadius="lg"
                        cursor="pointer"
                        _focus={{ bg: "transparent" }}
                      >
                        <Link
                          as={NextLink}
                          href={item.href}
                          _hover={{ textDecoration: "none" }}
                          display="block"
                          className="group"
                        >
                          <HStack
                            align="start"
                            gap={3}
                            px={3}
                            py={2.5}
                            borderRadius="lg"
                            transition="background 0.15s ease"
                            _hover={{ bg: `${col.accent}0F` }}
                          >
                            <Flex
                              w="34px"
                              h="34px"
                              rounded="md"
                              align="center"
                              justify="center"
                              bg={`${col.accent}14`}
                              color={col.accent}
                              fontSize="14px"
                              flexShrink={0}
                            >
                              <item.icon />
                            </Flex>
                            <Box minW={0}>
                              <HStack gap={2}>
                                <Text fontWeight="700" fontSize="sm" color="gray.900">
                                  {item.label}
                                </Text>
                                {item.badge && (
                                  <Box
                                    as="span"
                                    fontSize="9px"
                                    fontWeight="800"
                                    letterSpacing="0.06em"
                                    color="white"
                                    bg={ORANGE}
                                    px={1.5}
                                    py="1px"
                                    borderRadius="full"
                                  >
                                    {item.badge}
                                  </Box>
                                )}
                              </HStack>
                              <Text fontSize="xs" color="gray.500" mt="1px" lineHeight="1.4">
                                {item.description}
                              </Text>
                            </Box>
                          </HStack>
                        </Link>
                      </Menu.Item>
                    ))}
                  </VStack>
                </Box>
              ))}
            </Grid>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}

export function MobileNavMenu() {
  const [ menuOpen, setMenuOpen ] = useState(false);
  const [ dropdownOpen, setDropdownOpen ] = useState(false);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [ menuOpen ]);

  return (
    <>
      <Box hideFrom="705px" position="fixed" top="0" left="0" w="full" zIndex={50} {...glassBg} boxShadow="md">
        <Flex align="center" justify="space-between" px={6}>
          <Image asChild>
            <NextImage
              src="/invaLogo.svg"
              alt="Home"
              style={{ width: "auto", height: "60px" }}
              width={0}
              height={0}
              sizes="auto"
              priority
            />
          </Image>
          <Flex align="center">
            <Button
              size="xs"
              variant="subtle"
              rounded="full"
              borderColor="black"
              borderBottomWidth="2px"
              asChild
            >
              <a href="/crew" target="_blank" rel="noopener noreferrer">
                Crew Center
              </a>
            </Button>
            <IconButton
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              variant="ghost"
              colorPalette="white"
              color="white"
              fontSize="2xl"
              size="lg"
              zIndex={51}
              onClick={() => {
                setMenuOpen(open => !open);
                if (menuOpen) setDropdownOpen(false);
              }}
            >
              {menuOpen ? <IoCloseOutline /> : <CgMenuRight />}
            </IconButton>
          </Flex>
        </Flex>
        <Box as="div" borderTopWidth="1px" borderColor="whiteAlpha.800" w="full" />
      </Box>
      {/* Slide-in menu */}
      <Box
        pos="fixed"
        top="60px"
        right={menuOpen ? "0" : "-100%"}
        w="90vw"
        maxW="400px"
        h="full"
        {...glassBg}
        zIndex={40}
        boxShadow="lg"
        transition="right 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
      >
        <VStack
          align="stretch"
          px={6}
          py={6}
          gap={6}
          color="white"
          position="relative"
        >
          {/* Operations Dropdown */}
          <Box>
            <Flex
              as="button"
              align="center"
              justify="space-between"
              w="full"
              textAlign="left"
              onClick={() => setDropdownOpen((open) => !open)}
              _focus={{ outline: "none" }}
              cursor="pointer"
            >
              <Text fontSize="xl" fontWeight="medium">
                Operations
              </Text>
              <Box
                as={FaChevronDown}
                ml={2}
                transform={dropdownOpen ? "rotate(180deg)" : undefined}
                transition="transform 0.3s"
              />
            </Flex>
            <Box
              overflow="hidden"
              maxH={dropdownOpen ? "160px" : "0"}
              opacity={dropdownOpen ? 1 : 0}
              transition="max-height 0.3s ease-in-out, opacity 0.3s"
              pl={6}
              pt={dropdownOpen ? 2 : 0}
            >
              <VStack align="stretch" spacing={2}>
                {MENU_LINKS.flat().map(item => (
                  <Link as={NextLink} key={item.href} href={item.href} color="gray.300">
                    {item.label}
                  </Link>
                ))}
              </VStack>
            </Box>
          </Box>
          <Link as={NextLink} color="white" href="/live" fontSize="xl" fontWeight="medium">
            Live
          </Link>
          <Link as={NextLink} color="white" href="/events" fontSize="xl" fontWeight="medium">
            Events
          </Link>
          <Link as={NextLink} color="white" href="/info" fontSize="xl" fontWeight="medium">
            About
          </Link>
          <Link as={NextLink} color="white" href="/apply" fontSize="xl" fontWeight="medium">
            Apply
          </Link>
        </VStack>
      </Box>
      {/* Overlay */}
      <Box
        display={menuOpen ? "block" : "none"}
        pos="fixed"
        inset={0}
        zIndex={30}
        bg="blackAlpha.700"
        onClick={() => {
          setMenuOpen(false);
          setDropdownOpen(false);
        }}
      />
    </>
  );
}

export default function Navbar() {

  const [ show, setShow ] = useState(true);
  const [ menuOpen, setMenuOpen ] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setMenuOpen(false);
          if (window.scrollY < 10) {
            setShow(true);
            lastScrollY.current = window.scrollY;
            ticking = false;
            return;
          }
          if (window.scrollY - lastScrollY.current > 20) {
            setShow(false);
          } else if (lastScrollY.current - window.scrollY > 10) {
            setShow(true);
          }
          lastScrollY.current = window.scrollY;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fontFamily = `'Inter', system-ui, sans-serif`;


  return (
    <Box hideBelow="704px"
      as="nav"
      position="sticky"
      top="0"
      zIndex="sticky"
      width="100%"
      px={0}
      py={0}
      style={{
        transition: "transform 0.4s cubic-bezier(.4,0,.2,1)",
        transform: show ? "translateY(0)" : "translateY(-100%)",
        fontFamily,
        background: "linear-gradient(90.18deg, #2D37DB 0%, #8223F6 95.74%)",
      }}
    >
      <Box
        position="absolute"
        inset={0}
        width="100%"
        height="100%"
        zIndex={0}
        pointerEvents="none"
        as="span"
        opacity={0.9}
      />
      <Flex align="center" height="3.5em" width="100%" position="relative" zIndex={1}>
        <Grid templateColumns="1fr auto 1fr" alignItems="center" width="100%">

          <GridItem>
            <HStack spacing={2} justify="flex-end" pr="2em">
              <OperationsMenu open={menuOpen} setOpen={setMenuOpen} />
              <Link
                as={NextLink}
                href="/live"
                color="white"
                fontFamily={fontFamily}
                fontWeight="600"
                fontSize="sm"
                px={3}
                py={2}
                borderRadius="md"
                _hover={{ color: "purple.200", bg: "whiteAlpha.100" }}
              >
                Live
              </Link>
            </HStack>
          </GridItem>
          
          <GridItem>
            <Box display="flex" alignItems="center" justifyContent="center">
              <Image asChild>
                <NextImage
                  src="/invaLogo1.svg"
                  alt="Home"
                  style={{ width: "auto", height: "69px" }}
                  width={0}
                  height={0}
                  sizes="auto"
                  priority
                />
              </Image>
            </Box>
          </GridItem>
          
          <GridItem>
            <HStack spacing={1} justify="flex-start" pl="2em">
              <Link
                as={NextLink}
                href="/events"
                color="white"
                fontFamily={fontFamily}
                fontWeight="600"
                fontSize="sm"
                px={3}
                py={2}
                borderRadius="md"
                _hover={{ color: "purple.200", bg: "whiteAlpha.100" }}
              >
                Events
              </Link>
              <Link
                as={NextLink}
                href="/info"
                color="white"
                fontFamily={fontFamily}
                fontWeight="600"
                fontSize="sm"
                px={3}
                py={2}
                borderRadius="md"
                _hover={{ color: "purple.200", bg: "whiteAlpha.100" }}
              >
                About
              </Link>
              {/* Apply & Crew Center */}
              <Flex ml="auto" align="center">
                <HStack mr={10}>
                  <Link
                    as={NextLink}
                    href="/apply"
                    color="white"
                    fontFamily={fontFamily}
                    fontWeight="600"
                    fontSize="sm"
                    px={3}
                    py={2}
                    borderRadius="md"
                    _hover={{ color: "purple.200", bg: "whiteAlpha.100" }}
                  >
                    Apply
                  </Link>
                  <Box
                    as="span"
                    height="24px"
                    width="1.5px"
                    bg="teal.300"
                    borderRadius="full"
                    mx={1}
                  />
                  <Button
                    size="sm"
                    variant="subtle"
                    rounded="full"
                    borderColor="black"
                    borderBottomWidth="2px"
                    asChild
                  >
                    <a href="/crew" target="_blank" rel="noopener noreferrer">
                      Crew Center
                    </a>
                  </Button>
                </HStack>
              </Flex>
            </HStack>
          </GridItem>
        </Grid>
      </Flex>
    </Box>
  );
}
