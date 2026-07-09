"use client";

import React, { useState, useEffect, useMemo } from "react";
import NextLink from "next/link";
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
} from "@chakra-ui/react";
import { FiSend } from "react-icons/fi";
import { Toaster, toaster } from "@/components/ui/toaster";

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
const aircraftList = [
  'A220-300',
  'A319',
  'A320',
  'A321',
  'A333',
  'A339',
  'A346',
  'A359',
  'A388',
  'Boeing 737-800',
  'Boeing 737-900',
  'Boeing 737MAX',
  'Boeing 747-400',
  'Boeing 747-8',
  'Boeing 757-200',
  'Boeing 767-300',
  'Boeing 777-200ER',
  'Boeing 777-200LR',
  'Boeing 777-300ER',
  'Boeing 777F',
  'Boeing 787-10',
  'Boeing 787-8',
  'Boeing 787-9',
  'Bombardier Dash 8-Q400',
  'CRJ-900',
  'ERJ-175',
  'ERJ-190',
  'MD-11'
];

const aircraftOptions = createListCollection({
  items: aircraftList.map(ac => ({ label: ac, value: ac })),
});

const rankHierarchy = [
  "Yuvraj", "Rajkumar", "Rajvanshi", "Rajdhiraj", "Maharaja", "Samrat", "Chhatrapati",
];

const rankOptions = createListCollection({
  items: rankHierarchy.map(rank => ({ label: rank.charAt(0).toUpperCase() + rank.slice(1), value: rank })),
});

// Maps route aircraft names → SimBrief ICAO type codes
const aircraftICAOCodes = {
  'A220-300': 'BCS3',
  'A319': 'A319',
  'A320': 'A320',
  'A321': 'A321',
  'A333': 'A333',
  'A339': 'A339',
  'A346': 'A346',
  'A359': 'A359',
  'A388': 'A388',
  'Boeing 737-800': 'B738',
  'Boeing 737-900': 'B739',
  'Boeing 737MAX': 'B38M',
  'Boeing 747-400': 'B744',
  'Boeing 747-8': 'B748',
  'Boeing 757-200': 'B752',
  'Boeing 767-300': 'B763',
  'Boeing 777-200ER': 'B772',
  'Boeing 777-200LR': 'B77L',
  'Boeing 777-300ER': 'B77W',
  'Boeing 777F': 'B77L',
  'Boeing 787-10': 'B78X',
  'Boeing 787-8': 'B788',
  'Boeing 787-9': 'B789',
  'Bombardier Dash 8-Q400': 'DH8D',
  'CRJ-900': 'CRJ9',
  'ERJ-175': 'E175',
  'ERJ-190': 'E190',
  'MD-11': 'MD11',
};

const rankAircraftMap = {
  Yuvraj: [ "A220-300", "A320", "Bombardier Dash 8-Q400", "ERJ-175", "ERJ-190", "CRJ-900" ],
  Rajkumar: [ "Boeing 737MAX", "Boeing 737-800", "Boeing 737-900", "A321" ],
  Rajvanshi: [ "Boeing 767-300", "Boeing 757-200", "A333", "A339", "Boeing 787-8" ],
  Rajdhiraj: [ "Boeing 787-9", "Boeing 787-10" ],
  Maharaja: [ "Boeing 777-200LR", "Boeing 777-200ER", "Boeing 777-300ER", "Boeing 747-400", "A346" ],
  Samrat: [ "A359", "Boeing 747-8" ],
  Chhatrapati: [ "A388" ],
};

const ITEMS_PER_PAGE = 15;

function formatTime(h, m) {
  return `${h}:${m.toString().padStart(2, "0")}`;
}

const EMPTY_ROUTE_REQUEST = { flightNumber: "", departureIcao: "", arrivalIcao: "", flightTime: "", aircraft: "" };

export default function RoutesClient({ initialRoutes, cacheVersion }) {
  const { data: session } = useSession();
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
  const [ randomRoute, setRandomRoute ] = useState(null);
  const [ loading, setLoading ] = useState(false);

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

  // Update data when initialRoutes changes
  useEffect(() => {
    setData(initialRoutes);
    setFiltered(initialRoutes);
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
        const allowedAircrafts = rankHierarchy
          .slice(0, selectedRankIndex + 1)
          .flatMap((rank) => rankAircraftMap[ rank ] || []);
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
  }, [ filters, data ]);

  const handleRandomRoute = () => {
    if (filtered.length > 0) {
      const random = filtered[ Math.floor(Math.random() * filtered.length) ];
      setRandomRoute(random);
    }
  };

  const paginatedData = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

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

      {/* Random Route + Request Route Buttons */}
      <HStack spacing={3} wrap="wrap">
        <Button onClick={handleRandomRoute} colorPalette="blue" variant="solid" borderRadius="full">
          🎲 Random Route
        </Button>
        <Button
          onClick={() => setRequestOpen(true)}
          variant="ghost"
          colorPalette="gray"
          borderRadius="full"
        >
          <FiSend /> Request Route
        </Button>
      </HStack>

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

      {/* Results Count */}
      <Box textAlign="center">
        <Text fontSize="sm" color="gray.500">
          Showing {(page - 1) * ITEMS_PER_PAGE + 1}-{(page - 1) * ITEMS_PER_PAGE + paginatedData.length} of {filtered.length} routes
        </Text>
      </Box>

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
          const firstAircraft = route.aircraft_names.split(',')[ 0 ]?.trim() || '';
          const aircraftIcao = aircraftICAOCodes[ firstAircraft ] || firstAircraft;
          const fplLink = `/crew/plan/simbrief?orig=${route.departure_icao}&dest=${route.arrival_icao}&type=${aircraftIcao}&fltnum=${encodeURIComponent(route.flight_number)}`;
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
                      as={NextLink}
                      href={`/crew/pireps/file?flightNumber=${encodeURIComponent(route.flight_number)}&departureIcao=${route.departure_icao}&arrivalIcao=${route.arrival_icao}&aircraft=${encodeURIComponent(route.aircraft_names.split(',')[ 0 ]?.trim() || '')}`}
                      size="sm"
                      colorPalette="blue"
                      variant="solid"
                      borderRadius="full"
                    >
                      File
                    </Button>
                    <Button
                      as={NextLink}
                      href={fplLink}
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
            onPageChange={(e) => setPage(e.page)}
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

      {/* Cache Info */}
      <Box textAlign="center" py={4}>
        <Text fontSize="sm" color="gray.500">
          Routes Version: {cacheVersion}
        </Text>
      </Box>
    </VStack>
  );
} 