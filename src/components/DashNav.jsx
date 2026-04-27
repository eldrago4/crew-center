import { Box, HStack, Text } from "@chakra-ui/react";
import NextImage from "next/image";
import { ColorModeButton } from "../components/ui/color-mode";

// Custom SVG slash separator component
const SlashSeparator = () => (
    <svg
        width="12"
        height="24"
        viewBox="0 0 12 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ alignSelf: "center" }}
    >
        <line
            x1="2"
            y1="20"
            x2="10"
            y2="4"
            stroke="#CBD5E0"
            strokeWidth="1.5"
            strokeLinecap="round"
        />
    </svg>
);

export default function DashNav({ callsign }) {
    return (
        <Box
            position="fixed"
            top="0"
            left="0"
            width="100%"
            height="60px"
            bg={{ base: "white", _dark: "gray.800" }}
            borderBottomWidth={{ base: 1, _dark: 0 }}
            borderBottomColor={{ base: "gray.200", _dark: "gray.700" }}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            paddingX={4}
            css={{ "&": { transition: "background-color 0.2s" } }}
        >
            <HStack spacing={4} alignItems="center">
                <NextImage
                    src="/invaLogo.svg"
                    alt="Home"
                    style={{ width: "auto", height: "40px" }}
                    width={0}
                    height={0}
                    sizes="auto"
                    priority
                />
                <SlashSeparator />
                <Text fontSize="md" fontWeight="medium" color={{ base: "gray.800", _dark: "white" }}>INVA</Text>
                <SlashSeparator />
                <Text fontSize="md" fontWeight="medium" color={{ base: "gray.800", _dark: "white" }}>{callsign}</Text>
            </HStack>
            <HStack spacing={3} alignItems="center">
                <ColorModeButton />
            </HStack>
        </Box>
    );
}
