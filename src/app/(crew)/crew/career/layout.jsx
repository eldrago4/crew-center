import { CareerProviders } from "@/components/CareerProviders"
import CareerNavBar, { CareerMobileNavMenu } from "@/components/CareerNavBar"
import CareerSideBar from "@/components/CareerSideBar"
import { Box } from "@chakra-ui/react"

export default function CareerLayout({ children }) {
    return (
        <CareerProviders>
            <CareerNavBar />
            <Box>
                {children}
            </Box>
        </CareerProviders>
    )
}
