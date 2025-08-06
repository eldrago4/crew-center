import { Box } from "@chakra-ui/react";
import db from "@/db/client";
import { routes } from "@/db/schema";
import { count } from "drizzle-orm";
import RoutesClient from "./RoutesClient";
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export const revalidate = 86400;

async function getRoutesData() {
  try {
    const allRoutes = await db
      .select({
        flightNumber: routes.flightNumber,
        departureIcao: routes.departureIcao,
        arrivalIcao: routes.arrivalIcao,
        flightTime: routes.flightTime,
        aircraft: routes.aircraft,
      })
      .from(routes)

    const transformedRoutes = allRoutes.map(route => {
      const [ hours, minutes ] = route.flightTime ? route.flightTime.split(':').map(Number) : [ 0, 0 ];

      return {
        flight_number: route.flightNumber,
        departure_icao: route.departureIcao,
        arrival_icao: route.arrivalIcao,
        flight_time_hours: hours,
        flight_time_minutes: minutes,
        aircraft_names: route.aircraft,
      };
    });

    return transformedRoutes;
  } catch (error) {
    console.error("Error fetching routes:", error);
    return [];
  }
}

async function getRoutesCount() {
  try {
    const result = await db.select({ value: count() }).from(routes);
    return (result[ 0 ]?.value || 0).toString();
  } catch (error) {
    console.error("Error fetching routes count:", error);
    return Date.now().toString();
  }
}

export default async function RoutesPage() {
  const session = await auth()
  const [ routesData, cacheVersion ] = await Promise.all([
    getRoutesData(),
    getRoutesCount(),
  ]);


  return (
    <>
      <Box p={{ base: 4, md: 4 }} flex="1">
        <RoutesClient
          initialRoutes={routesData}
          cacheVersion={cacheVersion}
        />
      </Box>
    </>
  )
}