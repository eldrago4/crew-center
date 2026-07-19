import { Box } from "@chakra-ui/react";
import { unstable_cache } from "next/cache";
import db from "@/db/client";
import { routes } from "@/db/schema";
import { count } from "drizzle-orm";
import RoutesClient from "./RoutesClient";

// The route-segment `revalidate = 86400` this page used to rely on was silently
// defeated: the parent layout's auth() (cookies) forces the segment dynamic, so the
// full routes-table select + count ran on EVERY request. unstable_cache works inside
// dynamic renders (same pattern as admin/statistics/queries.js), cutting the
// full-table scan to once a day per deployment. Staff edits bust it instantly via
// revalidateTag('routes') in /api/routes mutations.
//
// The try/catch fallbacks deliberately live OUTSIDE the cached functions: a cached
// function that swallows an error and returns [] would pin that empty result in the
// cache for a day. A thrown error is never cached, so the next request retries.

export const revalidate = 86400;

const getRoutesData = unstable_cache(
  async () => {
    const allRoutes = await db
      .select({
        flightNumber: routes.flightNumber,
        departureIcao: routes.departureIcao,
        arrivalIcao: routes.arrivalIcao,
        flightTime: routes.flightTime,
        aircraft: routes.aircraft,
      })
      .from(routes)

    return allRoutes.map(route => {
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
  },
  [ 'crew-routes-data' ],
  { revalidate: 86400, tags: [ 'routes' ] },
);

const getRoutesCount = unstable_cache(
  async () => {
    const result = await db.select({ value: count() }).from(routes);
    return (result[ 0 ]?.value || 0).toString();
  },
  [ 'crew-routes-count' ],
  { revalidate: 86400, tags: [ 'routes' ] },
);

export default async function RoutesPage() {

  let routesData, cacheVersion;
  try {
    [ routesData, cacheVersion ] = await Promise.all([
      getRoutesData(),
      getRoutesCount(),
    ]);
  } catch (error) {
    console.error("Error fetching routes:", error);
    routesData = [];
    cacheVersion = Date.now().toString();
  }


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