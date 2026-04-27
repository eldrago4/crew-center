"use client";

import React, { useState, useEffect } from "react";
import {
  VStack,
  HStack,
  Input,
  Select,
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
  Stack,
  Heading,
  ButtonGroup,
  IconButton
} from "@chakra-ui/react";


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

const aircraftICAOCodes = aircraftList.reduce((acc, ac) => {
  acc[ ac ] = ac;
  return acc;
}, {});

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
  const [ filters, setFilters ] = useState({
    flightNumber: "",
    departureIcao: "",
    arrivalIcao: "",
    aircraft: "",
    minTime: "",
    maxTime: "",
    rank: "",
  });
  const [ page, setPage ] = useState(1);
  const [ randomRoute, setRandomRoute ] = useState(null);
  const [ loading, setLoading ] = useState(false);

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
      const minMinutes = (parseInt(filters.minTime) || 0) * 60;
      const maxMinutes = (parseInt(filters.maxTime) || Infinity) * 60;

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
      <Box>
        <VStack spacing={4} align="stretch">
          <HStack spacing={4} wrap="wrap">
            <Input
              placeholder="Flight Number"
              value={filters.flightNumber}
              onChange={(e) => setFilters({ ...filters, flightNumber: e.target.value })}
              size="md"
            />
            <Input
              placeholder="Departure ICAO"
              value={filters.departureIcao}
              onChange={(e) => setFilters({ ...filters, departureIcao: e.target.value })}
              size="md"
            />
            <Input
              placeholder="Arrival ICAO"
              value={filters.arrivalIcao}
              onChange={(e) => setFilters({ ...filters, arrivalIcao: e.target.value })}
              size="md"
            />
          </HStack>

          <HStack spacing={4} wrap="wrap">
            <Input
              placeholder="Min Time (hrs)"
              value={filters.minTime}
              onChange={(e) => setFilters({ ...filters, minTime: e.target.value.replace(/\D/g, "") })}
              size="md"
            />
            <Input
              placeholder="Max Time (hrs)"
              value={filters.maxTime}
              onChange={(e) => setFilters({ ...filters, maxTime: e.target.value.replace(/\D/g, "") })}
              size="md"
            />
          </HStack>

          <HStack spacing={4} wrap="wrap">
            <Select.Root
              collection={aircraftOptions}
              value={filters.aircraft ? [ filters.aircraft ] : []}
              onValueChange={({ value }) => setFilters({ ...filters, aircraft: value[ 0 ] || "" })}
              placeholder="Select Aircraft"
              size="md"
              colorPalette="blue"
            >
              <Select.HiddenSelect />
              <Select.Label>Select Aircraft</Select.Label>
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText placeholder="Select Aircraft" />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator />
                  <Select.ClearTrigger />
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

            <Select.Root
              collection={rankOptions}
              value={filters.rank ? [ filters.rank ] : []}
              onValueChange={({ value }) => setFilters({ ...filters, rank: value[ 0 ] || "" })}
              placeholder="Select Rank"
              size="md"
              colorPalette="blue"
            >
              <Select.HiddenSelect />
              <Select.Label>Select Rank</Select.Label>
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText placeholder="Select Rank" />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator />
                  <Select.ClearTrigger />
                </Select.IndicatorGroup>
              </Select.Control>
              <Select.Positioner>
                <Select.Content>
                  {rankOptions.items.map(option => (
                    <Select.Item item={option} key={option.value}>
                      {option.label}
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Select.Root>
          </HStack>
        </VStack>
      </Box>

      {/* Random Route Button */}
      <Box>
        <Button onClick={handleRandomRoute} colorPalette="blue" variant="solid">
          🎲 Random Route
        </Button>
      </Box>

      {/* Random Route Display */}
      {randomRoute && (
        <Card.Root variant="outline" colorPalette="green">
          <Card.Header pb={2}>
            <HStack justifyContent="space-between">
              <Text fontWeight="bold" fontSize="lg">
                #{randomRoute.flight_number}
              </Text>
              <Badge colorPalette="green" variant="solid">
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
          const aircraftIcao = aircraftICAOCodes[ route.aircraft_names ];
          const fileLink = `https://www.digitalcrew.app/INVA/pireps/?flight_number=${encodeURIComponent(route.flight_number)}&departure_icao=${route.departure_icao}&arrival_icao=${route.arrival_icao}`;
          const fplLink = `https://www.simbrief.com/system/dispatch.php?orig=${route.departure_icao}&dest=${route.arrival_icao}&type=${aircraftIcao}`;
          return (
            <Card.Root
              key={index}
              variant="outline"
              colorPalette="blue"
              width="100%"
              height="100%"
            >
              <Card.Header pb={2}>
                <HStack justifyContent="space-between">
                  <Text fontWeight="bold" fontSize="lg">
                    #{route.flight_number}
                  </Text>
                  <Badge colorPalette="blue" variant="solid">
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
                    >
                      File
                    </Button>
                    <Button
                      as="a"
                      href={fplLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="sm"
                      colorPalette="gray"
                      variant="solid"
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
                <IconButton>
                  &lt;
                </IconButton>
              </Pagination.PrevTrigger>
              <Pagination.Items
                render={(page) => (
                  <IconButton variant={{ base: "outline", _selected: "solid" }}>
                    {page.value}
                  </IconButton>
                )}
              />
              <Pagination.NextTrigger asChild>
                <IconButton>
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