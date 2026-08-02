"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import NoPrefetchLink from "@/components/NoPrefetchLink";
import { useSession } from "next-auth/react";
import {
  VStack,
  HStack,
  Flex,
  Input,
  Select,
  Slider,
  createListCollection,
  Button,
  Text,
  Box,
  Badge,
  Card,
  Grid,
  Pagination,
  Center,
  Spinner,
  Alert,
  ButtonGroup,
  IconButton,
  Dialog,
  Field,
  Portal,
  CloseButton,
  SegmentGroup,
} from "@chakra-ui/react";
import { FiSend, FiImage, FiList, FiClock } from "react-icons/fi";
import { Toaster, toaster } from "@/components/ui/toaster";
import {
  useFlightRecommender,
  RecommendationButton,
  RecommendationResults,
} from "./RecommendationsPanel";

const ACCENT = "#9e0b1f";

// Shared "pill" look for filter inputs/selects — rounded, soft background,
// accent-colored focus ring instead of Chakra's default palette ring.
// (size is set separately per element since Select sizes via Select.Root, not Select.Trigger)
const pillFieldProps = {
  borderRadius: "full",
  bg: { base: "gray.50", _dark: "whiteAlpha.50" },
  borderWidth: "1px",
  borderColor: { base: "gray.200", _dark: "whiteAlpha.200" },
  transition: "all 0.15s ease-in-out",
  _hover: { borderColor: { base: "gray.300", _dark: "whiteAlpha.300" } },
  _focusVisible: {
    borderColor: ACCENT,
    boxShadow: `0 0 0 1px ${ACCENT}`,
  },
};

// Small uppercase caption + control wrapper, sized independently so the
// filter row can hold pills of varying width instead of a uniform grid.
function FilterField({ label, children, ...rest }) {
  return (
    <Box minW={0} {...rest}>
      <Text
        fontSize="2xs"
        fontWeight="700"
        letterSpacing="0.06em"
        textTransform="uppercase"
        color={{ base: "gray.500", _dark: "gray.400" }}
        mb="1.5"
        pl="4"
      >
        {label}
      </Text>
      {children}
    </Box>
  );
}

// Native scrollbar styling for the Select dropdown listbox — without this,
// browsers render a plain white scrollbar track that clashes with dark mode.
const selectContentScrollbarProps = {
  css: {
    colorScheme: { base: "light", _dark: "dark" },
    "&::-webkit-scrollbar": { width: "8px" },
    "&::-webkit-scrollbar-track": { background: "transparent" },
    "&::-webkit-scrollbar-thumb": {
      background: { base: "#CBD5E0", _dark: "#4A5568" },
      borderRadius: "4px",
    },
    "&::-webkit-scrollbar-thumb:hover": {
      background: { base: "#A0AEC0", _dark: "#5A6577" },
    },
    scrollbarWidth: "thin",
    scrollbarColor: { base: "#A0AEC0 transparent", _dark: "#4A5568 transparent" },
  },
};

function onlyIcaoLetters(value) {
  return value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 4);
}

function onlyFlightNumberChars(value) {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8);
}

// Masks free typing into HH:MM as digits are entered (e.g. "345" -> "03:45")
function formatFlightTimeInput(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function isValidFlightTime(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return false;
  const hours = Number(match[ 1 ]);
  const minutes = Number(match[ 2 ]);
  return hours <= 23 && minutes <= 59;
}

function computeTimeBounds(routes) {
  if (!routes?.length) return { min: 0, max: 24 };
  let minH = Infinity;
  let maxH = 0;
  routes.forEach((r) => {
    const totalH = r.flight_time_hours + r.flight_time_minutes / 60;
    if (totalH < minH) minH = totalH;
    if (totalH > maxH) maxH = totalH;
  });
  const min = Math.floor(minH);
  const max = Math.max(Math.ceil(maxH), min + 1);
  return { min, max };
}


// Constants
const rankHierarchy = [
  "Yuvraj", "Rajkumar", "Rajvanshi", "Rajdhiraj", "Maharaja", "Samrat", "Chhatrapati",
];

const rankOptions = createListCollection({
  items: rankHierarchy.map(rank => ({ label: rank.charAt(0).toUpperCase() + rank.slice(1), value: rank })),
});

// Maps route aircraft names → SimBrief ICAO type codes for the FPL deep-link.
// SimBrief codes aren't stored in the DB fleet module, so this stays in-code;
// it covers every aircraft the fleet module can contain. Unknown names fall
// back to the raw aircraft string (see the FPL link builder below).
const aircraftICAOCodes = {
  'A318': 'A318',
  'A319': 'A319',
  'A320': 'A320',
  'A321': 'A321',
  'A220-300': 'BCS3',
  'A332': 'A332',
  'A333': 'A333',
  'A339': 'A339',
  'A346': 'A346',
  'A359': 'A359',
  'A35K': 'A35K',
  'A388': 'A388',
  'Boeing 737-700': 'B737',
  'Boeing 737-800': 'B738',
  'Boeing 737-900': 'B739',
  'Boeing 737MAX': 'B38M',
  'Boeing 747-400': 'B744',
  'Boeing 747-8': 'B748',
  'Boeing 757-200': 'B752',
  'Boeing 767-300': 'B763',
  'Boeing 767-300ER': 'B763',
  'Boeing 777-200ER': 'B772',
  'Boeing 777-200LR': 'B77L',
  'Boeing 777-300ER': 'B77W',
  'Boeing 777F': 'B77L',
  'Boeing 787-8': 'B788',
  'Boeing 787-9': 'B789',
  'Boeing 787-10': 'B78X',
  'Bombardier Dash 8-Q400': 'DH8D',
  'CRJ-700': 'CRJ7',
  'CRJ-900': 'CRJ9',
  'CRJ-1000': 'CRJX',
  'DC-10': 'DC10',
  'DC-10F': 'DC10',
  'ERJ-175': 'E175',
  'ERJ-190': 'E190',
  'MD-11': 'MD11',
  'MD-11F': 'MD11',
  'C208': 'C208',
  'TBM-930': 'TBM9',
};

const ITEMS_PER_PAGE = 15;

function formatTime(h, m) {
  return `${h}:${m.toString().padStart(2, "0")}`;
}

const EMPTY_ROUTE_REQUEST = { flightNumber: "", departureIcao: "", arrivalIcao: "", flightTime: "", aircraft: "" };

// ---------------------------------------------------------------------------
// View toggle
// ---------------------------------------------------------------------------

// "list" is the compact default (15 dense cards, no images, no network cost).
// "gallery" is the photo-backed cinematic view. The choice is a pure display
// preference, so it lives in localStorage rather than the session/DB.
const VIEW_LIST = "list";
const VIEW_GALLERY = "gallery";
const VIEW_STORAGE_KEY = "crew:routes:view";

function readStoredView() {
  try {
    return window.localStorage.getItem(VIEW_STORAGE_KEY) === VIEW_GALLERY ? VIEW_GALLERY : VIEW_LIST;
  } catch {
    // Private mode / blocked storage — fall back to the default view.
    return VIEW_LIST;
  }
}

// 33 rows in the routes table carry a routing note in the ICAO cell instead of a
// bare code — "EGLL VIA VABB", "ZSPD (VIA VIDP, VTBS)", "DIAP (VIA DGAA)" — plus
// stray leading/trailing spaces ("VIDP ", " EGLL") and one trailing backtick
// ("VOBL VIA VABB`"). In every one of them the airport this route actually flies
// is the FIRST standalone 4-letter token and everything after it is commentary
// about the routing, so that is what's taken; a code wrapped in punctuation
// ("DGAA)", "VIDP,") falls out of the same rule since \b treats those as breaks.
//
// Cleaning here rather than in the database keeps one definition feeding the
// display, the filters, the FILE/FPL deep links and the backdrop lookup — before
// this, a card for AIH47 asked Pexels for "EGLL VIA VABB" and deep-linked
// SimBrief to the same nonsense.
export function cleanIcao(value) {
  const upper = String(value || "").toUpperCase();
  const token = /\b[A-Z]{4}\b/.exec(upper);
  if (token) return token[ 0 ];
  // No clean token (e.g. a 3-letter fragment) — salvage what letters there are
  // so the route still renders instead of showing an empty code.
  return upper.replace(/[^A-Z]/g, "").slice(0, 4);
}

// Both views link to the same two destinations, so the hrefs are built once here
// instead of being duplicated per card layout.
function buildRouteLinks(route) {
  const firstAircraft = route.aircraft_names.split(",")[ 0 ]?.trim() || "";
  const aircraftIcao = aircraftICAOCodes[ firstAircraft ] || firstAircraft;
  return {
    firstAircraft,
    fileHref: `/crew/pireps/file?flightNumber=${encodeURIComponent(route.flight_number)}&departureIcao=${route.departure_icao}&arrivalIcao=${route.arrival_icao}&aircraft=${encodeURIComponent(firstAircraft)}`,
    fplHref: `/crew/plan/simbrief?orig=${route.departure_icao}&dest=${route.arrival_icao}&type=${aircraftIcao}&fltnum=${encodeURIComponent(route.flight_number)}`,
  };
}

// A route's aircraft column is a comma-separated list of every type cleared for
// it ("A333, A339, Boeing 777-300ER"). The gallery card has room for one, so it
// shows the largest — ordered here by MTOW, smallest first. Types missing from
// this list rank below everything (index -1) but are still shown if they're all
// a route has.
const AIRCRAFT_BY_SIZE = [
  "TBM-930", "C208", "Bombardier Dash 8-Q400",
  "CRJ-700", "ERJ-175", "CRJ-900", "CRJ-1000", "ERJ-190",
  "A318", "A220-300", "A319", "Boeing 737-700", "A320",
  "Boeing 737-800", "Boeing 737MAX", "Boeing 737-900", "A321",
  "Boeing 757-200", "Boeing 767-300", "Boeing 767-300ER",
  "Boeing 787-8", "A332", "A333", "A339",
  "Boeing 787-9", "Boeing 787-10",
  "DC-10", "DC-10F", "A359", "MD-11", "MD-11F",
  "Boeing 777-200ER", "A35K", "Boeing 777-200LR", "Boeing 777F", "Boeing 777-300ER",
  "A346", "Boeing 747-400", "Boeing 747-8", "A388",
];

const aircraftSizeRank = new Map(AIRCRAFT_BY_SIZE.map((name, i) => [ name, i ]));

function largestAircraft(names) {
  const list = String(names || "").split(",").map((n) => n.trim()).filter(Boolean);
  if (!list.length) return "";
  return list.reduce((biggest, name) => (
    (aircraftSizeRank.get(name) ?? -1) > (aircraftSizeRank.get(biggest) ?? -1) ? name : biggest
  ));
}

// Manufacturer prefixes are dead weight in a 10px mono label that has to sit
// between an icon and its balancing spacer — "Boeing 777-300ER" becomes
// "777-300ER", which is how pilots say it anyway. The unabbreviated list stays
// in the element's title.
function shortAircraftLabel(name) {
  return String(name || "").replace(/^(Boeing|Airbus|Bombardier)\s+/i, "");
}

// Every type cleared for the route, shortened. The card lists all of them — a
// route open to three airframes is information a pilot picking a flight wants —
// while the silhouette beside them shows the largest, since only one can be
// drawn.
function aircraftLabelList(names) {
  return String(names || "")
    .split(",")
    .map((name) => shortAircraftLabel(name.trim()))
    .filter(Boolean)
    .join(", ");
}

// Aircraft silhouettes (public/aircraft/*.webp). Six drawings have to stand in
// for the whole fleet, so routes are matched to the nearest airframe by family
// rather than exactly — at 60px what reads is the tube length, the engine count
// and the 747's hump, not the variant. Ordered: the first rule that matches
// wins, so the specific families (quads, A340/A35K) are tested before the
// general ones they'd otherwise fall into.
const AIRCRAFT_ICON_RULES = [
  [ /747|a380|a388/i, "b747-8" ],
  [ /a35k|a350-?1000|a34\d|a340/i, "a350-1000" ],
  [ /a350|a359|a33\d|a330/i, "a350-900" ],
  [ /787|777|767|md-?11|dc-?10/i, "b787-9" ],
  [ /737|757|crj|erj|e1\d\d|dash|q400|c208|tbm/i, "b737max8" ],
  [ /a31\d|a32\d|a220|bcs3/i, "a320neo" ],
];

function aircraftIconFor(name) {
  if (!name) return null;
  const rule = AIRCRAFT_ICON_RULES.find(([ pattern ]) => pattern.test(name));
  // Unmatched types render the text label alone rather than a wrong silhouette.
  return rule ? `/aircraft/${rule[ 1 ]}.webp` : null;
}

// The source art is purple-on-white with white window/door detail. grayscale +
// brightness lifts the body to a light grey and leaves that detail at full
// white, which keeps the airframe readable on the photo; a flat
// `brightness(0) invert(1)` would collapse the whole thing into one blob.
const AIRCRAFT_ICON_FILTER = "grayscale(1) brightness(3.4)";

// Scrim over the photo: near-opaque at the bottom where the route block and the
// buttons sit, clearing by two-thirds up so the image still reads as an image.
const SCRIM = "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.65) 38%, rgba(0,0,0,0.15) 70%, rgba(0,0,0,0.05) 100%)";

// Shown before the backdrop resolves, and permanently if there is no photo at
// all (PEXELS_API_KEY unset, an unmapped ICAO, or nothing on Pexels) — the card
// keeps its shape and legibility, just without the picture.
const BACKDROP_FALLBACK = "linear-gradient(145deg, #1a2233 0%, #2c1620 55%, #0d1119 100%)";

function GalleryRouteCard({ route, backdrop }) {
  const { fileHref, fplHref } = buildRouteLinks(route);
  // The silhouette can only show one airframe, so it shows the biggest; the
  // label lists every type the route is cleared for.
  const aircraftIcon = aircraftIconFor(largestAircraft(route.aircraft_names));
  const aircraftLabel = aircraftLabelList(route.aircraft_names);

  // The photo arrives after the card has already rendered on its gradient, so
  // it's faded in on load rather than popping in. Keyed on the URL below so a
  // changed backdrop starts from transparent again.
  const selectedBackdrop = useMemo(() => {
    const photos = Array.isArray(backdrop?.photos)
      ? backdrop.photos.filter((photo) => photo?.url)
      : (backdrop?.url ? [ backdrop ] : []);

    if (photos.length <= 1) return photos[ 0 ] || null;
    return photos[ Math.floor(Math.random() * photos.length) ];
  }, [ backdrop ]);
  const [ photoLoaded, setPhotoLoaded ] = useState(false);

  useEffect(() => {
    setPhotoLoaded(false);
  }, [ selectedBackdrop?.url ]);

  return (
    <Box
      // Chakra v3's _groupHover compiles to `.group:hover &`, so the class (not
      // role="group") is what arms the backdrop's hover zoom below.
      className="group"
      position="relative"
      height={{ base: "260px", sm: "280px", xl: "320px" }}
      borderRadius="2xl"
      overflow="hidden"
      boxShadow="lg"
      // Pexels' avg_color for this photo, painted the moment the URL arrives and
      // before a byte of the image has downloaded. The photo then fades in over
      // a background that already matches it, so the card settles instead of
      // flashing from a stock gradient to something unrelated.
      bg={selectedBackdrop?.color || undefined}
      bgImage={selectedBackdrop?.color ? undefined : BACKDROP_FALLBACK}
      transition="background-color 0.3s ease-out"
    >
      {/* Backdrop: a photo of the arrival city. A plain <img> rather than
          next/image because Pexels already serves it at the size we asked for
          (see lib/pexels.js) — the optimizer would add a transform per photo for
          an identical result. It fades in so a slow photo doesn't pop. */}
      {selectedBackdrop?.url && (
        <Box
          key={selectedBackdrop.url}
          as="img"
          src={selectedBackdrop.url}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          onLoad={() => setPhotoLoaded(true)}
          position="absolute"
          inset="0"
          width="100%"
          height="100%"
          objectFit="cover"
          opacity={photoLoaded ? 1 : 0}
          transition="opacity 0.4s ease-out, transform 0.7s ease"
          _groupHover={{ transform: "scale(1.05)" }}
        />
      )}
      <Box position="absolute" inset="0" bgImage={SCRIM} />

      <Flex
        position="relative"
        zIndex={1}
        height="100%"
        direction="column"
        justify="space-between"
        p={{ base: 4, xl: 5 }}
      >
        <Text
          fontWeight="bold"
          fontSize={{ base: "xl", xl: "2xl" }}
          lineHeight="1"
          letterSpacing="tight"
          color="white"
          textShadow="0 2px 8px rgba(0,0,0,0.9)"
        >
          #{route.flight_number}
        </Text>

        <Box mt="auto">
          {/* Origin → destination, with the leg drawn between them */}
          <HStack justify="space-between" align="flex-end" mb={{ base: 3, xl: 4 }}>
            <VStack align="flex-start" gap="1" minW={0}>
              <Text fontSize="2xs" fontWeight="700" letterSpacing="0.08em" color="whiteAlpha.700">
                ORIGIN
              </Text>
              <Text
                fontFamily="mono"
                fontSize={{ base: "2xl", xl: "3xl" }}
                fontWeight="600"
                lineHeight="1"
                color="white"
                textShadow="0 2px 6px rgba(0,0,0,0.8)"
              >
                {route.departure_icao}
              </Text>
            </VStack>

            {/* Hand-drawn arc from origin to destination. The row is
                align="flex-end", so this bottoms out on the ICAO baseline and is
                then lifted to arch over the top of both codes. */}
            <Flex
              flex="1"
              minW="28px"
              mx={{ base: 1.5, xl: 2.5 }}
              justify="center"
              align="flex-end"
              aria-hidden="true"
            >
              <Box
                as="img"
                src="/arrw.webp"
                alt=""
                loading="lazy"
                decoding="async"
                width="100%"
                maxW={{ base: "76px", xl: "96px" }}
                height="auto"
                opacity={0.9}
                transform={{ base: "translateY(-16px)", xl: "translateY(-20px)" }}
                filter="drop-shadow(0 1px 3px rgba(0,0,0,0.75))"
              />
            </Flex>

            <VStack align="flex-end" gap="1" minW={0}>
              <Text fontSize="2xs" fontWeight="700" letterSpacing="0.08em" color="whiteAlpha.700">
                DEST
              </Text>
              <Text
                fontFamily="mono"
                fontSize={{ base: "2xl", xl: "3xl" }}
                fontWeight="600"
                lineHeight="1"
                color="white"
                textShadow="0 2px 6px rgba(0,0,0,0.8)"
              >
                {route.arrival_icao}
              </Text>
            </VStack>
          </HStack>

          {/* Block time above, then the silhouette of the route's lead aircraft
              beside its name — the reference layout's compact info stack. */}
          <VStack gap="1" mb={{ base: 3, xl: 4 }} color="whiteAlpha.900">
            <HStack gap="1" textShadow="0 1px 4px rgba(0,0,0,0.8)">
              <Box as={FiClock} boxSize="12px" />
              <Text fontFamily="mono" fontSize="xs">
                {formatTime(route.flight_time_hours, route.flight_time_minutes)}
              </Text>
            </HStack>
            {/* The silhouette sits left of the type, but the TYPE is what has to
                line up with the time above it — so the icon is balanced by an
                invisible box of the same width on the right. Keeping the spacer
                in flow (rather than positioning the icon absolutely) means a
                long type name shortens instead of spilling past the card edge. */}
            <HStack gap="2" minW={0} maxW="100%">
              {aircraftIcon && (
                <Box
                  as="img"
                  src={aircraftIcon}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  width={{ base: "44px", xl: "56px" }}
                  height="auto"
                  flexShrink={0}
                  filter={AIRCRAFT_ICON_FILTER}
                  opacity={0.95}
                  // Centring it against the label leaves it sitting low — the
                  // drawing's mass is its fuselage, well under the tall tail, so
                  // the optical centre is above the geometric one. Lifted to
                  // match the first line of type.
                  transform="translateY(-4px)"
                />
              )}
              <Text
                fontFamily="mono"
                fontSize="2xs"
                fontWeight="600"
                letterSpacing="0.06em"
                textTransform="uppercase"
                textShadow="0 1px 4px rgba(0,0,0,0.8)"
                textAlign="center"
                // Two lines, because three types don't fit on one in a 3-up
                // column. Anything longer still truncates rather than pushing
                // the buttons off the card — the full list is in the title.
                lineClamp={2}
                title={route.aircraft_names}
              >
                {aircraftLabel || "—"}
              </Text>
              {aircraftIcon && (
                <Box
                  width={{ base: "44px", xl: "56px" }}
                  flexShrink={0}
                  aria-hidden="true"
                />
              )}
            </HStack>
          </VStack>

          <HStack gap={{ base: 2, xl: 3 }}>
            <Button
              as={NoPrefetchLink}
              href={fileHref}
              flex="1"
              size="sm"
              variant="outline"
              borderRadius="lg"
              borderStyle="dashed"
              borderColor="whiteAlpha.400"
              bg="whiteAlpha.200"
              color="white"
              fontWeight="bold"
              letterSpacing="0.06em"
              _hover={{ bg: "whiteAlpha.300" }}
            >
              FILE
            </Button>
            <Button
              as={NoPrefetchLink}
              href={fplHref}
              flex="1"
              size="sm"
              variant="outline"
              borderRadius="lg"
              borderStyle="dashed"
              borderColor="whiteAlpha.400"
              bg="whiteAlpha.200"
              color="white"
              fontWeight="bold"
              letterSpacing="0.06em"
              _hover={{ bg: "whiteAlpha.300" }}
            >
              FPL
            </Button>
          </HStack>
        </Box>
      </Flex>
    </Box>
  );
}

export default function RoutesClient({ packedRoutes = "", fleet = [] }) {
  const { data: session } = useSession();

  // Routes arrive server-side as ONE tab/newline-delimited string (cheap to
  // serialize across the RSC boundary vs ~2,294 objects). Expand it back into row
  // objects here on the client, where CPU isn't limited. Line fields:
  // flightNumber \t dep \t arr \t hours \t minutes \t aircraft.
  const initialRoutes = useMemo(() => {
    if (!packedRoutes) return [];
    return packedRoutes.split("\n").filter(Boolean).map((line) => {
      const [ fn, dep, arr, h, m, ac ] = line.split("\t");
      return {
        flight_number: fn,
        departure_icao: cleanIcao(dep),
        arrival_icao: cleanIcao(arr),
        flight_time_hours: Number(h) || 0,
        flight_time_minutes: Number(m) || 0,
        aircraft_names: ac || "",
      };
    });
  }, [ packedRoutes ]);

  // Aircraft dropdown options come straight from the DB fleet module ({ label,
  // value, rank }). Empty fleet (fetch failure) just yields an empty select.
  const aircraftOptions = useMemo(
    () => createListCollection({
      items: fleet.map(f => ({ label: f.label, value: f.value })),
    }),
    [ fleet ],
  );

  // rank gating: aircraft value → its rank's index in the hierarchy. The rank
  // filter shows a route if any of its aircraft unlocks at or below the picked
  // rank. Aircraft with a missing/unknown rank map to index 0 (Yuvraj) so they
  // are never hidden by the filter.
  const aircraftRankIndex = useMemo(() => {
    const map = new Map();
    for (const f of fleet) {
      const idx = rankHierarchy.indexOf(f.rank);
      map.set(f.value, idx === -1 ? 0 : idx);
    }
    return map;
  }, [ fleet ]);

  const [ data, setData ] = useState(initialRoutes);
  const [ filtered, setFiltered ] = useState(initialRoutes);
  const [ filters, setFilters ] = useState(() => ({
    flightNumber: "",
    departureIcao: "",
    arrivalIcao: "",
    aircraft: "",
    timeRange: [ computeTimeBounds(initialRoutes).min, computeTimeBounds(initialRoutes).max ],
    rank: "",
  }));
  const [ page, setPage ] = useState(1);

  // Paging swaps 15 cards out from under the reader, who is usually at the
  // BOTTOM of the list when they hit next — so without this they land mid-way
  // through the new page and have to scroll back up to find its start.
  //
  // Deliberately only wired to the pagination control, not to setPage generally:
  // the filters also reset to page 1, and yanking the view down to the results
  // while someone is still typing in a filter box would be worse than doing
  // nothing at all.
  const resultsRef = useRef(null);

  const goToPage = (nextPage) => {
    setPage(nextPage);
    const prefersReducedMotion = typeof window !== "undefined"
      && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    resultsRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  };
  const [ randomRoute, setRandomRoute ] = useState(null);
  const [ loading, setLoading ] = useState(false);

  // AI flight recommendations (calls the Cloudflare recommender via /api proxy).
  const recommender = useFlightRecommender();

  // Always render the default view on the server and on the first client paint,
  // then adopt the stored preference in an effect — reading localStorage during
  // render would mismatch the server HTML and blow up hydration.
  const [ view, setView ] = useState(VIEW_LIST);

  useEffect(() => {
    setView(readStoredView());
  }, []);

  const handleViewChange = (nextView) => {
    if (nextView !== VIEW_LIST && nextView !== VIEW_GALLERY) return;
    setView(nextView);
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, nextView);
    } catch {
      // Storage unavailable — the toggle still works for this session.
    }
  };

  const [ isRequestOpen, setRequestOpen ] = useState(false);
  const [ requestForm, setRequestForm ] = useState(EMPTY_ROUTE_REQUEST);
  const [ submittingRequest, setSubmittingRequest ] = useState(false);

  const isRequestValid = Boolean(
    requestForm.flightNumber &&
    requestForm.departureIcao.length === 4 &&
    requestForm.arrivalIcao.length === 4 &&
    isValidFlightTime(requestForm.flightTime) &&
    requestForm.aircraft
  );

  const handleSubmitRequest = async () => {
    if (!isRequestValid || submittingRequest) return;
    setSubmittingRequest(true);
    try {
      const res = await fetch("/api/routes/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...requestForm,
          ifcName: session?.user?.ifcName,
          callsign: session?.user?.callsign,
          discordId: session?.user?.discordId,
        }),
      });
      const responseData = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(responseData.error || "Failed to submit request");

      toaster.create({ title: "Route request sent", description: "Staff will review it shortly.", type: "success" });
      setRequestForm(EMPTY_ROUTE_REQUEST);
      setRequestOpen(false);
    } catch (err) {
      toaster.create({ title: "Couldn't send request", description: err.message, type: "error" });
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Absolute min/max hours across the current dataset — bounds for the slider
  const timeBounds = useMemo(() => computeTimeBounds(data), [ data ]);

  // A handful of unlabeled tick marks along the track ("steps")
  const timeMarks = useMemo(() => {
    const { min, max } = timeBounds;
    const step = Math.max(1, Math.round((max - min) / 6));
    const marks = [];
    for (let v = min; v < max; v += step) marks.push(v);
    marks.push(max);
    return marks;
  }, [ timeBounds ]);

  // Keep local state in sync if the (expanded) server data changes.
  useEffect(() => {
    setData(initialRoutes);
    setFiltered(initialRoutes);
    const bounds = computeTimeBounds(initialRoutes);
    setFilters((f) => ({ ...f, timeRange: [ bounds.min, bounds.max ] }));
  }, [ initialRoutes ]);

  // Filter data when filters change
  useEffect(() => {
    const sorted = [ ...data ].sort((a, b) => {
      const t1 = a.flight_time_hours * 60 + a.flight_time_minutes;
      const t2 = b.flight_time_hours * 60 + b.flight_time_minutes;
      return t1 - t2;
    });

    const result = sorted.filter((route) => {
      const totalMinutes = route.flight_time_hours * 60 + route.flight_time_minutes;
      const minMinutes = filters.timeRange[ 0 ] * 60;
      const maxMinutes = filters.timeRange[ 1 ] * 60;

      const aircraftFilter = filters.aircraft === "" ||
        route.aircraft_names.toLowerCase().includes(filters.aircraft.toLowerCase());

      let rankAllowed = true;
      if (filters.rank) {
        const selectedRankIndex = rankHierarchy.indexOf(filters.rank);
        const allowedAircrafts = fleet
          .filter((f) => (aircraftRankIndex.get(f.value) ?? 0) <= selectedRankIndex)
          .map((f) => f.value);
        rankAllowed = allowedAircrafts.some((ac) =>
          route.aircraft_names.toLowerCase().includes(ac.toLowerCase())
        );
      }

      return (
        route.flight_number?.toLowerCase().includes(filters.flightNumber.toLowerCase()) &&
        route.departure_icao.includes(filters.departureIcao.toUpperCase()) &&
        route.arrival_icao.includes(filters.arrivalIcao.toUpperCase()) &&
        aircraftFilter &&
        rankAllowed &&
        totalMinutes >= minMinutes &&
        totalMinutes <= maxMinutes
      );
    });

    setFiltered(result);
    setPage(1);
  }, [ filters, data, fleet, aircraftRankIndex ]);

  const handleRandomRoute = () => {
    if (filtered.length > 0) {
      const random = filtered[ Math.floor(Math.random() * filtered.length) ];
      setRandomRoute(random);
    }
  };

  // Memoised so the backdrop effect below keys off a stable array rather than
  // re-running on every unrelated render.
  const paginatedData = useMemo(
    () => filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
    [ filtered, page ]
  );
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  // Arrival-airport photos for the gallery view, fetched a page at a time.
  // Nothing is requested until the pilot actually switches to the gallery, and
  // each airport is asked for once per session — the server caches them per
  // ICAO for days on top of that, so this is usually a cache read.
  const [ backdrops, setBackdrops ] = useState({});
  const requestedPhotoCounts = useRef({});

  // Which end of the route the photo shows. Normally the destination — that's
  // the place you're flying to. But filtering by arrival ICAO pins every card on
  // the page to the same airport, and fifteen copies of one photo is a wall, so
  // in that case the card shows where each flight departs from instead. Keyed off
  // the data rather than the filter state so it also covers a departure filter
  // that happens to leave one destination.
  const backdropEnd = useMemo(() => {
    const arrivals = new Set(paginatedData.map((r) => r.arrival_icao));
    const departures = new Set(paginatedData.map((r) => r.departure_icao));
    return arrivals.size === 1 && departures.size > 1 ? "departure_icao" : "arrival_icao";
  }, [ paginatedData ]);

  const pageBackdropIcaos = useMemo(
    () => paginatedData.map((r) => r[ backdropEnd ]).filter(Boolean),
    [ paginatedData, backdropEnd ]
  );
  const pageIcaoKey = pageBackdropIcaos.join(",");

  const airportRouteCounts = useMemo(() => {
    const counts = {};
    for (const route of filtered) {
      const icao = route[ backdropEnd ];
      if (icao) counts[ icao ] = Math.min(6, (counts[ icao ] || 0) + 1);
    }
    return counts;
  }, [ filtered, backdropEnd ]);

  useEffect(() => {
    if (view !== VIEW_GALLERY) return;

    const previousCounts = {};
    const requestIcaos = [];
    [ ...new Set(pageBackdropIcaos) ].forEach((icao) => {
      const count = airportRouteCounts[ icao ] || 1;
      const previous = requestedPhotoCounts.current[ icao ] || 0;
      if (previous >= count) return;
      previousCounts[ icao ] = previous;
      requestedPhotoCounts.current[ icao ] = count;
      for (let i = 0; i < count; i += 1) requestIcaos.push(icao);
    });

    if (!requestIcaos.length) return;

    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/routes/backdrops?icaos=${requestIcaos.join(",")}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Backdrop request failed (${res.status})`);
        const { backdrops: resolved } = await res.json();
        setBackdrops((prev) => ({ ...prev, ...resolved }));
      } catch (err) {
        if (err.name === "AbortError") return;
        // Restore the previous requested depth so revisiting the page retries;
        // the cards just keep the gradient or smaller cached set in the meantime.
        Object.entries(previousCounts).forEach(([ icao, count ]) => {
          if (count) requestedPhotoCounts.current[ icao ] = count;
          else delete requestedPhotoCounts.current[ icao ];
        });
        console.error("Error fetching route backdrops:", err);
      }
    })();

    return () => controller.abort();
    // pageIcaoKey is the value identity of pageBackdropIcaos; airportRouteCounts
    // carries the requested photo depth for visible airports.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ view, pageIcaoKey, airportRouteCounts ]);

  return (
    <VStack spacing={6} align="stretch">
      <Toaster />
      {/* Filters */}
      <Box
        borderRadius="2xl"
        borderWidth="1px"
        borderColor={{ base: "gray.200", _dark: "whiteAlpha.200" }}
        bg={{ base: "white", _dark: "gray.900" }}
        boxShadow="sm"
        p={{ base: 4, md: 6 }}
      >
        <VStack align="stretch" spacing={5}>
          {/* Row 1 — text/select filters, flex-wrap so they reflow at any width */}
          <Flex wrap="wrap" gap={4}>
            <FilterField label="Flight Number" flex="1 1 130px" minW="110px" maxW={{ base: "full", sm: "200px" }}>
              <Input
                {...pillFieldProps}
                size="lg"
                placeholder="e.g. IN101"
                value={filters.flightNumber}
                onChange={(e) => setFilters({ ...filters, flightNumber: e.target.value.toUpperCase() })}
              />
            </FilterField>

            <FilterField label="Departure" flex="1 1 100px" minW="90px" maxW={{ base: "full", sm: "150px" }}>
              <Input
                {...pillFieldProps}
                size="lg"
                placeholder="ICAO"
                maxLength={4}
                value={filters.departureIcao}
                onChange={(e) => setFilters({ ...filters, departureIcao: onlyIcaoLetters(e.target.value) })}
              />
            </FilterField>

            <FilterField label="Arrival" flex="1 1 100px" minW="90px" maxW={{ base: "full", sm: "150px" }}>
              <Input
                {...pillFieldProps}
                size="lg"
                placeholder="ICAO"
                maxLength={4}
                value={filters.arrivalIcao}
                onChange={(e) => setFilters({ ...filters, arrivalIcao: onlyIcaoLetters(e.target.value) })}
              />
            </FilterField>

            <FilterField label="Aircraft" flex="2 1 190px" minW="170px" maxW={{ base: "full", sm: "260px" }}>
              <Select.Root
                collection={aircraftOptions}
                value={filters.aircraft ? [ filters.aircraft ] : []}
                onValueChange={({ value }) => setFilters({ ...filters, aircraft: value[ 0 ] || "" })}
                size="lg"
                colorPalette="blue"
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger {...pillFieldProps} px="5">
                    <Select.ValueText placeholder="Any aircraft" />
                  </Select.Trigger>
                  <Select.IndicatorGroup pr="4">
                    <Select.Indicator />
                    <Select.ClearTrigger />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Select.Positioner>
                  <Select.Content borderRadius="xl" boxShadow="lg" {...selectContentScrollbarProps}>
                    {aircraftOptions.items.map(option => (
                      <Select.Item item={option} key={option.value}>
                        {option.label}
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Select.Root>
            </FilterField>

            <FilterField label="Rank" flex="1 1 150px" minW="130px" maxW={{ base: "full", sm: "220px" }}>
              <Select.Root
                collection={rankOptions}
                value={filters.rank ? [ filters.rank ] : []}
                onValueChange={({ value }) => setFilters({ ...filters, rank: value[ 0 ] || "" })}
                size="lg"
                colorPalette="blue"
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger {...pillFieldProps} px="5">
                    <Select.ValueText placeholder="Any rank" />
                  </Select.Trigger>
                  <Select.IndicatorGroup pr="4">
                    <Select.Indicator />
                    <Select.ClearTrigger />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Select.Positioner>
                  <Select.Content borderRadius="xl" boxShadow="lg" {...selectContentScrollbarProps}>
                    {rankOptions.items.map(option => (
                      <Select.Item item={option} key={option.value}>
                        {option.label}
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Select.Root>
            </FilterField>
          </Flex>

          {/* Row 2 — flight time always on its own row, full width, with room to breathe */}
          <FilterField label="Flight Time" width="full">
            <Box
              {...pillFieldProps}
              borderRadius="2xl"
              px="5"
              py="2.5"
              _focusVisible={undefined}
              _hover={undefined}
            >
              <HStack justify="space-between" mb="1">
                <Text fontSize="xs" fontWeight="600" color={{ base: "gray.700", _dark: "gray.200" }}>
                  {filters.timeRange[ 0 ]}h – {filters.timeRange[ 1 ]}h
                </Text>
              </HStack>
              <Slider.Root
                value={filters.timeRange}
                onValueChange={({ value }) => setFilters({ ...filters, timeRange: value })}
                min={timeBounds.min}
                max={timeBounds.max}
                step={1}
                minStepsBetweenThumbs={1}
              >
                <Slider.Control>
                  <Slider.Track bg={{ base: "gray.200", _dark: "whiteAlpha.200" }}>
                    <Slider.Range bg={ACCENT} />
                  </Slider.Track>
                  <Slider.Thumbs
                    borderColor={ACCENT}
                    bg="white"
                    borderWidth="2px"
                    boxShadow="sm"
                  />
                </Slider.Control>
                <Slider.Marks
                  marks={timeMarks}
                  color={{ base: "gray.400", _dark: "gray.500" }}
                />
              </Slider.Root>
            </Box>
          </FilterField>
        </VStack>
      </Box>

      {/* Random Route + Recommendations + Request Route Buttons */}
      <HStack spacing={3} wrap="wrap">
        <Button onClick={handleRandomRoute} colorPalette="blue" variant="solid" borderRadius="full">
          🎲 Random Route
        </Button>
        <RecommendationButton recommender={recommender} disabled={!session?.user?.callsign} />
        <Button
          onClick={() => setRequestOpen(true)}
          variant="ghost"
          colorPalette="gray"
          borderRadius="full"
        >
          <FiSend /> Request Route
        </Button>
      </HStack>

      {/* AI recommendation results (loader → data-centric cards) */}
      <RecommendationResults recommender={recommender} />

      {/* Request Route Dialog */}
      <Dialog.Root open={isRequestOpen} onOpenChange={(e) => setRequestOpen(e.open)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content borderRadius="2xl">
              <Dialog.Header>
                <Dialog.Title>Request a Route</Dialog.Title>
                <Dialog.CloseTrigger asChild position="absolute" top="4" right="4">
                  <CloseButton size="sm" />
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body>
                <VStack align="stretch" spacing={4}>
                  <Text fontSize="xs" color={{ base: "gray.500", _dark: "gray.500" }}>
                    Only request flight numbers that aren&apos;t already in the system — don&apos;t submit a duplicate
                    route (same operator, same city pair) under a different flight number. Aircraft updates for
                    existing routes should be requested in the Discord channel instead.
                  </Text>
                  <Field.Root required>
                    <Field.Label>Flight Number <Field.RequiredIndicator /></Field.Label>
                    <Input
                      {...pillFieldProps}
                      borderRadius="lg"
                      placeholder="e.g. IN101"
                      value={requestForm.flightNumber}
                      onChange={(e) => setRequestForm({ ...requestForm, flightNumber: onlyFlightNumberChars(e.target.value) })}
                    />
                  </Field.Root>

                  <HStack spacing={4} align="flex-start">
                    <Field.Root required flex={1}>
                      <Field.Label>Departure ICAO <Field.RequiredIndicator /></Field.Label>
                      <Input
                        {...pillFieldProps}
                        borderRadius="lg"
                        placeholder="ICAO"
                        maxLength={4}
                        value={requestForm.departureIcao}
                        onChange={(e) => setRequestForm({ ...requestForm, departureIcao: onlyIcaoLetters(e.target.value) })}
                      />
                    </Field.Root>
                    <Field.Root required flex={1}>
                      <Field.Label>Arrival ICAO <Field.RequiredIndicator /></Field.Label>
                      <Input
                        {...pillFieldProps}
                        borderRadius="lg"
                        placeholder="ICAO"
                        maxLength={4}
                        value={requestForm.arrivalIcao}
                        onChange={(e) => setRequestForm({ ...requestForm, arrivalIcao: onlyIcaoLetters(e.target.value) })}
                      />
                    </Field.Root>
                  </HStack>

                  <HStack spacing={4} align="flex-start">
                    <Field.Root
                      required
                      flex={1}
                      invalid={requestForm.flightTime.length > 0 && !isValidFlightTime(requestForm.flightTime)}
                    >
                      <Field.Label>Flight Time (HH:MM) <Field.RequiredIndicator /></Field.Label>
                      <Input
                        {...pillFieldProps}
                        borderRadius="lg"
                        placeholder="HH:MM"
                        maxLength={5}
                        value={requestForm.flightTime}
                        onChange={(e) => setRequestForm({ ...requestForm, flightTime: formatFlightTimeInput(e.target.value) })}
                      />
                      {requestForm.flightTime.length > 0 && !isValidFlightTime(requestForm.flightTime) && (
                        <Field.ErrorText>Must be a valid 24h time, e.g. 03:45</Field.ErrorText>
                      )}
                    </Field.Root>

                    <Field.Root required flex={1}>
                      <Field.Label>Aircraft <Field.RequiredIndicator /></Field.Label>
                      <Select.Root
                        collection={aircraftOptions}
                        value={requestForm.aircraft ? [ requestForm.aircraft ] : []}
                        onValueChange={({ value }) => setRequestForm({ ...requestForm, aircraft: value[ 0 ] || "" })}
                        size="md"
                      >
                        <Select.HiddenSelect />
                        <Select.Control>
                          <Select.Trigger>
                            <Select.ValueText placeholder="Select aircraft" />
                          </Select.Trigger>
                          <Select.IndicatorGroup>
                            <Select.Indicator />
                          </Select.IndicatorGroup>
                        </Select.Control>
                        <Select.Positioner>
                          <Select.Content>
                            {aircraftOptions.items.map(option => (
                              <Select.Item item={option} key={option.value}>
                                {option.label}
                                <Select.ItemIndicator />
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Positioner>
                      </Select.Root>
                    </Field.Root>
                  </HStack>
                </VStack>
              </Dialog.Body>
              <Dialog.Footer>
                <ButtonGroup>
                  <Dialog.CloseTrigger asChild>
                    <Button variant="ghost">Cancel</Button>
                  </Dialog.CloseTrigger>
                  <Button
                    colorPalette="blue"
                    onClick={handleSubmitRequest}
                    loading={submittingRequest}
                    disabled={!isRequestValid}
                  >
                    Submit Request
                  </Button>
                </ButtonGroup>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* Random Route Display */}
      {randomRoute && (
        <Card.Root variant="outline" colorPalette="green" borderRadius="2xl">
          <Card.Header pb={2}>
            <HStack justifyContent="space-between">
              <Text fontWeight="bold" fontSize="lg">
                #{randomRoute.flight_number}
              </Text>
              <Badge colorPalette="green" variant="solid" borderRadius="full" px="3">
                {formatTime(randomRoute.flight_time_hours, randomRoute.flight_time_minutes)}
              </Badge>
            </HStack>
          </Card.Header>
          <Card.Body pt={0}>
            <VStack spacing={3} align="stretch">
              <HStack justifyContent="space-between">
                <Text fontSize="sm" color="gray.500">From:</Text>
                <Text fontWeight="medium">{randomRoute.departure_icao}</Text>
              </HStack>
              <HStack justifyContent="space-between">
                <Text fontSize="sm" color="gray.500">To:</Text>
                <Text fontWeight="medium">{randomRoute.arrival_icao}</Text>
              </HStack>
              <HStack justifyContent="space-between">
                <Text fontSize="sm" color="gray.500">Aircraft:</Text>
                <Text fontWeight="medium">{randomRoute.aircraft_names}</Text>
              </HStack>
            </VStack>
          </Card.Body>
        </Card.Root>
      )}

      {/* Results Count + View Toggle */}
      <Flex
        ref={resultsRef}
        // The nav is position:fixed, so a plain scrollIntoView would park this
        // underneath it. scroll-margin-top is what scrollIntoView honours —
        // matching the shell's own top padding (60px desktop / 8.5em mobile,
        // where the mobile sidebar sits under the nav) plus a little air.
        scrollMarginTop={{ base: "9.5em", md: "76px" }}
        align="center"
        justify="space-between"
        gap={3}
      >
        {/* Empty flex peer so the count stays optically centred against the toggle */}
        <Box flex="1" minW={0} display={{ base: "none", sm: "block" }} />
        <Text fontSize="sm" color="gray.500" textAlign="center">
          Showing {(page - 1) * ITEMS_PER_PAGE + 1}-{(page - 1) * ITEMS_PER_PAGE + paginatedData.length} of {filtered.length} routes
        </Text>
        <Flex flex="1" minW={0} justify="flex-end">
          <SegmentGroup.Root
            value={view}
            onValueChange={({ value }) => handleViewChange(value)}
            size="sm"
            borderRadius="full"
            p="1"
            bg={{ base: "gray.50", _dark: "whiteAlpha.50" }}
            borderWidth="1px"
            borderColor={{ base: "gray.200", _dark: "whiteAlpha.200" }}
          >
            <SegmentGroup.Indicator
              borderRadius="full"
              bg={{ base: "white", _dark: "whiteAlpha.200" }}
              boxShadow="sm"
            />
            <SegmentGroup.Item
              value={VIEW_GALLERY}
              px="3"
              borderRadius="full"
              cursor="pointer"
              title="Gallery view"
              aria-label="Gallery view"
            >
              <SegmentGroup.ItemText display="inline-flex" alignItems="center">
                <FiImage size={16} />
              </SegmentGroup.ItemText>
              <SegmentGroup.ItemHiddenInput />
            </SegmentGroup.Item>
            <SegmentGroup.Item
              value={VIEW_LIST}
              px="3"
              borderRadius="full"
              cursor="pointer"
              title="Compact view"
              aria-label="Compact view"
            >
              <SegmentGroup.ItemText display="inline-flex" alignItems="center">
                <FiList size={13} />
              </SegmentGroup.ItemText>
              <SegmentGroup.ItemHiddenInput />
            </SegmentGroup.Item>
          </SegmentGroup.Root>
        </Flex>
      </Flex>

      {/* Alert for no results (Chakra v3) */}
      {filtered.length === 0 && (
        <Alert.Root status="info" colorPalette="blue">
          <Alert.Indicator />
          <Alert.Title>No routes found for the selected filters.</Alert.Title>
        </Alert.Root>
      )}

      {/* Route Cards */}
      <Grid
        templateColumns={{ base: "repeat(1, 1fr)", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
        gap={6}
      >
        {paginatedData.map((route, index) => {
          if (view === VIEW_GALLERY) {
            return (
              <GalleryRouteCard
                key={index}
                route={route}
                backdrop={backdrops[ route[ backdropEnd ] ] || null}
              />
            );
          }

          const { fileHref, fplHref } = buildRouteLinks(route);
          return (
            <Card.Root
              key={index}
              variant="outline"
              colorPalette="blue"
              width="100%"
              height="100%"
              borderRadius="2xl"
            >
              <Card.Header pb={2}>
                <HStack justifyContent="space-between">
                  <Text fontWeight="bold" fontSize="lg">
                    #{route.flight_number}
                  </Text>
                  <Badge colorPalette="blue" variant="solid" borderRadius="full" px="3">
                    {formatTime(route.flight_time_hours, route.flight_time_minutes)}
                  </Badge>
                </HStack>
              </Card.Header>
              <Card.Body pt={0}>
                <VStack spacing={3} align="stretch">
                  <HStack justifyContent="space-between">
                    <Text fontSize="sm" color="gray.500">From:</Text>
                    <Text fontWeight="medium">{route.departure_icao}</Text>
                  </HStack>
                  <HStack justifyContent="space-between">
                    <Text fontSize="sm" color="gray.500">To:</Text>
                    <Text fontWeight="medium">{route.arrival_icao}</Text>
                  </HStack>
                  <HStack justifyContent="space-between">
                    <Text fontSize="sm" color="gray.500">Aircraft:</Text>
                    <Text fontWeight="medium">{route.aircraft_names}</Text>
                  </HStack>
                  <HStack spacing={2} pt={2}>
                    <Button
                      as={NoPrefetchLink}
                      href={fileHref}
                      size="sm"
                      colorPalette="blue"
                      variant="solid"
                      borderRadius="full"
                    >
                      File
                    </Button>
                    <Button
                      as={NoPrefetchLink}
                      href={fplHref}
                      size="sm"
                      colorPalette="purple"
                      variant="outline"
                      borderRadius="full"
                    >
                      FPL
                    </Button>
                  </HStack>
                </VStack>
              </Card.Body>
            </Card.Root>
          );
        })}
      </Grid>

      {/* Pagination */}
      {totalPages > 1 && (
        <Center>
          <Pagination.Root
            count={totalPages}
            pageSize={1}
            page={page}
            onPageChange={(e) => goToPage(e.page)}
          >
            <ButtonGroup variant="outline" size="sm">
              <Pagination.PrevTrigger asChild>
                <IconButton borderRadius="full">
                  &lt;
                </IconButton>
              </Pagination.PrevTrigger>
              <Pagination.Items
                render={(page) => (
                  <IconButton borderRadius="full" variant={{ base: "outline", _selected: "solid" }}>
                    {page.value}
                  </IconButton>
                )}
              />
              <Pagination.NextTrigger asChild>
                <IconButton borderRadius="full">
                  &gt;
                </IconButton>
              </Pagination.NextTrigger>
            </ButtonGroup>
          </Pagination.Root>
        </Center>
      )}

      {/* Total routes in the network */}
      <Box textAlign="center" py={4}>
        <Text fontSize="sm" color="gray.500">
          {data.length} routes in the network
        </Text>
      </Box>
    </VStack>
  );
}
