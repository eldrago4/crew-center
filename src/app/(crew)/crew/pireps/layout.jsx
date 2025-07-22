import DashNav from "@/components/DashNav";
import SidebarComponent from "@/components/SideBar";

import { Box, Flex } from "@chakra-ui/react";
export default function RootLayout({ children }) {
    return (
        <Flex>

            {/* DashNav - positioned above sidebar with higher z-index */}
            <Box
                position="fixed"
                top="0"
                left="0"
                width="100vw"
                zIndex={10}
                marginBottom={10}
            >
                <DashNav />
            </Box> {children}



        </Flex>
    );
}