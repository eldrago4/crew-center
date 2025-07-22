"use client";
import Navbar, {MobileNavMenu} from "@/components/NavBar";
import { Box, Text, VStack } from "@chakra-ui/react";
import Typed from "typed.js";
import React, { useEffect, useRef } from "react";
const helloLanguages = [
  "नमस्ते",           // Hindi (Namaste)
  "Welcome",           // English
  "নমস্কার",          // Bengali (Namaskar)
  "নমস্কাৰ",          // Assamese
  "ᱵᱟᱝᱜᱟ",          // Santali (Bangā) — Hello
  "नमस्कार",          // Bodo
  "નમસ્તે",           // Gujarati
  "ನಮಸ್ಕಾರ",          // Kannada
  "السلام علیکم",     // Kashmiri
  "നമസ്കാരം",         // Malayalam
  "নমস্কার",          // Manipuri
  "नमस्कार",          // Nepali
  "ନମସ୍କାର",          // Odia
  "ਸਤ ਸ੍ਰੀ ਅਕਾਲ",      // Punjabi
  "स्वागतम्",       // Sanskrit
  "السلام علیکم",     // Sindhi
  "வணக்கம்",          // Tamil
  "నమస్తే",           // Telugu
  "السلام علیکم"      // Urdu
];


export default function TestPage() {
 const typedEl = useRef(null);
  const typedInstance = useRef(null);

  const maxLen = helloLanguages.reduce(
    (acc, cur) => (cur.length > acc.length ? cur : acc),
    ""
  );

  useEffect(() => {
    typedInstance.current = new Typed(typedEl.current, {
      strings: helloLanguages,
      typeSpeed: 100,
      backSpeed: 40,
      backDelay: 1200,
      loop: true,
      showCursor: true,
    });
    return () => {
      typedInstance.current?.destroy();
    };
  }, []);

    return (
      <>
      <Navbar />
      <MobileNavMenu />
      <Box w="100%" pt={12} pb={8} textAlign="center" position="relative">
      <Box
      display="inline-block"
      minW="160px"
      minH={{ base: "36px", md: "44px" }}
      textAlign="center"
      >
      <Text
        fontSize={{ base: "2xl", md: "3xl" }}
        fontWeight="bold"
        bgGradient="linear-gradient(170deg,rgba(253, 73, 7, 1) 37%, rgba(0, 0, 0, 1) 100%)"
        bgClip="text"
        position="relative"
        zIndex={2}
        whiteSpace="nowrap"
      >
        <span ref={typedEl} />
      </Text>
      <Text
        fontSize={{ base: "2xl", md: "3xl" }}
        fontWeight="bold"
        opacity={0}
        height={0}
        pointerEvents="none"
        position="absolute"
      >
        {maxLen}
      </Text>
      </Box>
      <Box mt={{ base: -5, md: -4.5 }} display="block" position="relative">
      <Text
        fontSize={{ base: "3xl", md: "7xl" }}
        fontWeight="extrabold"
        lineHeight="1.1"
        position="relative"
        bgGradient="linear-gradient(180deg,rgba(28, 28, 28, 1) 34%, rgba(25, 67, 99, 1) 82%, rgba(25, 74, 112, 1) 100%, rgba(43, 58, 74, 1) 100%)"
        bgClip="text"
        zIndex={1}
        display="inline-block"
      >
        Indian Virtual
        <Box
        as="span"
        position="absolute"
        right={0}
        bottom={{ base: "-10px", md: "-18px" }}
        display="flex"
        alignItems="flex-end"
        zIndex={2}
        gap={2}
        >
        <img
        src="/sa-member.svg"
        alt="SA Member"
        style={{ display: "inline-block" }}
        />
        <img
        src="/sa-logo.svg"
        alt="SA Logo"
        width={20}
        height={20}
        style={{
          display: "inline-block",
          position: "relative",
          right: "10px",
          bottom: "8px"
        }}
        />
        </Box>
      </Text>
      <Text fontSize="7xl">Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.

Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.

Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.
</Text>
      </Box>
      </Box>
      </>
    );
}










































































