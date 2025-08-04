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
import { CgMenuRight } from "react-icons/cg";
import { IoCloseOutline } from "react-icons/io5";
import NextImage from "next/image";
import { useEffect, useRef, useState } from "react";

const MENU_LINKS = [
  [
    { label: "Routes", href: "/routes" },
    { label: "Hubs", href: "/hubs" },
    { label: "Ranks", href: "/ranks" },
  ],
  [
    { label: "Live", href: "/live" },
    { label: "Stats", href: "/stats" },
    { label: "Briefings", href: "/briefings" },
  ],
];

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
      colorPalette="purple"
      variant="subtle"
      size="sm"
      positioning={{
        placement: "bottom",
        gutter: 14,
        strategy: "absolute",
      }}
    >
      <Menu.Trigger asChild>
        <Button
          variant="ghost"
          colorScheme="purple"
          fontWeight="600"
          size="sm"
          bg="white"
          color="purple.700"
          _hover={{ bg: "gray.100", color: "purple.800" }}
          _focus={{ boxShadow: "outline" }}
          px={3}
          py={2}
        >
          Operations <FaChevronDown />
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content
            borderColor="purple.300"
            borderWidth="2px"
            boxShadow="lg"
            bgGradient="linear(135deg, #f8f6ff 60%, #f3eaff 100%)"
            borderRadius="xl"
            minW="240px"
            maxW="340px"
            px={0}
            py={3}
            fontFamily="Inter, system-ui, sans-serif"
            fontSize="sm"
            style={{ transition: "background 0.4s" }}
          >
            <Flex>
              {MENU_LINKS.map((col, idx) => (
                <VStack key={idx} align="stretch" spacing={1} flex={1} px={2}>
                  {col.map(item => (
                    <Menu.Item
                      asChild
                      key={item.href}
                      value={item.label.toLowerCase()}
                      _focus={{
                        bg: "purple.100",
                        fontWeight: "600",
                      }}
                      px={3}
                      py={2}
                      cursor="pointer"
                      borderRadius="md"
                      fontWeight="500"
                      color="gray.800"
                    >
                      <Link href={item.href}>{item.label}</Link>
                    </Menu.Item>
                  ))}
                </VStack>
              ))}
            </Flex>
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
                setMenuOpen((open) => !open);
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
                <Link href="/routes" color="gray.300">Routes</Link>
                <Link href="/ranks" color="gray.300">Ranks</Link>
                <Link href="/briefings" color="gray.300">Briefings</Link>
                <Link href="/fleet" color="gray.300">Fleet</Link>
              </VStack>
            </Box>
          </Box>
          <Link color="white" href="/live" fontSize="xl" fontWeight="medium">
            Live
          </Link>
          <Link color="white" href="/events" fontSize="xl" fontWeight="medium">
            Events
          </Link>
          <Link color="white" href="/info" fontSize="xl" fontWeight="medium">
            About
          </Link>
          <Link color="white" href="/apply" fontSize="xl" fontWeight="medium">
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