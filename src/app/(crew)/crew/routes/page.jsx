import { Box, Grid, Skeleton, Stack } from "@chakra-ui/react";
import { Suspense } from "react";
import { connection } from "next/server";
import { unstable_cache } from "next/cache";
import db from "@/db/client";
import { routes } from "@/db/schema";
import { fetchFleetModule } from "@/app/(crew)/crew/pireps/file/fleetModule";
import RoutesClient from "./RoutesClient";

// Routes are rendered SERVER-side (no browser-callable data endpoint), but packed
// into ONE tab/newline-delimited string that's cached daily. Passing a single
// string across the RSC boundary is far cheaper to serialize than ~2,294 nested
// objects — that per-object Flight encoding was this page's SSR CPU cost and the
// driver of its 1102s on a cold isolate. RoutesClient expands the string back
// into rows on the client, where CPU isn't limited. Per line, tab-separated:
// flightNumber, dep, arr, hours, minutes, aircraft. Staff edits bust it instantly
// via revalidateTag('routes') in the /api/routes mutations.
const getRoutesPacked = unstable_cache(
  async () => {
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
  },
  [ "crew-routes-packed" ],
  { revalidate: 86400, tags: [ "routes" ] },
);

// The data-dependent subtree, streamed under Suspense so the page shell + skeleton
// flush immediately while the (cached) data resolves. Fleet is small + cached and
// fetched alongside. The try/catch stays OUTSIDE the cached function so a transient
// error is never pinned in the cache for a day.
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
  // Keep this request-time (the crew layout no longer forces the group dynamic);
  // without it the cached read could run against the build-time DB.
  await connection();

  return (
    <Box p={{ base: 4, md: 4 }} flex="1">
      <Suspense fallback={<RoutesSkeleton />}>
        <RoutesData />
      </Suspense>
    </Box>
  );
}
