import { connection } from "next/server";
import { unstable_cache } from "next/cache";
import db from "@/db/client";
import { routes } from "@/db/schema";
import { fetchFleetModule } from "@/app/(crew)/crew/pireps/file/fleetModule";
import CrewPage from "@/components/crew-runtime/CrewPage";

// Routes are read SERVER-side (no browser-callable data endpoint), but packed
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

// The Suspense boundary + Chakra skeleton this page used to stream are gone: the
// UI is now client-only (CrewPage → RoutesView), so the Worker would only have
// rendered the skeleton, and CrewPage's own placeholder already covers the wait.
// Both reads are cached, so awaiting them here costs a cache hit, not a query.
export default async function RoutesPage() {
  // Keep this request-time (the crew layout no longer forces the group dynamic);
  // without it the cached read could run against the build-time DB.
  await connection();

  // The try/catch stays OUTSIDE the cached function so a transient error is never
  // pinned in the cache for a day.
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

  return (
    <CrewPage
      id="routes"
      packedRoutes={packed}
      fleet={Array.isArray(fleet) ? fleet : []}
    />
  );
}
