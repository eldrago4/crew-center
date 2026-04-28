'use client';

import {
    Box, Button, Flex, Grid, GridItem, HStack, Heading, Icon, Input,
    Stack, Text, Textarea, Badge, Separator, Switch, Field,
} from '@chakra-ui/react';
import { useState } from 'react';
import {
    TbPlane, TbPlaneDeparture, TbPlaneArrival, TbArrowsExchange,
    TbRoute, TbCalendar, TbSettings, TbChevronDown,
    TbChevronUp, TbExternalLink, TbDroplet, TbUsers, TbPackage,
} from 'react-icons/tb';
import { toaster } from '@/components/ui/toaster';

// Indian Virtual airframe IDs in SimBrief (airline prefix : IF aircraft type)
const AIRFRAME_MAP = {
    'UK:A320': '783627_1771244115844',
    'AI:A320': '783627_1771244196756',
    'AI:A321': '783627_1771244227244',
    'AI:A359': '783627_1771244251002',
    'IX:B738': '783627_1771244311145',
    'IX:B38M': '783627_1771244319317',
    'AI:B788': '783627_1771244362874',
    'UK:B789': '783627_1771244387015',
    'AI:B77L': '783627_1771244498810',
    'AI:B77W': '783627_1771244614291',
    'AI:B744': '783627_1771244627288',
};

// Quick-select aircraft with label, ICAO type, preferred airline prefix
const QUICK_AIRCRAFT = [
    { label: 'A320', type: 'A320', prefix: 'AI', sub: 'Airbus A320' },
    { label: 'A321', type: 'A321', prefix: 'AI', sub: 'Airbus A321' },
    { label: 'A321XL', type: 'A21N', prefix: 'AI', sub: 'A321neo XLR' },
    { label: 'A350-900', type: 'A359', prefix: 'AI', sub: 'Airbus A350' },
    { label: 'B737-8', type: 'B38M', prefix: 'IX', sub: '737 MAX 8' },
    { label: 'B737-800', type: 'B738', prefix: 'IX', sub: 'Boeing 737-800' },
    { label: 'B787-8', type: 'B788', prefix: 'AI', sub: 'Dreamliner' },
    { label: 'B789', type: 'B789', prefix: 'UK', sub: 'B787-9' },
    { label: 'B777F', type: 'B77L', prefix: 'AI', sub: '777-200LR' },
    { label: 'B777-300', type: 'B77W', prefix: 'AI', sub: '777-300ER' },
    { label: 'B747-400', type: 'B744', prefix: 'AI', sub: '747-400' },
    { label: 'ATR 72', type: 'AT72', prefix: 'IX', sub: 'ATR 72-600' },
];

const RESERVE_RULES = [
    { value: '45', label: '45 min (domestic)' },
    { value: '30', label: '30 min (alternate)' },
    { value: 'etops138', label: 'ETOPS 138 min' },
    { value: 'etops207', label: 'ETOPS 207 min' },
];

const CONT_PCTS = [
    { value: '0', label: 'None (0%)' },
    { value: '0.05', label: '5% (standard)' },
    { value: '0.10', label: '10%' },
    { value: '0.15', label: '15%' },
];

function IcaoInput({ value, onChange, placeholder, icon: IcaoIcon, label }) {
    return (
        <Stack gap={1} flex={1}>
            <Text fontSize="xs" fontWeight="semibold" color="fg.muted" letterSpacing="wider" textTransform="uppercase">
                {label}
            </Text>
            <Box position="relative">
                <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="purple.400" zIndex={1} pointerEvents="none">
                    <Icon as={IcaoIcon} boxSize={4} />
                </Box>
                <Input
                    value={value}
                    onChange={e => onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
                    placeholder={placeholder}
                    pl={9}
                    fontSize="2xl"
                    fontWeight="bold"
                    fontFamily="mono"
                    letterSpacing="widest"
                    h="64px"
                    borderWidth="1px"
                    borderColor="whiteAlpha.200"
                    bg="whiteAlpha.50"
                    _dark={{ bg: 'blackAlpha.300', borderColor: 'whiteAlpha.100' }}
                    _focus={{ borderColor: 'purple.400', boxShadow: '0 0 0 1px var(--chakra-colors-purple-400)' }}
                    _placeholder={{ color: 'whiteAlpha.300', fontSize: 'xl', fontWeight: 'normal' }}
                />
            </Box>
        </Stack>
    );
}

function ToggleRow({ label, sublabel, checked, onChange }) {
    return (
        <Flex align="center" justify="space-between" py={2}>
            <Box>
                <Text fontSize="sm" fontWeight="medium">{label}</Text>
                {sublabel && <Text fontSize="xs" color="fg.muted">{sublabel}</Text>}
            </Box>
            <Switch.Root checked={checked} onCheckedChange={e => onChange(e.checked)} colorPalette="purple" size="sm">
                <Switch.HiddenInput />
                <Switch.Control>
                    <Switch.Thumb />
                </Switch.Control>
            </Switch.Root>
        </Flex>
    );
}

function SectionCard({ title, icon: SectionIcon, children, defaultOpen = true }) {
    const [ open, setOpen ] = useState(defaultOpen);
    return (
        <Box
            borderWidth="1px"
            borderColor="whiteAlpha.100"
            borderRadius="xl"
            bg="whiteAlpha.50"
            _dark={{ bg: 'blackAlpha.200' }}
            overflow="hidden"
        >
            <Flex
                align="center"
                justify="space-between"
                px={5}
                py={3}
                cursor="pointer"
                onClick={() => setOpen(o => !o)}
                _hover={{ bg: 'whiteAlpha.100' }}
                transition="background 0.15s"
            >
                <HStack gap={2}>
                    <Icon as={SectionIcon} color="purple.400" boxSize={4} />
                    <Text fontWeight="semibold" fontSize="sm" letterSpacing="wide" textTransform="uppercase" color="fg.muted">
                        {title}
                    </Text>
                </HStack>
                <Icon as={open ? TbChevronUp : TbChevronDown} color="fg.muted" boxSize={4} />
            </Flex>
            {open && (
                <Box px={5} pb={5} pt={1}>
                    {children}
                </Box>
            )}
        </Box>
    );
}

export default function SimbriefPlanner() {
    // Route
    const [ orig, setOrig ] = useState('');
    const [ dest, setDest ] = useState('');

    // Aircraft
    const [ acType, setAcType ] = useState('');
    const [ acPrefix, setAcPrefix ] = useState('AI');

    // Schedule
    const [ fltnum, setFltnum ] = useState('');
    const [ airline, setAirline ] = useState('INVA');
    const [ date, setDate ] = useState('');
    const [ deph, setDeph ] = useState('');
    const [ depm, setDepm ] = useState('');

    // Route / perf
    const [ route, setRoute ] = useState('');
    const [ fl, setFl ] = useState('');
    const [ ci, setCi ] = useState('');
    const [ pax, setPax ] = useState('');
    const [ cargo, setCargo ] = useState('');

    // Fuel policy
    const [ contpct, setContpct ] = useState('0.05');
    const [ resvrule, setResvrule ] = useState('45');

    // Toggles
    const [ navlog, setNavlog ] = useState(true);
    const [ etops, setEtops ] = useState(false);
    const [ stepclimbs, setStepclimbs ] = useState(true);
    const [ tlr, setTlr ] = useState(true);
    const [ notams, setNotams ] = useState(true);
    const [ maps, setMaps ] = useState(true);

    const [ loading, setLoading ] = useState(false);

    const swapAirports = () => {
        setOrig(dest);
        setDest(orig);
    };

    const selectAircraft = (ac) => {
        setAcType(ac.type);
        setAcPrefix(ac.prefix);
    };

    const getAirframeId = () => AIRFRAME_MAP[ `${acPrefix}:${acType}` ] || null;

    // Format date as DDMMMYY for SimBrief (e.g., 28APR26)
    const formatDate = (dateStr) => {
        if (!dateStr) return undefined;
        const d = new Date(dateStr);
        const months = [ 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC' ];
        return `${String(d.getUTCDate()).padStart(2, '0')}${months[ d.getUTCMonth() ]}${String(d.getUTCFullYear()).slice(-2)}`;
    };

    const handleGenerate = async () => {
        if (!orig || orig.length !== 4) { toaster.create({ title: 'Enter a valid 4-letter origin ICAO', type: 'error', duration: 3000 }); return; }
        if (!dest || dest.length !== 4) { toaster.create({ title: 'Enter a valid 4-letter destination ICAO', type: 'error', duration: 3000 }); return; }
        if (!acType) { toaster.create({ title: 'Select or enter an aircraft type', type: 'error', duration: 3000 }); return; }

        setLoading(true);
        try {
            const body = {
                orig, dest,
                type: acType,
                airframeId: getAirframeId(),
                airline,
                units: 'KGS',
                contpct,
                resvrule,
                navlog, etops, stepclimbs, tlr, notams, maps,
                ...(fltnum && { fltnum }),
                ...(route && { route }),
                ...(fl && { fl }),
                ...(ci && { ci: parseInt(ci) }),
                ...(pax && { pax: parseInt(pax) }),
                ...(cargo && { cargo: parseInt(cargo) }),
                ...(date && { date: formatDate(date) }),
                ...(deph && { deph: parseInt(deph) }),
                ...(depm && { depm: parseInt(depm) }),
            };

            const res = await fetch('/api/simbrief-dispatch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to generate dispatch');
            }

            const { simbriefUrl } = await res.json();
            window.open(simbriefUrl, '_blank', 'noopener,noreferrer');
        } catch (err) {
            toaster.create({ title: 'Dispatch Error', description: err.message, type: 'error', duration: 5000 });
        } finally {
            setLoading(false);
        }
    };

    const airframeId = getAirframeId();
    const routeReady = orig.length === 4 && dest.length === 4 && acType;

    return (
        <Box minH="100vh" px={{ base: 4, md: 8 }} py={8} maxW="1100px" mx="auto">
            {/* Header */}
            <Stack gap={1} mb={8}>
                <HStack gap={3}>
                    <Box
                        p={2}
                        borderRadius="lg"
                        bg="purple.500"
                        _dark={{ bg: 'purple.600' }}
                        shadow="0 0 20px rgba(168,85,247,0.4)"
                    >
                        <Icon as={TbPlaneDeparture} color="white" boxSize={6} />
                    </Box>
                    <Box>
                        <Heading size="xl" fontWeight="bold" letterSpacing="tight">SimBrief Dispatch</Heading>
                        <Text color="fg.muted" fontSize="sm">Generate professional OFPs for Indian Virtual operations</Text>
                    </Box>
                </HStack>
            </Stack>

            <Grid templateColumns={{ base: '1fr', lg: '1fr 320px' }} gap={6}>
                {/* LEFT COLUMN */}
                <Stack gap={5}>
                    {/* ROUTE */}
                    <SectionCard title="Route" icon={TbRoute}>
                        <Stack gap={4}>
                            <Flex gap={3} align="flex-end" wrap={{ base: 'wrap', sm: 'nowrap' }}>
                                <IcaoInput
                                    value={orig}
                                    onChange={setOrig}
                                    placeholder="VIDP"
                                    icon={TbPlaneDeparture}
                                    label="Origin"
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={swapAirports}
                                    mb={1}
                                    px={2}
                                    color="purple.400"
                                    _hover={{ bg: 'whiteAlpha.100', color: 'purple.300' }}
                                    flexShrink={0}
                                    h="64px"
                                >
                                    <Icon as={TbArrowsExchange} boxSize={5} />
                                </Button>
                                <IcaoInput
                                    value={dest}
                                    onChange={setDest}
                                    placeholder="VABB"
                                    icon={TbPlaneArrival}
                                    label="Destination"
                                />
                            </Flex>
                            <Field.Root>
                                <Field.Label fontSize="xs" color="fg.muted" textTransform="uppercase" letterSpacing="wider">Route String (optional)</Field.Label>
                                <Textarea
                                    value={route}
                                    onChange={e => setRoute(e.target.value.toUpperCase())}
                                    placeholder="DCT IGOLU DCT ESIRU... (leave blank for SimBrief auto-routing)"
                                    size="sm"
                                    fontFamily="mono"
                                    fontSize="xs"
                                    rows={3}
                                    borderColor="whiteAlpha.200"
                                    bg="whiteAlpha.50"
                                    _dark={{ bg: 'blackAlpha.300' }}
                                    _focus={{ borderColor: 'purple.400' }}
                                    resize="vertical"
                                />
                            </Field.Root>
                        </Stack>
                    </SectionCard>

                    {/* AIRCRAFT */}
                    <SectionCard title="Aircraft" icon={TbPlane}>
                        <Stack gap={4}>
                            <Box>
                                <Text fontSize="xs" fontWeight="semibold" color="fg.muted" letterSpacing="wider" textTransform="uppercase" mb={2}>Quick Select</Text>
                                <Grid templateColumns="repeat(auto-fill, minmax(100px, 1fr))" gap={2}>
                                    {QUICK_AIRCRAFT.map(ac => {
                                        const isSelected = acType === ac.type && acPrefix === ac.prefix;
                                        return (
                                            <Box
                                                key={`${ac.prefix}:${ac.type}`}
                                                onClick={() => selectAircraft(ac)}
                                                cursor="pointer"
                                                borderWidth="1px"
                                                borderRadius="lg"
                                                px={3}
                                                py={2}
                                                textAlign="center"
                                                transition="all 0.15s"
                                                borderColor={isSelected ? 'purple.400' : 'whiteAlpha.150'}
                                                bg={isSelected ? 'purple.500' : 'whiteAlpha.50'}
                                                _dark={{ bg: isSelected ? 'purple.700' : 'blackAlpha.200' }}
                                                _hover={{ borderColor: 'purple.400', bg: isSelected ? 'purple.500' : 'whiteAlpha.100' }}
                                                shadow={isSelected ? '0 0 12px rgba(168,85,247,0.3)' : 'none'}
                                            >
                                                <Text fontSize="sm" fontWeight="bold" fontFamily="mono" color={isSelected ? 'white' : 'fg'}>{ac.label}</Text>
                                                <Text fontSize="10px" color={isSelected ? 'whiteAlpha.800' : 'fg.muted'} mt="1px">{ac.sub}</Text>
                                            </Box>
                                        );
                                    })}
                                </Grid>
                            </Box>
                            <Separator />
                            <Grid templateColumns="1fr 1fr" gap={4}>
                                <Field.Root>
                                    <Field.Label fontSize="xs" color="fg.muted" textTransform="uppercase" letterSpacing="wider">ICAO Type</Field.Label>
                                    <Input
                                        value={acType}
                                        onChange={e => setAcType(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                                        placeholder="A320"
                                        fontFamily="mono"
                                        fontWeight="bold"
                                        borderColor="whiteAlpha.200"
                                        bg="whiteAlpha.50"
                                        _dark={{ bg: 'blackAlpha.300' }}
                                        _focus={{ borderColor: 'purple.400' }}
                                    />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label fontSize="xs" color="fg.muted" textTransform="uppercase" letterSpacing="wider">Airline Prefix</Field.Label>
                                    <Input
                                        value={acPrefix}
                                        onChange={e => setAcPrefix(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2))}
                                        placeholder="AI"
                                        fontFamily="mono"
                                        borderColor="whiteAlpha.200"
                                        bg="whiteAlpha.50"
                                        _dark={{ bg: 'blackAlpha.300' }}
                                        _focus={{ borderColor: 'purple.400' }}
                                    />
                                </Field.Root>
                            </Grid>
                            {airframeId && (
                                <HStack gap={2} px={3} py={2} bg="purple.900" borderRadius="md" borderWidth="1px" borderColor="purple.700">
                                    <Box w={2} h={2} borderRadius="full" bg="purple.400" />
                                    <Text fontSize="xs" color="purple.300" fontFamily="mono">
                                        Indian Virtual airframe profile matched
                                    </Text>
                                </HStack>
                            )}
                        </Stack>
                    </SectionCard>

                    {/* SCHEDULE */}
                    <SectionCard title="Schedule" icon={TbCalendar}>
                        <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} gap={4}>
                            <Field.Root>
                                <Field.Label fontSize="xs" color="fg.muted" textTransform="uppercase" letterSpacing="wider">Flight No.</Field.Label>
                                <Input
                                    value={fltnum}
                                    onChange={e => setFltnum(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                                    placeholder="AI101"
                                    fontFamily="mono"
                                    borderColor="whiteAlpha.200"
                                    bg="whiteAlpha.50"
                                    _dark={{ bg: 'blackAlpha.300' }}
                                    _focus={{ borderColor: 'purple.400' }}
                                />
                            </Field.Root>
                            <Field.Root>
                                <Field.Label fontSize="xs" color="fg.muted" textTransform="uppercase" letterSpacing="wider">Airline ICAO</Field.Label>
                                <Input
                                    value={airline}
                                    onChange={e => setAirline(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4))}
                                    fontFamily="mono"
                                    borderColor="whiteAlpha.200"
                                    bg="whiteAlpha.50"
                                    _dark={{ bg: 'blackAlpha.300' }}
                                    _focus={{ borderColor: 'purple.400' }}
                                />
                            </Field.Root>
                            <Field.Root>
                                <Field.Label fontSize="xs" color="fg.muted" textTransform="uppercase" letterSpacing="wider">Date</Field.Label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    borderColor="whiteAlpha.200"
                                    bg="whiteAlpha.50"
                                    _dark={{ bg: 'blackAlpha.300' }}
                                    _focus={{ borderColor: 'purple.400' }}
                                />
                            </Field.Root>
                            <Field.Root>
                                <Field.Label fontSize="xs" color="fg.muted" textTransform="uppercase" letterSpacing="wider">ETD (UTC)</Field.Label>
                                <HStack gap={2}>
                                    <Input
                                        value={deph}
                                        onChange={e => setDeph(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                                        placeholder="HH"
                                        fontFamily="mono"
                                        maxLength={2}
                                        borderColor="whiteAlpha.200"
                                        bg="whiteAlpha.50"
                                        _dark={{ bg: 'blackAlpha.300' }}
                                        _focus={{ borderColor: 'purple.400' }}
                                    />
                                    <Input
                                        value={depm}
                                        onChange={e => setDepm(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                                        placeholder="MM"
                                        fontFamily="mono"
                                        maxLength={2}
                                        borderColor="whiteAlpha.200"
                                        bg="whiteAlpha.50"
                                        _dark={{ bg: 'blackAlpha.300' }}
                                        _focus={{ borderColor: 'purple.400' }}
                                    />
                                </HStack>
                            </Field.Root>
                        </Grid>
                    </SectionCard>

                    {/* PERFORMANCE */}
                    <SectionCard title="Performance & Fuel" icon={TbDroplet} defaultOpen={false}>
                        <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)' }} gap={4}>
                            <Field.Root>
                                <Field.Label fontSize="xs" color="fg.muted" textTransform="uppercase" letterSpacing="wider">Cruise FL (optional)</Field.Label>
                                <Input
                                    value={fl}
                                    onChange={e => setFl(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                                    placeholder="Auto"
                                    fontFamily="mono"
                                    borderColor="whiteAlpha.200"
                                    bg="whiteAlpha.50"
                                    _dark={{ bg: 'blackAlpha.300' }}
                                    _focus={{ borderColor: 'purple.400' }}
                                />
                            </Field.Root>
                            <Field.Root>
                                <Field.Label fontSize="xs" color="fg.muted" textTransform="uppercase" letterSpacing="wider">Cost Index</Field.Label>
                                <Input
                                    value={ci}
                                    onChange={e => setCi(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                                    placeholder="Auto"
                                    fontFamily="mono"
                                    borderColor="whiteAlpha.200"
                                    bg="whiteAlpha.50"
                                    _dark={{ bg: 'blackAlpha.300' }}
                                    _focus={{ borderColor: 'purple.400' }}
                                />
                            </Field.Root>
                            <Field.Root>
                                <Field.Label fontSize="xs" color="fg.muted" textTransform="uppercase" letterSpacing="wider">Contingency Fuel</Field.Label>
                                <Flex gap={2} wrap="wrap">
                                    {CONT_PCTS.map(c => (
                                        <Button
                                            key={c.value}
                                            size="xs"
                                            variant={contpct === c.value ? 'solid' : 'outline'}
                                            colorPalette="purple"
                                            onClick={() => setContpct(c.value)}
                                            fontFamily="mono"
                                        >
                                            {c.label}
                                        </Button>
                                    ))}
                                </Flex>
                            </Field.Root>
                            <Field.Root>
                                <Field.Label fontSize="xs" color="fg.muted" textTransform="uppercase" letterSpacing="wider">Reserve Rule</Field.Label>
                                <Flex gap={2} wrap="wrap">
                                    {RESERVE_RULES.map(r => (
                                        <Button
                                            key={r.value}
                                            size="xs"
                                            variant={resvrule === r.value ? 'solid' : 'outline'}
                                            colorPalette="purple"
                                            onClick={() => setResvrule(r.value)}
                                            fontFamily="mono"
                                        >
                                            {r.label}
                                        </Button>
                                    ))}
                                </Flex>
                            </Field.Root>
                        </Grid>
                    </SectionCard>

                    {/* PAYLOAD */}
                    <SectionCard title="Payload (kg)" icon={TbPackage} defaultOpen={false}>
                        <Grid templateColumns="1fr 1fr" gap={4}>
                            <Field.Root>
                                <Field.Label fontSize="xs" color="fg.muted" textTransform="uppercase" letterSpacing="wider">
                                    <HStack gap={1}><Icon as={TbUsers} boxSize={3} /><Text>Passengers</Text></HStack>
                                </Field.Label>
                                <Input
                                    value={pax}
                                    onChange={e => setPax(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                                    placeholder="Auto"
                                    fontFamily="mono"
                                    borderColor="whiteAlpha.200"
                                    bg="whiteAlpha.50"
                                    _dark={{ bg: 'blackAlpha.300' }}
                                    _focus={{ borderColor: 'purple.400' }}
                                />
                            </Field.Root>
                            <Field.Root>
                                <Field.Label fontSize="xs" color="fg.muted" textTransform="uppercase" letterSpacing="wider">
                                    <HStack gap={1}><Icon as={TbPackage} boxSize={3} /><Text>Cargo (kg)</Text></HStack>
                                </Field.Label>
                                <Input
                                    value={cargo}
                                    onChange={e => setCargo(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                                    placeholder="Auto"
                                    fontFamily="mono"
                                    borderColor="whiteAlpha.200"
                                    bg="whiteAlpha.50"
                                    _dark={{ bg: 'blackAlpha.300' }}
                                    _focus={{ borderColor: 'purple.400' }}
                                />
                            </Field.Root>
                        </Grid>
                        <Text fontSize="xs" color="fg.muted" mt={3}>
                            Weights are always in <Badge size="xs" colorPalette="purple" variant="subtle">KGS</Badge>. Leave blank to use SimBrief defaults for the aircraft type.
                        </Text>
                    </SectionCard>
                </Stack>

                {/* RIGHT COLUMN */}
                <Stack gap={5}>
                    {/* GENERATE BUTTON */}
                    <Box
                        borderWidth="1px"
                        borderColor={routeReady ? 'purple.500' : 'whiteAlpha.100'}
                        borderRadius="xl"
                        p={5}
                        bg={routeReady ? 'purple.900' : 'whiteAlpha.50'}
                        _dark={{ bg: routeReady ? 'purple.950' : 'blackAlpha.200' }}
                        transition="all 0.2s"
                        shadow={routeReady ? '0 0 30px rgba(168,85,247,0.15)' : 'none'}
                    >
                        <Stack gap={4}>
                            {/* Summary */}
                            {routeReady ? (
                                <Stack gap={2}>
                                    <HStack justify="space-between">
                                        <Text fontSize="xs" color="fg.muted" textTransform="uppercase" letterSpacing="wider">Route</Text>
                                        <Text fontFamily="mono" fontWeight="bold" fontSize="sm">{orig} → {dest}</Text>
                                    </HStack>
                                    <HStack justify="space-between">
                                        <Text fontSize="xs" color="fg.muted" textTransform="uppercase" letterSpacing="wider">Aircraft</Text>
                                        <Text fontFamily="mono" fontWeight="bold" fontSize="sm">{acType}</Text>
                                    </HStack>
                                    {fltnum && (
                                        <HStack justify="space-between">
                                            <Text fontSize="xs" color="fg.muted" textTransform="uppercase" letterSpacing="wider">Flight</Text>
                                            <Text fontFamily="mono" fontSize="sm">{airline}{fltnum}</Text>
                                        </HStack>
                                    )}
                                    <Separator />
                                </Stack>
                            ) : (
                                <Text fontSize="sm" color="fg.muted" textAlign="center">
                                    Enter origin, destination and aircraft to dispatch
                                </Text>
                            )}
                            <Button
                                onClick={handleGenerate}
                                loading={loading}
                                loadingText="Generating..."
                                colorPalette="purple"
                                size="lg"
                                w="full"
                                disabled={!routeReady}
                                shadow={routeReady ? '0 0 20px rgba(168,85,247,0.3)' : 'none'}
                                _hover={{ shadow: '0 0 30px rgba(168,85,247,0.5)' }}
                            >
                                <Icon as={TbExternalLink} />
                                Open SimBrief
                            </Button>
                            <Text fontSize="10px" color="fg.subtle" textAlign="center">
                                Opens SimBrief in a new tab. Sign in with your SimBrief account to save the OFP.
                            </Text>
                        </Stack>
                    </Box>

                    {/* OUTPUT OPTIONS */}
                    <SectionCard title="Output Options" icon={TbSettings}>
                        <Stack gap={0} divideY="1px">
                            <ToggleRow label="Navigation Log" sublabel="Detailed waypoint table" checked={navlog} onChange={setNavlog} />
                            <ToggleRow label="Maps" sublabel="Route and weather maps" checked={maps} onChange={setMaps} />
                            <ToggleRow label="NOTAMs" sublabel="Active NOTAMs for route" checked={notams} onChange={setNotams} />
                            <ToggleRow label="Step Climbs" sublabel="Optimise cruise altitude steps" checked={stepclimbs} onChange={setStepclimbs} />
                            <ToggleRow label="Top of Descent" sublabel="TLR descent calculation" checked={tlr} onChange={setTlr} />
                            <ToggleRow label="ETOPS" sublabel="Extended range operations" checked={etops} onChange={setEtops} />
                        </Stack>
                    </SectionCard>

                    {/* INFO BOX */}
                    <Box
                        borderWidth="1px"
                        borderColor="whiteAlpha.100"
                        borderRadius="xl"
                        p={4}
                        bg="whiteAlpha.50"
                        _dark={{ bg: 'blackAlpha.200' }}
                    >
                        <Stack gap={2}>
                            <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase" letterSpacing="wider">Pre-configured</Text>
                            {[
                                { label: 'Operator', value: 'Indian Virtual Airline' },
                                { label: 'Units', value: 'Kilograms (KGS)' },
                                { label: 'Avoided FIRs', value: 'Pakistan, Syria, Israel' },
                            ].map(item => (
                                <Flex key={item.label} justify="space-between" align="center">
                                    <Text fontSize="xs" color="fg.muted">{item.label}</Text>
                                    <Text fontSize="xs" fontWeight="medium" fontFamily="mono">{item.value}</Text>
                                </Flex>
                            ))}
                        </Stack>
                    </Box>
                </Stack>
            </Grid>
        </Box>
    );
}
