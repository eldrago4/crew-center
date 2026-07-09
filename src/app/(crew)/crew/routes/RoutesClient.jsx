"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  IconButton
} from "@chakra-ui/react";

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
function FilterField({ label, width, flex, children }) {
  return (
    <Box width={width} flex={flex} minW={0}>
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

export default function RoutesClient({ initialRoutes, cacheVersion }) {
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
      {/* Filters */}
      <Box
        borderRadius="2xl"
        borderWidth="1px"
        borderColor={{ base: "gray.200", _dark: "whiteAlpha.200" }}
        bg={{ base: "white", _dark: "gray.900" }}
        boxShadow="sm"
        p={{ base: 4, md: 6 }}
      >
        <Flex wrap="wrap" gap={5} align="flex-end">
          <FilterField label="Flight Number" width={{ base: "full", sm: "150px" }}>
            <Input
              {...pillFieldProps}
              size="lg"
              placeholder="e.g. IN101"
              value={filters.flightNumber}
              onChange={(e) => setFilters({ ...filters, flightNumber: e.target.value })}
            />
          </FilterField>

          <FilterField label="Departure" width={{ base: "full", sm: "130px" }}>
            <Input
              {...pillFieldProps}
              size="lg"
              placeholder="ICAO"
              value={filters.departureIcao}
              onChange={(e) => setFilters({ ...filters, departureIcao: e.target.value })}
            />
          </FilterField>

          <FilterField label="Arrival" width={{ base: "full", sm: "130px" }}>
            <Input
              {...pillFieldProps}
              size="lg"
              placeholder="ICAO"
              value={filters.arrivalIcao}
              onChange={(e) => setFilters({ ...filters, arrivalIcao: e.target.value })}
            />
          </FilterField>

          <FilterField label="Aircraft" width={{ base: "full", sm: "230px" }}>
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
                <Select.Content borderRadius="xl" boxShadow="lg">
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

          <FilterField label="Rank" width={{ base: "full", sm: "180px" }}>
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
                <Select.Content borderRadius="xl" boxShadow="lg">
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

          <FilterField
            label="Flight Time"
            width={{ base: "full", md: "280px" }}
            flex={{ base: undefined, md: "1" }}
          >
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
        </Flex>
      </Box>

      {/* Random Route Button */}
      <Box>
        <Button onClick={handleRandomRoute} colorPalette="blue" variant="solid" borderRadius="full">
          🎲 Random Route
        </Button>
      </Box>

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
                      as="a"
                      href={`/crew/pireps/file?flightNumber=${encodeURIComponent(route.flight_number)}&departureIcao=${route.departure_icao}&arrivalIcao=${route.arrival_icao}&aircraft=${encodeURIComponent(route.aircraft_names.split(',')[ 0 ]?.trim() || '')}`}
                      size="sm"
                      colorPalette="blue"
                      variant="solid"
                      borderRadius="full"
                    >
                      File
                    </Button>
                    <Button
                      as="a"
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