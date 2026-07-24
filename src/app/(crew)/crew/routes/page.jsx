import { Box } from "@chakra-ui/react";
import { connection } from "next/server";
import { cacheLife, cacheTag } from "next/cache";
import db from "@/db/client";
import { routes } from "@/db/schema";
import { count } from "drizzle-orm";
import { fetchFleetModule } from "@/app/(crew)/crew/pireps/file/fleetModule";
import RoutesClient from "./RoutesClient";

// Cache Components: the routes table is shared, per-user-free data reached at
// request time (the layout's auth() keeps the segment dynamic), so it uses
// 'use cache: remote' — the platform-backed cache shared across instances, the
// successor to the unstable_cache this page used before. 'days' ≈ revalidate 1d,
// which matches the old revalidate: 86400. Staff edits still bust it instantly
// via revalidateTag('routes') in the /api/routes mutations.
//
// The try/catch fallbacks deliberately live OUTSIDE the cached functions: a cached
// function that swallows an error and returns [] would pin that empty result in the
// cache for a day. A thrown error is never cached, so the next request retries.

async function getRoutesData() {
  'use cache: remote'
  cacheLife('days')
  cacheTag('routes')

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
}

async function getRoutesCount() {
  'use cache: remote'
  cacheLife('days')
  cacheTag('routes')

  const result = await db.select({ value: count() }).from(routes);
  return (result[ 0 ]?.value || 0).toString();
}

export default async function RoutesPage() {
  // Cached-read-only page below the auth-gated routes layout: connection() keeps
  // it request-time instead of executing the cached reads at build (which would
  // demand a live DB on every deploy for content the shell can't serve anyway).
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
