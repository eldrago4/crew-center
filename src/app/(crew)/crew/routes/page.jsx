import { Box, Grid, Skeleton, Stack } from "@chakra-ui/react";
import { Suspense } from "react";
import { connection } from "next/server";
import { cacheLife, cacheTag } from "next/cache";
import db from "@/db/client";
import { routes } from "@/db/schema";
import { fetchFleetModule } from "@/app/(crew)/crew/pireps/file/fleetModule";
import RoutesClient from "./RoutesClient";

// Cache Components: the routes table is shared, per-user-free data reached at
// request time, so it uses 'use cache: remote' — the platform-backed cache shared
// across instances. 'days' ≈ revalidate 1d. Staff edits bust it instantly via
// revalidateTag('routes') in the /api/routes mutations.
//
// The rows are packed into ONE tab/newline-delimited string rather than returned
// as ~2,294 nested objects: passing a single string across the RSC boundary is
// far cheaper to serialize than per-object Flight encoding, which was this page's
// dominant SSR cost. RoutesClient expands it back into rows on the client. Per
// line, tab-separated: flightNumber, dep, arr, hours, minutes, aircraft.
//
// The try/catch fallbacks deliberately live OUTSIDE the cached function: a cached
// function that swallows an error and returns "" would pin that empty result in
// the cache for a day. A thrown error is never cached, so the next request retries.
async function getRoutesPacked() {
  'use cache: remote'
  cacheLife('days')
  cacheTag('routes')

  const rows = await db
    .select({
      flightNumber: routes.flightNumber,
      departureIcao: routes.departureIcao,
      arrivalIcao: routes.arrivalIcao,
      flightTime: routes.flightTime,
      aircraft: routes.aircraft,
    })
    .from(routes);

  return rows
    .map((r) => {
      const [ h = "0", m = "0" ] = r.flightTime ? r.flightTime.split(":") : [];
      return [ r.flightNumber, r.departureIcao, r.arrivalIcao, h, m, r.aircraft ].join("\t");
    })
    .join("\n");
}

// The data-dependent subtree, streamed under Suspense so the page shell + skeleton
// flush immediately while the (cached) data resolves.
//
// Fleet is the single source of truth for the aircraft dropdown AND the rank filter
// (each entry carries { label, value, rank }). It's caught separately so a fleet-read
// failure still renders the routes list — the client falls back to an empty
// aircraft/rank filter rather than breaking the page.
async function RoutesData() {
  let packed = "";
  try {
    packed = await getRoutesPacked();
  } catch (error) {
    console.error("Error fetching routes:", error);
  }

  let fleet;
  try {
    fleet = await fetchFleetModule("fleet");
  } catch (error) {
    console.error("Error fetching fleet:", error);
    fleet = [];
  }

  return <RoutesClient packedRoutes={packed} fleet={Array.isArray(fleet) ? fleet : []} />;
}

function RoutesSkeleton() {
  return (
    <Stack gap={6}>
      <Skeleton height="44px" maxW="520px" borderRadius="md" />
      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={6}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} height="180px" borderRadius="lg" />
        ))}
      </Grid>
    </Stack>
  );
}

export default async function RoutesPage() {
  // Cached-read-only page: connection() keeps it request-time instead of executing
  // the cached read at build (which would demand a live DB on every deploy for
  // content the shell can't serve anyway).
  await connection();

  return (
    <Box p={{ base: 4, md: 4 }} flex="1">
      <Suspense fallback={<RoutesSkeleton />}>
        <RoutesData />
      </Suspense>
    </Box>
  );
}
