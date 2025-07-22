"use client";
import { Box, HStack, Text, StackSeparator } from "@chakra-ui/react";
import NextImage from "next/image";

export default function DashNav() {
    return (
        <Box
            position="fixed"
            top="0"
            left="0"
            width="100%"
            height="60px"
            bg="white"
            borderBottomWidth={1}
            display="flex"
            alignItems="flex-start"
            justifyContent="space-between"
            paddingX={4}
        >
            <HStack separator={<StackSeparator rotate="30deg" height="2em" bottom="15px"/>}>
                <NextImage
                    src="/invaLogo.svg"
                    alt="Home"
                    style={{ width: "auto", height: "60px" }}
                    width={0}
                    height={0}
                    sizes="auto"
                    priority
                />
                <Text fontSize="md">INVA</Text>
                <Text fontSize="md">INVA011</Text>
            </HStack>
        </Box>
    );
}
