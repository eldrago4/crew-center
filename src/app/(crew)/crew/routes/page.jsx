import { Box } from "@chakra-ui/react";
import { connection } from "next/server";
import { unstable_cache } from "next/cache";
import db from "@/db/client";
import { routes } from "@/db/schema";
import { count } from "drizzle-orm";
import { fetchFleetModule } from "@/app/(crew)/crew/pireps/file/fleetModule";
import RoutesClient from "./RoutesClient";

// The ~2,294-row routes table is NOT server-rendered here anymore: serialising
// every row into the SSR/RSC payload on each request was this page's dominant
// per-request CPU/memory cost on Workers and the main driver of 1102
// ("exceeded resources") errors. RoutesClient now fetches the list from the
// edge-cached /api/routes on mount instead, so the worker render stays light.
// We keep only the tiny cached count here for the "Routes Version" display.
//
// connection() keeps this request-time instead of prerendering at build (the
// crew layout no longer calls auth() to force the group dynamic). The try/catch
// lives OUTSIDE the cached function so a transient error is never pinned for a day.

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

  let cacheVersion;
  try {
    cacheVersion = await getRoutesCount();
  } catch (error) {
    console.error("Error fetching routes count:", error);
    cacheVersion = "";
  }

  // Fleet is the single source of truth for the aircraft dropdown AND the rank
  // filter (each entry carries { label, value, rank }). It's small and cached, so
  // it stays server-rendered — the filters are ready on first paint. A fleet-read
  // failure just yields empty filter options rather than breaking the page.
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
          initialRoutes={[]}
          cacheVersion={cacheVersion}
          fleet={Array.isArray(fleet) ? fleet : []}
        />
      </Box>
    </>
  )
}