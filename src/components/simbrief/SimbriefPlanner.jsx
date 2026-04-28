'use client';

import {
    Box, Button, Flex, Grid, HStack, Heading, Icon, Input,
    Stack, Text, Textarea, Badge, Separator, Switch, Field, Checkbox,
    Spinner, Center, Select, Portal, createListCollection,
} from '@chakra-ui/react';
import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    TbPlane, TbPlaneDeparture, TbPlaneArrival, TbArrowsExchange,
    TbRoute, TbCalendar, TbSettings, TbChevronDown,
    TbChevronUp, TbDroplet, TbUsers, TbPackage,
    TbSend, TbFileText, TbAlertTriangle, TbCheck,
} from 'react-icons/tb';
import { toaster } from '@/components/ui/toaster';

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

const QUICK_AIRCRAFT = [
    { label: 'A320', type: 'A320', prefix: 'AI', sub: 'Airbus A320' },
    { label: 'A321', type: 'A321', prefix: 'AI', sub: 'Airbus A321' },
    { label: 'A321neo', type: 'A21N', prefix: 'AI', sub: 'A321XLR' },
    { label: 'A350-900', type: 'A359', prefix: 'AI', sub: 'Airbus A350' },
    { label: 'B737 MAX', type: 'B38M', prefix: 'IX', sub: '737 MAX 8' },
    { label: 'B737-800', type: 'B738', prefix: 'IX', sub: 'Boeing 737NG' },
    { label: 'B787-8', type: 'B788', prefix: 'AI', sub: 'Dreamliner' },
    { label: 'B787-9', type: 'B789', prefix: 'UK', sub: 'Dreamliner' },
    { label: 'B777F', type: 'B77L', prefix: 'AI', sub: '777-200LR' },
    { label: 'B777-300', type: 'B77W', prefix: 'AI', sub: '777-300ER' },
    { label: 'B747-400', type: 'B744', prefix: 'AI', sub: '747-400' },
    { label: 'ATR 72', type: 'AT72', prefix: 'IX', sub: 'ATR 72-600' },
];

const RESERVE_RULES = [
    { value: '45', label: '45 min' },
    { value: '30', label: '30 min' },
    { value: 'etops138', label: 'ETOPS 138' },
    { value: 'etops207', label: 'ETOPS 207' },
];

// Comprehensive SimBrief ICAO aircraft type list
const SB_AIRCRAFT = [
    // Airbus Narrowbody
    { value: 'A19N', label: 'A19N — Airbus A319neo' },
    { value: 'A319', label: 'A319 — Airbus A319ceo' },
    { value: 'A20N', label: 'A20N — Airbus A320neo' },
    { value: 'A320', label: 'A320 — Airbus A320ceo' },
    { value: 'A21N', label: 'A21N — Airbus A321neo / XLR' },
    { value: 'A321', label: 'A321 — Airbus A321ceo' },
    // Airbus Widebody
    { value: 'A332', label: 'A332 — Airbus A330-200' },
    { value: 'A333', label: 'A333 — Airbus A330-300' },
    { value: 'A338', label: 'A338 — Airbus A330-800neo' },
    { value: 'A339', label: 'A339 — Airbus A330-900neo' },
    { value: 'A346', label: 'A346 — Airbus A340-600' },
    { value: 'A359', label: 'A359 — Airbus A350-900' },
    { value: 'A35K', label: 'A35K — Airbus A350-1000' },
    { value: 'A388', label: 'A388 — Airbus A380-800' },
    // Airbus Regional
    { value: 'BCS1', label: 'BCS1 — Airbus A220-100' },
    { value: 'BCS3', label: 'BCS3 — Airbus A220-300' },
    // Boeing Narrowbody
    { value: 'B736', label: 'B736 — Boeing 737-600' },
    { value: 'B737', label: 'B737 — Boeing 737-700' },
    { value: 'B738', label: 'B738 — Boeing 737-800' },
    { value: 'B739', label: 'B739 — Boeing 737-900' },
    { value: 'B37M', label: 'B37M — Boeing 737 MAX 7' },
    { value: 'B38M', label: 'B38M — Boeing 737 MAX 8' },
    { value: 'B39M', label: 'B39M — Boeing 737 MAX 9' },
    { value: 'B3XM', label: 'B3XM — Boeing 737 MAX 10' },
    { value: 'B752', label: 'B752 — Boeing 757-200' },
    { value: 'B753', label: 'B753 — Boeing 757-300' },
    // Boeing Widebody
    { value: 'B763', label: 'B763 — Boeing 767-300ER' },
    { value: 'B764', label: 'B764 — Boeing 767-400ER' },
    { value: 'B772', label: 'B772 — Boeing 777-200ER' },
    { value: 'B77L', label: 'B77L — Boeing 777-200LR' },
    { value: 'B77W', label: 'B77W — Boeing 777-300ER' },
    { value: 'B779', label: 'B779 — Boeing 777X-9' },
    { value: 'B788', label: 'B788 — Boeing 787-8' },
    { value: 'B789', label: 'B789 — Boeing 787-9' },
    { value: 'B78X', label: 'B78X — Boeing 787-10' },
    { value: 'B744', label: 'B744 — Boeing 747-400' },
    { value: 'B748', label: 'B748 — Boeing 747-8' },
    // Regional / Turboprop
    { value: 'AT72', label: 'AT72 — ATR 72-600' },
    { value: 'AT75', label: 'AT75 — ATR 72-500' },
    { value: 'DH8D', label: 'DH8D — Bombardier Dash 8-Q400' },
    { value: 'CRJ7', label: 'CRJ7 — Bombardier CRJ-700' },
    { value: 'CRJ9', label: 'CRJ9 — Bombardier CRJ-900' },
    { value: 'CRJX', label: 'CRJX — Bombardier CRJ-1000' },
    { value: 'E170', label: 'E170 — Embraer E170' },
    { value: 'E175', label: 'E175 — Embraer E175' },
    { value: 'E190', label: 'E190 — Embraer E190' },
    { value: 'E195', label: 'E195 — Embraer E195' },
    { value: 'E290', label: 'E290 — Embraer E190-E2' },
    { value: 'E295', label: 'E295 — Embraer E195-E2' },
    // Other
    { value: 'MD11', label: 'MD11 — McDonnell Douglas MD-11' },
    { value: 'C17',  label: 'C17  — Boeing C-17 Globemaster' },
];

const sbAircraftCollection = createListCollection({ items: SB_AIRCRAFT });

const CONT_PCTS = [
    { value: '0', label: '0%' },
    { value: '0.05', label: '5%' },
    { value: '0.10', label: '10%' },
    { value: '0.15', label: '15%' },
];

// ── Sub-components ─────────────────────────────────────────────────────────

function IcaoInput({ value, onChange, placeholder, icon: IcaoIcon, label }) {
    return (
        <Stack gap={1} flex={1} minW={0}>
            <Text fontSize="10px" fontWeight="bold" color="fg.muted" letterSpacing="widest" textTransform="uppercase">
                {label}
            </Text>
            <Box position="relative">
                <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="purple.500" zIndex={1} pointerEvents="none">
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
                    h="60px"
                    borderWidth="1px"
                    borderColor={{ base: 'gray.200', _dark: 'whiteAlpha.100' }}
                    bg={{ base: 'white', _dark: 'blackAlpha.300' }}
                    _focus={{ borderColor: 'purple.400', boxShadow: '0 0 0 1px var(--chakra-colors-purple-400)' }}
                    _placeholder={{ color: 'gray.300', fontSize: 'xl', fontWeight: 'normal' }}
                />
            </Box>
        </Stack>
    );
}

function ToggleRow({ label, sublabel, checked, onChange }) {
    return (
        <Flex align="center" justify="space-between" py={2.5}>
            <Box>
                <Text fontSize="sm" fontWeight="medium" color="fg">{label}</Text>
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
            borderColor={{ base: 'gray.200', _dark: 'whiteAlpha.100' }}
            borderRadius="xl"
            bg={{ base: 'white', _dark: 'blackAlpha.300' }}
            overflow="hidden"
        >
            <Flex
                align="center"
                justify="space-between"
                px={5}
                py={3}
                cursor="pointer"
                onClick={() => setOpen(o => !o)}
                bg={{ base: 'gray.50', _dark: 'blackAlpha.200' }}
                borderBottomWidth={open ? '1px' : '0'}
                borderBottomColor={{ base: 'gray.200', _dark: 'whiteAlpha.100' }}
                _hover={{ bg: { base: 'gray.100', _dark: 'whiteAlpha.50' } }}
                transition="background 0.15s"
            >
                <HStack gap={2}>
                    <Icon as={SectionIcon} color="purple.500" boxSize={4} />
                    <Text fontWeight="semibold" fontSize="xs" letterSpacing="wider" textTransform="uppercase" color="fg.muted">
                        {title}
                    </Text>
                </HStack>
                <Icon as={open ? TbChevronUp : TbChevronDown} color="fg.muted" boxSize={4} />
            </Flex>
            {open && <Box px={5} pb={5} pt={4}>{children}</Box>}
        </Box>
    );
}

function PillButton({ active, onClick, children }) {
    return (
        <Button
            size="xs"
            variant={active ? 'solid' : 'outline'}
            colorPalette="purple"
            onClick={onClick}
            fontFamily="mono"
            borderRadius="full"
            px={3}
        >
            {children}
        </Button>
    );
}

// ── OFP Display ────────────────────────────────────────────────────────────

function OFPDisplay({ planText, onClose }) {
    return (
        <Box
            borderWidth="1px"
            borderColor={{ base: 'gray.200', _dark: 'whiteAlpha.100' }}
            borderRadius="xl"
            overflow="hidden"
            bg={{ base: 'white', _dark: 'gray.900' }}
        >
            {/* OFP Header */}
            <Flex
                align="center"
                justify="space-between"
                px={5}
                py={3}
                bg={{ base: 'gray.800', _dark: 'blackAlpha.500' }}
            >
                <HStack gap={2}>
                    <Icon as={TbFileText} color="green.400" boxSize={4} />
                    <Text fontWeight="bold" fontSize="sm" letterSpacing="wider" textTransform="uppercase" color="white">
                        Operational Flight Plan
                    </Text>
                    <Badge colorPalette="green" variant="solid" size="xs">Generated</Badge>
                </HStack>
                <Button size="xs" variant="ghost" color="gray.400" _hover={{ color: 'white' }} onClick={onClose}>
                    Close
                </Button>
            </Flex>

            {/* OFP Body */}
            <Box
                as="pre"
                p={5}
                fontSize="xs"
                fontFamily="'Courier New', monospace"
                lineHeight="1.6"
                whiteSpace="pre-wrap"
                wordBreak="break-word"
                color={{ base: 'gray.800', _dark: 'gray.100' }}
                bg={{ base: 'gray.50', _dark: 'gray.950' }}
                maxH="600px"
                overflowY="auto"
                css={{
                    '&::-webkit-scrollbar': { width: '6px' },
                    '&::-webkit-scrollbar-track': { background: 'transparent' },
                    '&::-webkit-scrollbar-thumb': { background: 'rgba(128,128,128,0.3)', borderRadius: '3px' },
                }}
            >
                {planText || 'OFP text not available.'}
            </Box>
        </Box>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function SimbriefPlanner() {
    const [ orig, setOrig ] = useState('');
    const [ dest, setDest ] = useState('');
    const [ altns, setAltns ] = useState([ '' ]); // 1–4 alternate ICAOs
    const [ acType, setAcType ] = useState('');
    const [ acPrefix, setAcPrefix ] = useState('AI');
    const [ fltnum, setFltnum ] = useState('');
    const [ date, setDate ] = useState('');
    const [ deph, setDeph ] = useState('');
    const [ depm, setDepm ] = useState('');
    const [ route, setRoute ] = useState('');
    const [ fl, setFl ] = useState('');
    const [ ci, setCi ] = useState('');
    const [ pax, setPax ] = useState('');
    const [ cargo, setCargo ] = useState('');
    const [ contpct, setContpct ] = useState('0.05');
    const [ resvrule, setResvrule ] = useState('45');
    const [ navlog, setNavlog ] = useState(true);
    const [ etops, setEtops ] = useState(false);
    const [ stepclimbs, setStepclimbs ] = useState(true);
    const [ tlr, setTlr ] = useState(true);
    const [ notams, setNotams ] = useState(true);
    const [ maps, setMaps ] = useState(true);
    const [ consentChecked, setConsentChecked ] = useState(false);

    const [ dispatching, setDispatching ] = useState(false);
    const [ polling, setPolling ] = useState(false);
    const [ ofpText, setOfpText ] = useState(null);
    const [ dispatchError, setDispatchError ] = useState(null);
    const [ dispatchedRoute, setDispatchedRoute ] = useState(null);

    const pollRef = useRef(null);
    const searchParams = useSearchParams();

    // Pre-fill from URL params (e.g. when coming from route cards)
    useEffect(() => {
        const qOrig = searchParams.get('orig');
        const qDest = searchParams.get('dest');
        const qType = searchParams.get('type');
        const qFltnum = searchParams.get('fltnum');

        if (qOrig) setOrig(qOrig.toUpperCase().slice(0, 4));
        if (qDest) setDest(qDest.toUpperCase().slice(0, 4));
        if (qFltnum) setFltnum(qFltnum.toUpperCase().slice(0, 12));

        if (qType) {
            const type = qType.toUpperCase();
            setAcType(type);
            // Auto-set prefix from QUICK_AIRCRAFT table if matched
            const match = QUICK_AIRCRAFT.find(ac => ac.type === type);
            if (match) setAcPrefix(match.prefix);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const swapAirports = () => { setOrig(dest); setDest(orig); };

    const selectAircraft = (ac) => { setAcType(ac.type); setAcPrefix(ac.prefix); };

    const getAirframeId = () => AIRFRAME_MAP[ `${acPrefix}:${acType}` ] || null;

    const formatDate = (dateStr) => {
        if (!dateStr) return undefined;
        const d = new Date(dateStr);
        const months = [ 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC' ];
        return `${String(d.getUTCDate()).padStart(2, '0')}${months[ d.getUTCMonth() ]}${String(d.getUTCFullYear()).slice(-2)}`;
    };

    const stopPolling = () => {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };

    const pollForOfp = (ofpId) => {
        let attempts = 0;
        const maxAttempts = 60; // 5 min at 5s intervals

        pollRef.current = setInterval(async () => {
            attempts++;
            if (attempts > maxAttempts) {
                stopPolling();
                setPolling(false);
                setDispatchError('SimBrief did not generate the OFP within the expected time. Check SimBrief directly.');
                return;
            }

            try {
                const res = await fetch(`/api/simbrief-ofp?check=1&id=${ofpId}`);
                const { exists } = await res.json();
                if (exists) {
                    stopPolling();
                    // Fetch full OFP
                    const ofpRes = await fetch(`/api/simbrief-ofp?id=${ofpId}`);
                    if (ofpRes.ok) {
                        const data = await ofpRes.json();
                        setOfpText(data.planText);
                        setDispatchedRoute({ orig, dest, acType });
                    } else {
                        setDispatchError('OFP was generated but could not be retrieved.');
                    }
                    setPolling(false);
                }
            } catch {
                // network hiccup, keep polling
            }
        }, 5000);
    };

    const handleDispatch = async () => {
        if (!orig || orig.length !== 4) { toaster.create({ title: 'Enter a valid 4-letter origin ICAO', type: 'error', duration: 3000 }); return; }
        if (!dest || dest.length !== 4) { toaster.create({ title: 'Enter a valid 4-letter destination ICAO', type: 'error', duration: 3000 }); return; }
        if (!acType) { toaster.create({ title: 'Select or enter an aircraft type', type: 'error', duration: 3000 }); return; }
        if (!consentChecked) { toaster.create({ title: 'Please confirm the briefing acknowledgement', type: 'warning', duration: 3000 }); return; }

        setDispatching(true);
        setDispatchError(null);
        setOfpText(null);

        try {
            const body = {
                orig, dest, type: acType, airframeId: getAirframeId(),
                airline: 'INVA', units: 'KGS', contpct, resvrule,
                altns: altns.filter(a => a.length === 4),
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
                throw new Error(err.error || 'Dispatch failed');
            }

            const { simbriefUrl, ofpId } = await res.json();
            window.open(simbriefUrl, '_blank', 'noopener,noreferrer');

            // Begin polling for OFP
            setPolling(true);
            pollForOfp(ofpId);
        } catch (err) {
            setDispatchError(err.message);
            toaster.create({ title: 'Dispatch Error', description: err.message, type: 'error', duration: 5000 });
        } finally {
            setDispatching(false);
        }
    };

    const airframeId = getAirframeId();
    const routeReady = orig.length === 4 && dest.length === 4 && acType;

    return (
        <Box maxW="1100px" mx="auto">
            {/* ── Header ── */}
            <HStack gap={4} mb={8}>
                <Box borderRadius="xl" overflow="hidden" w="48px" h="48px" flexShrink={0} shadow="md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/273326625_7136525176387690_3510893692608149013_n.jpg"
                        alt="Indian Virtual"
                        style={{ width: '48px', height: '48px', objectFit: 'cover', display: 'block' }}
                    />
                </Box>
                <Box>
                    <Heading size="xl" fontWeight="bold" letterSpacing="tight" color="fg">SimBrief Dispatch</Heading>
                    <Text color="fg.muted" fontSize="sm">Generate OFPs for Indian Virtual operations · Weights in KGS</Text>
                </Box>
            </HStack>

            <Grid templateColumns={{ base: '1fr', lg: '1fr 300px' }} gap={5}>
                {/* ── LEFT COLUMN ── */}
                <Stack gap={5}>

                    {/* ROUTE */}
                    <SectionCard title="Route" icon={TbRoute}>
                        <Stack gap={4}>
                            <Flex gap={3} align="flex-end" wrap={{ base: 'wrap', sm: 'nowrap' }}>
                                <IcaoInput value={orig} onChange={setOrig} placeholder="VIDP" icon={TbPlaneDeparture} label="Origin" />
                                <Button
                                    variant="ghost" size="sm" onClick={swapAirports}
                                    color="purple.500" _hover={{ bg: { base: 'gray.100', _dark: 'whiteAlpha.100' } }}
                                    flexShrink={0} h="60px" px={2} mb={0}
                                >
                                    <Icon as={TbArrowsExchange} boxSize={5} />
                                </Button>
                                <IcaoInput value={dest} onChange={setDest} placeholder="VABB" icon={TbPlaneArrival} label="Destination" />
                            </Flex>

                            {/* Alternate count selector */}
                            <Flex justify="center">
                                <HStack gap={1}>
                                    <Text fontSize="10px" fontWeight="bold" color="fg.muted" textTransform="uppercase" letterSpacing="widest">Alternates</Text>
                                    {[ 1, 2, 3, 4 ].map(n => (
                                        <Button
                                            key={n}
                                            size="xs"
                                            variant={altns.length === n ? 'solid' : 'ghost'}
                                            colorPalette="purple"
                                            borderRadius="full"
                                            w="22px" h="22px"
                                            minW="22px"
                                            fontSize="10px"
                                            fontFamily="mono"
                                            onClick={() => setAltns(prev => {
                                                const next = Array.from({ length: n }, (_, i) => prev[i] || '');
                                                return next;
                                            })}
                                        >
                                            {n}
                                        </Button>
                                    ))}
                                </HStack>
                            </Flex>

                            {/* Alternate ICAO inputs */}
                            <Grid templateColumns={`repeat(${Math.min(altns.length, 2)}, 1fr)`} gap={3}>
                                {altns.map((altn, i) => (
                                    <IcaoInput
                                        key={i}
                                        value={altn}
                                        onChange={val => setAltns(prev => prev.map((v, j) => j === i ? val : v))}
                                        placeholder={`ALT${i + 1}`}
                                        icon={TbPlaneArrival}
                                        label={`Alternate ${altns.length > 1 ? i + 1 : ''}`}
                                    />
                                ))}
                            </Grid>

                            <Separator borderColor={{ base: 'gray.100', _dark: 'whiteAlpha.50' }} />
                            <Field.Root>
                                <Field.Label fontSize="10px" fontWeight="bold" color="fg.muted" textTransform="uppercase" letterSpacing="widest">
                                    Route String <Text as="span" fontWeight="normal">(optional — leave blank for auto-routing)</Text>
                                </Field.Label>
                                <Textarea
                                    value={route}
                                    onChange={e => setRoute(e.target.value.toUpperCase())}
                                    placeholder="e.g. DCT IGOLU DCT ESIRU DCT DOBIS..."
                                    size="sm" fontFamily="mono" fontSize="xs" rows={2}
                                    borderColor={{ base: 'gray.200', _dark: 'whiteAlpha.100' }}
                                    bg={{ base: 'white', _dark: 'blackAlpha.200' }}
                                    _focus={{ borderColor: 'purple.400' }}
                                    resize="vertical"
                                />
                            </Field.Root>
                        </Stack>
                    </SectionCard>

                    {/* AIRCRAFT */}
                    <SectionCard title="Aircraft" icon={TbPlane}>
                        <Stack gap={4}>
                            <Grid templateColumns="repeat(auto-fill, minmax(90px, 1fr))" gap={2}>
                                {QUICK_AIRCRAFT.map(ac => {
                                    const selected = acType === ac.type && acPrefix === ac.prefix;
                                    return (
                                        <Box
                                            key={`${ac.prefix}:${ac.type}`}
                                            onClick={() => selectAircraft(ac)}
                                            cursor="pointer"
                                            borderWidth="1px"
                                            borderRadius="lg"
                                            px={2} py={2}
                                            textAlign="center"
                                            transition="all 0.15s"
                                            borderColor={selected ? 'purple.400' : { base: 'gray.200', _dark: 'whiteAlpha.150' }}
                                            bg={selected ? 'purple.500' : { base: 'white', _dark: 'blackAlpha.200' }}
                                            _hover={{ borderColor: 'purple.400', bg: selected ? 'purple.500' : { base: 'purple.50', _dark: 'whiteAlpha.50' } }}
                                            shadow={selected ? '0 0 12px rgba(168,85,247,0.3)' : 'none'}
                                        >
                                            <Text fontSize="sm" fontWeight="bold" fontFamily="mono" color={selected ? 'white' : 'fg'}>{ac.label}</Text>
                                            <Text fontSize="9px" color={selected ? 'purple.100' : 'fg.muted'} mt="1px">{ac.sub}</Text>
                                        </Box>
                                    );
                                })}
                            </Grid>
                            <Separator borderColor={{ base: 'gray.100', _dark: 'whiteAlpha.50' }} />
                            <Field.Root>
                                <Field.Label fontSize="10px" fontWeight="bold" color="fg.muted" textTransform="uppercase" letterSpacing="widest">ICAO Type</Field.Label>
                                <Select.Root
                                    collection={sbAircraftCollection}
                                    value={acType ? [ acType ] : []}
                                    onValueChange={e => {
                                        const type = e.value?.[0] || '';
                                        setAcType(type);
                                        const match = QUICK_AIRCRAFT.find(ac => ac.type === type);
                                        if (match) setAcPrefix(match.prefix);
                                    }}
                                    size="sm"
                                >
                                    <Select.HiddenSelect />
                                    <Select.Control>
                                        <Select.Trigger
                                            fontFamily="mono"
                                            borderColor={{ base: 'gray.200', _dark: 'whiteAlpha.100' }}
                                            bg={{ base: 'white', _dark: 'blackAlpha.200' }}
                                            _focus={{ borderColor: 'purple.400' }}
                                            h="40px"
                                        >
                                            <Select.ValueText placeholder="Select aircraft type..." />
                                        </Select.Trigger>
                                        <Select.IndicatorGroup>
                                            <Select.ClearTrigger />
                                            <Select.Indicator />
                                        </Select.IndicatorGroup>
                                    </Select.Control>
                                    <Portal>
                                        <Select.Positioner>
                                            <Select.Content maxH="260px" overflowY="auto">
                                                {sbAircraftCollection.items.map(item => (
                                                    <Select.Item item={item} key={item.value} fontFamily="mono" fontSize="sm">
                                                        {item.label}
                                                        <Select.ItemIndicator />
                                                    </Select.Item>
                                                ))}
                                            </Select.Content>
                                        </Select.Positioner>
                                    </Portal>
                                </Select.Root>
                            </Field.Root>
                            {airframeId && (
                                <HStack gap={2} px={3} py={2}
                                    bg={{ base: 'purple.50', _dark: 'purple.950' }}
                                    borderRadius="md" borderWidth="1px"
                                    borderColor={{ base: 'purple.200', _dark: 'purple.800' }}
                                >
                                    <Box w={2} h={2} borderRadius="full" bg="purple.500" flexShrink={0} />
                                    <Text fontSize="xs" color={{ base: 'purple.700', _dark: 'purple.300' }} fontFamily="mono">
                                        Indian Virtual airframe profile matched
                                    </Text>
                                </HStack>
                            )}
                        </Stack>
                    </SectionCard>

                    {/* SCHEDULE */}
                    <SectionCard title="Schedule" icon={TbCalendar}>
                        <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }} gap={4}>
                            {[
                                { label: 'Flight No.', node: <Input value={fltnum} onChange={e => setFltnum(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12))} placeholder="AI101" fontFamily="mono" borderColor={{ base: 'gray.200', _dark: 'whiteAlpha.100' }} bg={{ base: 'white', _dark: 'blackAlpha.200' }} _focus={{ borderColor: 'purple.400' }} /> },
                                { label: 'Date', node: <Input type="date" value={date} onChange={e => setDate(e.target.value)} borderColor={{ base: 'gray.200', _dark: 'whiteAlpha.100' }} bg={{ base: 'white', _dark: 'blackAlpha.200' }} _focus={{ borderColor: 'purple.400' }} /> },
                            ].map(({ label, node }) => (
                                <Field.Root key={label}>
                                    <Field.Label fontSize="10px" fontWeight="bold" color="fg.muted" textTransform="uppercase" letterSpacing="widest">{label}</Field.Label>
                                    {node}
                                </Field.Root>
                            ))}
                            <Field.Root>
                                <Field.Label fontSize="10px" fontWeight="bold" color="fg.muted" textTransform="uppercase" letterSpacing="widest">ETD (UTC)</Field.Label>
                                <HStack gap={2}>
                                    <Input value={deph} onChange={e => setDeph(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))} placeholder="HH" fontFamily="mono" maxLength={2} borderColor={{ base: 'gray.200', _dark: 'whiteAlpha.100' }} bg={{ base: 'white', _dark: 'blackAlpha.200' }} _focus={{ borderColor: 'purple.400' }} />
                                    <Input value={depm} onChange={e => setDepm(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))} placeholder="MM" fontFamily="mono" maxLength={2} borderColor={{ base: 'gray.200', _dark: 'whiteAlpha.100' }} bg={{ base: 'white', _dark: 'blackAlpha.200' }} _focus={{ borderColor: 'purple.400' }} />
                                </HStack>
                            </Field.Root>
                        </Grid>
                    </SectionCard>

                    {/* PERFORMANCE & FUEL */}
                    <SectionCard title="Performance & Fuel" icon={TbDroplet} defaultOpen={false}>
                        <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)' }} gap={5}>
                            <Field.Root>
                                <Field.Label fontSize="10px" fontWeight="bold" color="fg.muted" textTransform="uppercase" letterSpacing="widest">Cruise FL</Field.Label>
                                <Input value={fl} onChange={e => setFl(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))} placeholder="Auto" fontFamily="mono" borderColor={{ base: 'gray.200', _dark: 'whiteAlpha.100' }} bg={{ base: 'white', _dark: 'blackAlpha.200' }} _focus={{ borderColor: 'purple.400' }} />
                            </Field.Root>
                            <Field.Root>
                                <Field.Label fontSize="10px" fontWeight="bold" color="fg.muted" textTransform="uppercase" letterSpacing="widest">Cost Index</Field.Label>
                                <Input value={ci} onChange={e => setCi(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))} placeholder="Auto" fontFamily="mono" borderColor={{ base: 'gray.200', _dark: 'whiteAlpha.100' }} bg={{ base: 'white', _dark: 'blackAlpha.200' }} _focus={{ borderColor: 'purple.400' }} />
                            </Field.Root>
                            <Field.Root>
                                <Field.Label fontSize="10px" fontWeight="bold" color="fg.muted" textTransform="uppercase" letterSpacing="widest">Contingency</Field.Label>
                                <HStack gap={2} wrap="wrap">
                                    {CONT_PCTS.map(c => <PillButton key={c.value} active={contpct === c.value} onClick={() => setContpct(c.value)}>{c.label}</PillButton>)}
                                </HStack>
                            </Field.Root>
                            <Field.Root>
                                <Field.Label fontSize="10px" fontWeight="bold" color="fg.muted" textTransform="uppercase" letterSpacing="widest">Reserves</Field.Label>
                                <HStack gap={2} wrap="wrap">
                                    {RESERVE_RULES.map(r => <PillButton key={r.value} active={resvrule === r.value} onClick={() => setResvrule(r.value)}>{r.label}</PillButton>)}
                                </HStack>
                            </Field.Root>
                        </Grid>
                    </SectionCard>

                    {/* PAYLOAD */}
                    <SectionCard title="Payload" icon={TbPackage} defaultOpen={false}>
                        <Grid templateColumns="1fr 1fr" gap={4}>
                            <Field.Root>
                                <Field.Label fontSize="10px" fontWeight="bold" color="fg.muted" textTransform="uppercase" letterSpacing="widest">
                                    <HStack gap={1}><Icon as={TbUsers} boxSize={3} /><span>Passengers</span></HStack>
                                </Field.Label>
                                <Input value={pax} onChange={e => setPax(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))} placeholder="Auto" fontFamily="mono" borderColor={{ base: 'gray.200', _dark: 'whiteAlpha.100' }} bg={{ base: 'white', _dark: 'blackAlpha.200' }} _focus={{ borderColor: 'purple.400' }} />
                            </Field.Root>
                            <Field.Root>
                                <Field.Label fontSize="10px" fontWeight="bold" color="fg.muted" textTransform="uppercase" letterSpacing="widest">Cargo (kg)</Field.Label>
                                <Input value={cargo} onChange={e => setCargo(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} placeholder="Auto" fontFamily="mono" borderColor={{ base: 'gray.200', _dark: 'whiteAlpha.100' }} bg={{ base: 'white', _dark: 'blackAlpha.200' }} _focus={{ borderColor: 'purple.400' }} />
                            </Field.Root>
                        </Grid>
                        <Text fontSize="xs" color="fg.muted" mt={3}>All weights in <Badge size="xs" colorPalette="purple" variant="subtle">KGS</Badge>. Leave blank for SimBrief defaults.</Text>
                    </SectionCard>

                    {/* BRIEFING CONSENT */}
                    <Box
                        borderWidth="1px"
                        borderColor={consentChecked
                            ? { base: 'green.300', _dark: 'green.700' }
                            : { base: 'amber.300', _dark: 'orange.800' }}
                        borderRadius="xl"
                        p={5}
                        bg={consentChecked
                            ? { base: 'green.50', _dark: 'green.950' }
                            : { base: 'orange.50', _dark: 'blackAlpha.300' }}
                        transition="all 0.2s"
                    >
                        <Checkbox.Root
                            checked={consentChecked}
                            onCheckedChange={e => setConsentChecked(!!e.checked)}
                            colorPalette="green"
                            alignItems="flex-start"
                        >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control mt="2px" flexShrink={0} />
                            <Checkbox.Label>
                                <Stack gap={1}>
                                    <Text fontSize="sm" fontWeight="semibold" color="fg">
                                        Pilot Flying Acknowledgement
                                    </Text>
                                    <Text fontSize="xs" color="fg.muted" lineHeight="tall">
                                        I confirm that I have reviewed all available flight information including route, alternate airports, fuel requirements, estimated times, and applicable NOTAMs. As Pilot Flying for this sector, I acknowledge responsibility for the safe and professional conduct of this flight in accordance with Indian Virtual Standard Operating Procedures. I confirm that the aircraft type and planned route are within my qualification and the airline's operational limits.
                                    </Text>
                                </Stack>
                            </Checkbox.Label>
                        </Checkbox.Root>
                    </Box>

                </Stack>

                {/* ── RIGHT COLUMN ── */}
                <Stack gap={5}>

                    {/* DISPATCH CARD */}
                    <Box
                        borderWidth="1px"
                        borderColor={routeReady && consentChecked
                            ? { base: 'purple.300', _dark: 'purple.700' }
                            : { base: 'gray.200', _dark: 'whiteAlpha.100' }}
                        borderRadius="xl"
                        overflow="hidden"
                        transition="all 0.2s"
                        shadow={routeReady && consentChecked ? '0 0 24px rgba(168,85,247,0.12)' : 'none'}
                    >
                        {/* Card header */}
                        <Box
                            px={5} py={3}
                            bg={{ base: 'gray.50', _dark: 'blackAlpha.300' }}
                            borderBottomWidth="1px"
                            borderBottomColor={{ base: 'gray.200', _dark: 'whiteAlpha.100' }}
                        >
                            <HStack gap={2}>
                                <Icon as={TbSend} color="purple.500" boxSize={4} />
                                <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" color="fg.muted">Dispatch</Text>
                            </HStack>
                        </Box>

                        <Box px={5} py={5}>
                            <Stack gap={4}>
                                {/* Flight summary */}
                                {routeReady ? (
                                    <Stack gap={2}>
                                        {[
                                            { label: 'Route', value: `${orig} → ${dest}` },
                                            { label: 'Aircraft', value: acType },
                                            ...(fltnum ? [ { label: 'Flight', value: fltnum } ] : []),
                                            ...(date ? [ { label: 'Date', value: formatDate(date) } ] : []),
                                        ].map(({ label, value }) => (
                                            <Flex key={label} justify="space-between" align="center">
                                                <Text fontSize="xs" color="fg.muted">{label}</Text>
                                                <Text fontFamily="mono" fontWeight="bold" fontSize="sm" color="fg">{value}</Text>
                                            </Flex>
                                        ))}
                                        <Separator borderColor={{ base: 'gray.100', _dark: 'whiteAlpha.50' }} />
                                    </Stack>
                                ) : (
                                    <Text fontSize="sm" color="fg.muted" textAlign="center" py={2}>
                                        Fill in route and aircraft to continue
                                    </Text>
                                )}

                                <Button
                                    onClick={handleDispatch}
                                    loading={dispatching}
                                    loadingText="Dispatching..."
                                    colorPalette="purple"
                                    size="lg"
                                    w="full"
                                    disabled={!routeReady || !consentChecked || dispatching || polling}
                                >
                                    <Icon as={TbSend} />
                                    Dispatch
                                </Button>

                                <Text fontSize="10px" color="fg.subtle" textAlign="center">
                                    Opens SimBrief in a new tab. Log in with your SimBrief account to save OFPs.
                                </Text>
                            </Stack>
                        </Box>
                    </Box>

                    {/* POLLING STATUS */}
                    {polling && (
                        <Box
                            borderWidth="1px"
                            borderColor={{ base: 'blue.200', _dark: 'blue.800' }}
                            borderRadius="xl"
                            p={4}
                            bg={{ base: 'blue.50', _dark: 'blue.950' }}
                        >
                            <HStack gap={3}>
                                <Spinner size="sm" color="blue.500" />
                                <Stack gap={0}>
                                    <Text fontSize="sm" fontWeight="medium" color={{ base: 'blue.700', _dark: 'blue.300' }}>Awaiting OFP Generation</Text>
                                    <Text fontSize="xs" color="fg.muted">SimBrief is processing your flight plan…</Text>
                                </Stack>
                            </HStack>
                        </Box>
                    )}

                    {/* ERROR */}
                    {dispatchError && (
                        <Box
                            borderWidth="1px"
                            borderColor={{ base: 'red.200', _dark: 'red.800' }}
                            borderRadius="xl"
                            p={4}
                            bg={{ base: 'red.50', _dark: 'red.950' }}
                        >
                            <HStack gap={2} mb={1}>
                                <Icon as={TbAlertTriangle} color="red.500" boxSize={4} />
                                <Text fontSize="sm" fontWeight="semibold" color={{ base: 'red.700', _dark: 'red.300' }}>Dispatch Error</Text>
                            </HStack>
                            <Text fontSize="xs" color="fg.muted">{dispatchError}</Text>
                        </Box>
                    )}

                    {/* SUCCESS BADGE */}
                    {ofpText && !polling && (
                        <Box
                            borderWidth="1px"
                            borderColor={{ base: 'green.200', _dark: 'green.800' }}
                            borderRadius="xl"
                            p={4}
                            bg={{ base: 'green.50', _dark: 'green.950' }}
                        >
                            <HStack gap={2}>
                                <Icon as={TbCheck} color="green.500" boxSize={4} />
                                <Text fontSize="sm" fontWeight="semibold" color={{ base: 'green.700', _dark: 'green.300' }}>OFP Ready</Text>
                            </HStack>
                            <Text fontSize="xs" color="fg.muted" mt={1}>
                                {dispatchedRoute?.orig} → {dispatchedRoute?.dest} · {dispatchedRoute?.acType}
                            </Text>
                        </Box>
                    )}

                    {/* OUTPUT OPTIONS */}
                    <SectionCard title="Output Options" icon={TbSettings}>
                        <Stack gap={0}>
                            {[
                                { label: 'Navigation Log', sub: 'Detailed waypoint table', val: navlog, set: setNavlog },
                                { label: 'Maps', sub: 'Route and weather maps', val: maps, set: setMaps },
                                { label: 'NOTAMs', sub: 'Active NOTAMs for route', val: notams, set: setNotams },
                                { label: 'Step Climbs', sub: 'Optimise cruise altitude', val: stepclimbs, set: setStepclimbs },
                                { label: 'Top of Descent', sub: 'TLR descent calculation', val: tlr, set: setTlr },
                                { label: 'ETOPS', sub: 'Extended range operations', val: etops, set: setEtops },
                            ].map(({ label, sub, val, set }, i, arr) => (
                                <Box key={label} borderBottomWidth={i < arr.length - 1 ? '1px' : '0'} borderBottomColor={{ base: 'gray.100', _dark: 'whiteAlpha.50' }}>
                                    <ToggleRow label={label} sublabel={sub} checked={val} onChange={set} />
                                </Box>
                            ))}
                        </Stack>
                    </SectionCard>

                    {/* PRE-CONFIGURED INFO */}
                    <Box
                        borderWidth="1px"
                        borderColor={{ base: 'gray.200', _dark: 'whiteAlpha.100' }}
                        borderRadius="xl"
                        p={4}
                        bg={{ base: 'white', _dark: 'blackAlpha.200' }}
                    >
                        <Text fontSize="10px" fontWeight="bold" color="fg.muted" textTransform="uppercase" letterSpacing="widest" mb={3}>Pre-configured</Text>
                        {[
                            { label: 'Operator', value: 'Indian Virtual (INVA)' },
                            { label: 'Units', value: 'KGS' },
                            { label: 'Avoided FIRs', value: 'PK · SY · IL' },
                        ].map(({ label, value }) => (
                            <Flex key={label} justify="space-between" align="center" py={1}>
                                <Text fontSize="xs" color="fg.muted">{label}</Text>
                                <Text fontSize="xs" fontWeight="medium" fontFamily="mono" color="fg">{value}</Text>
                            </Flex>
                        ))}
                    </Box>
                </Stack>
            </Grid>

            {/* ── OFP DISPLAY (full width, below grid) ── */}
            {ofpText && (
                <Box mt={6}>
                    <OFPDisplay planText={ofpText} onClose={() => setOfpText(null)} />
                </Box>
            )}
        </Box>
    );
}
