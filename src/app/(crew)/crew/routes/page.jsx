import { Box } from "@chakra-ui/react";
import { connection } from "next/server";
import { unstable_cache } from "next/cache";
import db from "@/db/client";
import { routes } from "@/db/schema";
import { count } from "drizzle-orm";
import { fetchFleetModule } from "@/app/(crew)/crew/pireps/file/fleetModule";
import RoutesClient from "./RoutesClient";

// connection() keeps this page request-time instead of prerendering at build:
// the crew layout no longer calls auth() to force the group dynamic, so without
// this the full routes-table select + count would run against the build-time DB.
// The real caching is unstable_cache (works inside dynamic renders, survives
// across instances/deploys), cutting the full-table scan to once a day. Staff
// edits bust it instantly via revalidateTag('routes') in /api/routes mutations.
//
// The try/catch fallbacks deliberately live OUTSIDE the cached functions: a cached
// function that swallows an error and returns [] would pin that empty result in the
// cache for a day. A thrown error is never cached, so the next request retries.

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
  await connection();

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

  // Fleet is the single source of truth for the aircraft dropdown AND the rank
  // filter (each entry carries { label, value, rank }). Fetched separately so a
  // fleet-read failure still renders the routes list — the client falls back to
  // an empty aircraft/rank filter rather than breaking the page.
  let fleet;
  try {
    fleet = await fetchFleetModule("fleet");
  } catch (error) {
    console.error("Error fetching fleet:", error);
    fleet = [];
  }


  return (
    <>
      <Box p={{ base: 4, md: 4 }} flex="1">
        <RoutesClient
          initialRoutes={routesData}
          cacheVersion={cacheVersion}
          fleet={Array.isArray(fleet) ? fleet : []}
        />
      </Box>
    </>
  )
}