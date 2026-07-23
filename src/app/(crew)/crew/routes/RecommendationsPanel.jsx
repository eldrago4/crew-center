"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import NoPrefetchLink from "@/components/NoPrefetchLink";
import {
  Box,
  Button,
  HStack,
  VStack,
  Text,
  Badge,
  Wrap,
  WrapItem,
  Alert,
  Icon,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import {
  LuSparkles,
  LuPlane,
  LuTrendingUp,
  LuCompass,
  LuAward,
  LuClock,
  LuRefreshCw,
  LuChevronRight,
} from "react-icons/lu";
import styles from "./recommendations.module.css";
// Bundled with the lazy Lottie chunk below, so it's fetched once, gzipped, and
// cached immutably under /_next/static — no runtime fetch/parse per open.
import aigAnimation from "./aig-lottie.json";

// lottie-react touches `document`, so load it only in the browser and only when
// the loader actually mounts (keeps the ~250 KB player out of the initial page).
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

// Design tokens (DESIGN.md — "Aeronaut Intelligence").
const CRIMSON = "#be123c";
const TEAL = "#0d9488";

// SimBrief type codes so a recommendation deep-links straight into flight
// planning, same mapping the route cards use.
const AIRCRAFT_ICAO = {
  A318: "A318", A319: "A319", A320: "A320", A321: "A321", "A220-300": "BCS3",
  A332: "A332", A333: "A333", A339: "A339", A346: "A346", A359: "A359",
  A35K: "A35K", A388: "A388", "Boeing 737-700": "B737", "Boeing 737-800": "B738",
  "Boeing 737-900": "B739", "Boeing 737MAX": "B38M", "Boeing 747-400": "B744",
  "Boeing 747-8": "B748", "Boeing 757-200": "B752", "Boeing 767-300": "B763",
  "Boeing 767-300ER": "B763", "Boeing 777-200ER": "B772", "Boeing 777-200LR": "B77L",
  "Boeing 777-300ER": "B77W", "Boeing 777F": "B77L", "Boeing 787-8": "B788",
  "Boeing 787-9": "B789", "Boeing 787-10": "B78X", "Bombardier Dash 8-Q400": "DH8D",
  "CRJ-700": "CRJ7", "CRJ-900": "CRJ9", "CRJ-1000": "CRJX", "DC-10": "DC10",
  "DC-10F": "DC10", "ERJ-175": "E175", "ERJ-190": "E190", "MD-11": "MD11",
  "MD-11F": "MD11", C208: "C208", "TBM-930": "TBM9",
};

const MODES = [
  { value: "trend", label: "Trend", icon: LuTrendingUp, blurb: "Matches how you already fly" },
  { value: "discover", label: "Discover", icon: LuCompass, blurb: "Fresh destinations to broaden your map" },
  { value: "rank", label: "Rank", icon: LuAward, blurb: "Newly unlocked at your current rank" },
];

const LOADING_PHRASES = [
  "Spooling engines...",
  "Punching through clouds...",
  "Chasing tailwinds...",
  "Lining up...",
  "Floating...",
  "Finding FL690...",
  "Tiny turbulence...",
  "Blaming ATC...",
  "Somebody forgot the paperwork...",
  "Autopilot's got this...",
];

// "New Delhi, India (VIDP)" → { place: "New Delhi, India", city: "New Delhi", country: "India" }
function parseLoc(raw, fallbackIcao) {
  if (!raw) return { place: fallbackIcao, city: fallbackIcao, country: "" };
  const place = raw.replace(/\s*\([^)]*\)\s*$/, "").trim();
  const lastComma = place.lastIndexOf(",");
  if (lastComma === -1) return { place, city: place, country: "" };
  return { place, city: place.slice(0, lastComma).trim(), country: place.slice(lastComma + 1).trim() };
}

function simbriefLink(rec) {
  const first = (rec.unlockedAircraft?.[0] || rec.aircraft?.split(",")[0] || "").trim();
  const type = AIRCRAFT_ICAO[first] || first;
  return `/crew/plan/simbrief?orig=${rec.departureIcao}&dest=${rec.arrivalIcao}&type=${type}&fltnum=${encodeURIComponent(rec.flightNumber)}`;
}

// ---- Shared hook: owns request state so the trigger button and the results
// block (which live in different parts of the page) stay in sync. --------------
export function useFlightRecommender() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("trend");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const reqId = useRef(0);

  const run = useCallback(async (nextMode = "trend", fresh = false) => {
    const id = ++reqId.current;
    setOpen(true);
    setMode(nextMode);
    setLoading(true);
    setError(null);
    if (!fresh) setData(null);
    try {
      const res = await fetch(
        `/api/routes/recommendations?mode=${nextMode}${fresh ? "&fresh=1" : ""}`,
        { cache: "no-store" },
      );
      const body = await res.json().catch(() => ({}));
      if (id !== reqId.current) return; // a newer request superseded this one
      if (!res.ok) {
        setError(body.error || "Couldn't fetch recommendations. Please try again.");
        setData(null);
      } else {
        setData(body);
      }
    } catch {
      if (id !== reqId.current) return;
      setError("The recommendations service is unreachable right now.");
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, []);

  return { open, mode, setMode, loading, data, error, run };
}

// ---- The trigger button (goes in the actions row, beside Random Route) -------
export function RecommendationButton({ recommender, disabled }) {
  const { loading, run } = recommender;
  return (
    <Button
      className={styles.aigButton}
      onClick={() => run("trend")}
      loading={loading}
      loadingText="Thinking"
      disabled={disabled}
      borderRadius="full"
      fontWeight="700"
      px={5}
    >
      <HStack gap={2}>
        <Image src="/fonts/Aig.png" alt="AI.g" width={20} height={20} priority />
        <Text>Recommendations</Text>
      </HStack>
    </Button>
  );
}

// ---- Typewriter loader (AIG lottie + cycling phrases) ------------------------
function TypingLoader() {
  const [text, setText] = useState("");
  const phraseRef = useRef(0);

  // Type the current phrase, hold, erase, advance — looping while mounted.
  useEffect(() => {
    let alive = true;
    let timer;
    const TYPE_MS = 3000; // every phrase types out over ~3 seconds, whatever its length
    const type = (phrase, i) => {
      if (!alive) return;
      const step = Math.max(TYPE_MS / phrase.length, 16);
      if (i <= phrase.length) {
        setText(phrase.slice(0, i));
        timer = setTimeout(() => type(phrase, i + 1), step);
      } else {
        timer = setTimeout(() => erase(phrase, phrase.length), 650);
      }
    };
    const erase = (phrase, i) => {
      if (!alive) return;
      if (i >= 0) {
        setText(phrase.slice(0, i));
        timer = setTimeout(() => erase(phrase, i - 1), 18);
      } else {
        phraseRef.current = (phraseRef.current + 1) % LOADING_PHRASES.length;
        timer = setTimeout(() => type(LOADING_PHRASES[phraseRef.current], 0), 150);
      }
    };
    type(LOADING_PHRASES[phraseRef.current], 0);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  return (
    <Box
      className={styles.card}
      borderWidth="1px"
      borderColor={{ base: "gray.200", _dark: "whiteAlpha.200" }}
      bg={{ base: "white", _dark: "whiteAlpha.50" }}
      borderRadius="2xl"
      px={{ base: 4, md: 6 }}
      py={6}
    >
      <HStack gap={4} align="center">
        <Box w={{ base: "56px", md: "72px" }} h={{ base: "56px", md: "72px" }} flexShrink={0}>
          <Lottie animationData={aigAnimation} loop style={{ width: "100%", height: "100%" }} />
        </Box>
        <Box minW={0}>
          <Text
            fontFamily="mono"
            fontSize={{ base: "sm", md: "md" }}
            fontWeight="600"
            color={{ base: "gray.700", _dark: "gray.200" }}
          >
            {text}
            <span className={styles.caret}>&nbsp;</span>
          </Text>
          <Text mt={1} fontSize="2xs" fontFamily="mono" letterSpacing="0.1em" textTransform="uppercase" color="gray.500">
            AI.g is planning your next flights
          </Text>
        </Box>
      </HStack>
    </Box>
  );
}

// ---- Mode switcher (segmented pills) -----------------------------------------
function ModeTabs({ mode, loading, onPick }) {
  return (
    <Wrap gap={2}>
      {MODES.map((m) => {
        const active = m.value === mode;
        return (
          <WrapItem key={m.value}>
            <Button
              size="sm"
              borderRadius="full"
              variant={active ? "solid" : "outline"}
              onClick={() => onPick(m.value)}
              disabled={loading}
              bg={active ? CRIMSON : undefined}
              color={active ? "white" : undefined}
              borderColor={active ? CRIMSON : { base: "gray.300", _dark: "whiteAlpha.300" }}
              _hover={{ bg: active ? "#a50f33" : { base: "gray.100", _dark: "whiteAlpha.100" } }}
            >
              <Icon as={m.icon} mr={1} />
              {m.label}
            </Button>
          </WrapItem>
        );
      })}
    </Wrap>
  );
}

// ---- One recommendation (a full-width row inside the single results card) ----
function RecCard({ rec, isFirst }) {
  const from = parseLoc(rec.from, rec.departureIcao);
  const to = parseLoc(rec.to, rec.arrivalIcao);
  const aircraft = (rec.aircraft || "").split(",").map((a) => a.trim()).filter(Boolean);
  const unlocked = new Set((rec.unlockedAircraft || []).map((a) => a.trim()));
  const matchPct = Math.round((rec.score ?? 0) * 100);

  const dataLabel = {
    fontFamily: "mono",
    fontSize: "2xs",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "gray.500",
    fontWeight: "600",
  };

  return (
    <Box
      className={styles.card}
      borderTopWidth={isFirst ? "0" : "1px"}
      borderColor={{ base: "gray.200", _dark: "whiteAlpha.200" }}
      transition="background 0.2s ease"
      _hover={{ bg: { base: "rgba(190,18,61,0.02)", _dark: "whiteAlpha.50" } }}
    >
      <Grid templateColumns={{ base: "1fr", lg: "minmax(0,1.35fr) minmax(0,1fr)" }} gap={0}>
        {/* Zone 1 + 2: header + route */}
        <GridItem p={{ base: 4, md: 6 }}>
          {/* Header: flight ID + match */}
          <HStack justify="space-between" align="start" mb={5}>
            <HStack gap={2}>
              <Icon as={LuPlane} color={CRIMSON} />
              <Text fontFamily="mono" fontWeight="700" fontSize="lg" color={TEAL} letterSpacing="0.05em">
                {rec.flightNumber}
              </Text>
            </HStack>
            <VStack gap={0} align="end">
              <Text {...dataLabel}>Match</Text>
              <Text fontFamily="mono" fontWeight="700" fontSize="md" color={{ base: "gray.800", _dark: "gray.100" }}>
                {matchPct}%
              </Text>
            </VStack>
          </HStack>

          {/* Route: ICAO —✈— ICAO with cities beneath */}
          <HStack align="center" gap={3} mb={5}>
            <VStack gap={0} align="start" minW={0}>
              <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="800" lineHeight="1" letterSpacing="-0.01em">
                {rec.departureIcao}
              </Text>
              <Text fontSize="sm" color={{ base: "gray.600", _dark: "gray.400" }} truncate maxW="150px">
                {from.city}
              </Text>
              <Text {...dataLabel} mt={0.5}>{rec.depRegion}</Text>
            </VStack>

            <Box color={CRIMSON} className={styles.connector} />
            <Icon as={LuPlane} color={CRIMSON} boxSize={5} transform="rotate(90deg)" flexShrink={0} />
            <Box color={CRIMSON} className={styles.connector} />

            <VStack gap={0} align="end" minW={0}>
              <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="800" lineHeight="1" letterSpacing="-0.01em">
                {rec.arrivalIcao}
              </Text>
              <Text fontSize="sm" color={{ base: "gray.600", _dark: "gray.400" }} truncate maxW="150px" textAlign="right">
                {to.city}
              </Text>
              <Text {...dataLabel} mt={0.5}>{rec.arrRegion}</Text>
            </VStack>
          </HStack>

          {/* Meta row: duration + min rank */}
          <Wrap gap={5}>
            <WrapItem>
              <VStack gap={0} align="start">
                <Text {...dataLabel}>Duration</Text>
                <HStack gap={1}>
                  <Icon as={LuClock} boxSize={3.5} color="gray.500" />
                  <Text fontFamily="mono" fontWeight="600" fontSize="sm">{rec.duration}</Text>
                </HStack>
              </VStack>
            </WrapItem>
            <WrapItem>
              <VStack gap={0} align="start">
                <Text {...dataLabel}>Unlocks at</Text>
                <Text fontFamily="mono" fontWeight="600" fontSize="sm">{rec.minRank}</Text>
              </VStack>
            </WrapItem>
          </Wrap>

          {/* Aircraft chips — flyable ones highlighted teal, locked ones muted */}
          <Box mt={4}>
            <Text {...dataLabel} mb={2}>Fleet</Text>
            <Wrap gap={2}>
              {aircraft.map((ac) => {
                const canFly = unlocked.has(ac);
                return (
                  <WrapItem key={ac}>
                    <Badge
                      borderRadius="full"
                      px={3}
                      py={1}
                      fontFamily="mono"
                      fontSize="2xs"
                      letterSpacing="0.05em"
                      variant={canFly ? "solid" : "outline"}
                      bg={canFly ? "rgba(13,148,136,0.12)" : "transparent"}
                      color={canFly ? TEAL : "gray.500"}
                      borderWidth="1px"
                      borderColor={canFly ? "rgba(13,148,136,0.4)" : { base: "gray.200", _dark: "whiteAlpha.200" }}
                    >
                      {ac}
                    </Badge>
                  </WrapItem>
                );
              })}
            </Wrap>
          </Box>
        </GridItem>

        {/* Zone 3: AI insights + CTA */}
        <GridItem
          p={{ base: 4, md: 6 }}
          bg={{ base: "#f8f9ff", _dark: "whiteAlpha.50" }}
          borderTopWidth={{ base: "1px", lg: "0" }}
          borderLeftWidth={{ base: "0", lg: "1px" }}
          borderColor={{ base: "gray.200", _dark: "whiteAlpha.200" }}
        >
          <VStack align="stretch" gap={4} h="100%">
            <Box>
              <HStack gap={1.5} mb={2}>
                <Icon as={LuSparkles} color={CRIMSON} boxSize={3.5} />
                <Text {...dataLabel} color={CRIMSON}>Why this fits you</Text>
              </HStack>
              <Text fontSize="sm" lineHeight="1.6" color={{ base: "gray.700", _dark: "gray.300" }}>
                {rec.reason}
              </Text>
            </Box>
            {rec.highlights && (
              <Box>
                <Text {...dataLabel} mb={2}>Route highlights</Text>
                <Text fontSize="sm" lineHeight="1.6" color={{ base: "gray.600", _dark: "gray.400" }} fontStyle="italic">
                  {rec.highlights}
                </Text>
              </Box>
            )}
            <Box mt="auto">
              <NoPrefetchLink href={simbriefLink(rec)}>
                <Button
                  w="100%"
                  borderRadius="lg"
                  bg={CRIMSON}
                  color="white"
                  _hover={{ bg: "#a50f33" }}
                  fontWeight="700"
                >
                  Plan this flight
                  <Icon as={LuChevronRight} ml={1} />
                </Button>
              </NoPrefetchLink>
            </Box>
          </VStack>
        </GridItem>
      </Grid>
    </Box>
  );
}

// ---- The results block (goes below the actions row, spans the page width) ----
export function RecommendationResults({ recommender }) {
  const { open, mode, loading, data, error, run } = recommender;
  const activeMode = useMemo(() => MODES.find((m) => m.value === mode), [mode]);
  const recs = data?.recommendations || [];

  // Fake-streaming reveal: once the picks arrive, uncover them one route at a
  // time so it reads like the recommender is charting them live. Resets on every
  // new request (loading) and re-streams whenever a fresh `data` object lands.
  const [revealed, setRevealed] = useState(0);
  useEffect(() => {
    if (loading || recs.length === 0) {
      setRevealed(0);
      return;
    }
    setRevealed(1);
    const id = setInterval(() => {
      setRevealed((r) => {
        if (r >= recs.length) {
          clearInterval(id);
          return r;
        }
        return r + 1;
      });
    }, 600);
    return () => clearInterval(id);
  }, [loading, data, recs.length]);

  if (!open) return null;

  const summary = data?.profileSummary;
  const streaming = recs.length > 0 && revealed < recs.length;

  return (
    <VStack align="stretch" gap={4}>
      {/* Header row: title + mode tabs + refresh */}
      <HStack justify="space-between" align="center" wrap="wrap" gap={3}>
        <HStack gap={2}>
          <Image src="/fonts/Aig.png" alt="AI.g" width={22} height={22} />
          <Text fontWeight="800" fontSize="lg" letterSpacing="-0.01em">
            Recommended for you
          </Text>
        </HStack>
        <HStack gap={2} wrap="wrap">
          <ModeTabs mode={mode} loading={loading} onPick={(m) => run(m)} />
          {!loading && data && (
            <Button
              size="sm"
              variant="ghost"
              borderRadius="full"
              onClick={() => run(mode, true)}
              title="Get a fresh set"
            >
              <Icon as={LuRefreshCw} />
            </Button>
          )}
        </HStack>
      </HStack>

      {activeMode && (
        <Text fontSize="xs" fontFamily="mono" letterSpacing="0.06em" textTransform="uppercase" color="gray.500">
          {activeMode.blurb}
          {data?.rank ? ` · Rank ${data.rank}` : ""}
          {summary?.pirepCount != null ? ` · ${summary.pirepCount} PIREPs analysed` : ""}
          {data && !data.explained ? " · quick mode" : ""}
        </Text>
      )}

      {loading && <TypingLoader />}

      {!loading && error && (
        <Alert.Root status="error" borderRadius="xl">
          <Alert.Indicator />
          <Alert.Title>{error}</Alert.Title>
        </Alert.Root>
      )}

      {!loading && !error && recs.length === 0 && data && (
        <Alert.Root status="info" borderRadius="xl">
          <Alert.Indicator />
          <Alert.Title>
            No fresh picks for this mode yet — fly a few more routes and check back.
          </Alert.Title>
        </Alert.Root>
      )}

      {!loading && !error && recs.length > 0 && (
        <Box
          className={styles.card}
          borderWidth="1px"
          borderColor={{ base: "gray.200", _dark: "whiteAlpha.200" }}
          bg={{ base: "white", _dark: "gray.900" }}
          borderRadius="2xl"
          overflow="hidden"
          boxShadow="0 4px 20px rgba(190, 18, 61, 0.06)"
        >
          {recs.slice(0, revealed).map((rec, i) => (
            <RecCard key={rec.flightNumber} rec={rec} isFirst={i === 0} />
          ))}

          {/* Streaming footer — pulses while more routes are still being charted */}
          {streaming && (
            <HStack
              gap={3}
              px={{ base: 4, md: 6 }}
              py={3}
              borderTopWidth="1px"
              borderColor={{ base: "gray.200", _dark: "whiteAlpha.200" }}
              bg={{ base: "#f8f9ff", _dark: "whiteAlpha.50" }}
            >
              <Box className={styles.pulseDot} w="8px" h="8px" borderRadius="full" bg={CRIMSON} flexShrink={0} />
              <Text fontFamily="mono" fontSize="2xs" letterSpacing="0.1em" textTransform="uppercase" color="gray.500">
                Charting route {revealed + 1} of {recs.length}…
              </Text>
            </HStack>
          )}
        </Box>
      )}
    </VStack>
  );
}
