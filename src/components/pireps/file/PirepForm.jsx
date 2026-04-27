"use client";

import {
    Button,
    Field,
    Fieldset,
    HStack,
    Icon,
    Input,
    Portal,
    Select,
    createListCollection,
    SimpleGrid,
    Stack,
    Tabs,
    Textarea,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { MdCloudDownload } from 'react-icons/md';

// The component receives pre-fetched data and the session object as props from its parent Server Component.
export function PirepForm({ userId, session, initialAircraft, initialOperators, initialMultipliers, initialIfatcMultipliers, cacheTimestamp }) {
    // Debug logging to check what data is being received
    console.log('[PIREP FORM] Props received:', {
        userId,
        session,
        initialAircraft: initialAircraft?.length || 0,
        initialOperators: initialOperators?.length || 0,
        initialMultipliers: initialMultipliers?.length || 0,
        initialIfatcMultipliers: initialIfatcMultipliers?.length || 0,
        multiplierSample: initialMultipliers?.[ 0 ],
        cacheTimestamp
    });

    // Force component to re-render when cacheTimestamp changes
    const [ forceUpdate, setForceUpdate ] = useState(cacheTimestamp);

    useEffect(() => {
        console.log('[PIREP FORM] Cache timestamp changed, forcing update');
        setForceUpdate(cacheTimestamp);
    }, [ cacheTimestamp ]);

    // Get today's date in YYYY-MM-DD format for default input values.
    const today = new Date().toISOString().split('T')[ 0 ];

    const flightDefaultMultiplier = (initialMultipliers && initialMultipliers.length > 0)
        ? (typeof initialMultipliers[ 0 ] === 'string' ? { label: initialMultipliers[ 0 ], value: initialMultipliers[ 0 ] } : initialMultipliers[ 0 ])
        : { label: 'Regular Flight', value: '1.0', description: '' };
    const aircraftOptions = (initialAircraft || []).map(opt => typeof opt === 'string' ? { label: opt, value: opt } : opt);
    const aircraftCollection = createListCollection({ items: aircraftOptions });
    const [ aircraft, setAircraft ] = useState(aircraftOptions.length > 0 ? aircraftOptions[ 0 ].value : '');
    const operatorOptions = (initialOperators || []).map(opt => typeof opt === 'string' ? { label: opt, value: opt } : opt);
    const operatorCollection = createListCollection({ items: operatorOptions });
    const [ operator, setOperator ] = useState(operatorOptions.length > 0 ? operatorOptions[ 0 ].value : '');
    const multiplierOptions = [ flightDefaultMultiplier, ...((initialMultipliers || []).filter(opt => {
        if (typeof opt === 'string') return opt !== flightDefaultMultiplier.value;
        return opt.value !== flightDefaultMultiplier.value;
    })) ];
    // Build multiplier collection where each item's value is the string index so duplicate numeric values are allowed
    const multiplierCollection = createListCollection({
        items: multiplierOptions.map((opt, idx) => ({
            label: typeof opt === 'string' ? opt : opt.label,
            value: String(idx),
            description: typeof opt === 'string' ? '' : opt.description,
            rawValue: typeof opt === 'string' ? opt : opt.value,
        }))
    });
    // For IFATC, build select options with string index as value for robust selection
    const ifatcMultiplierOptions = (initialIfatcMultipliers || []).map((opt, idx) => ({
        label: typeof opt === 'string' ? opt : opt.label,
        value: String(idx),
        description: typeof opt === 'string' ? '' : opt.description,
        rawValue: typeof opt === 'string' ? opt : opt.value,
    }));
    const ifatcMultiplierCollection = createListCollection({ items: ifatcMultiplierOptions });

    // Get URL search parameters
    const searchParams = useSearchParams();

    // --- State for Flight form fields ---
    const [ flightDate, setFlightDate ] = useState(today);
    const [ flightNumber, setFlightNumber ] = useState('');
    const [ departureIcao, setDepartureIcao ] = useState('');
    const [ arrivalIcao, setArrivalIcao ] = useState('');
    const [ flightTime, setFlightTime ] = useState({ hh: '', mm: '' });
    // store selected multiplier as string index to allow duplicates in raw multiplier values
    const [ selectedMultiplierIdx, setSelectedMultiplierIdx ] = useState('0');
    const [ comments, setComments ] = useState(multiplierCollection.items[ 0 ]?.description || '');

    // Auto-fill form fields from URL parameters
    useEffect(() => {
        const urlFlightNumber = searchParams.get('flightNumber');
        const urlDepartureIcao = searchParams.get('departureIcao');
        const urlArrivalIcao = searchParams.get('arrivalIcao');
        const urlAircraft = searchParams.get('aircraft');

        if (urlFlightNumber && !flightNumber) setFlightNumber(urlFlightNumber);
        if (urlDepartureIcao && !departureIcao) setDepartureIcao(urlDepartureIcao);
        if (urlArrivalIcao && !arrivalIcao) setArrivalIcao(urlArrivalIcao);

        // Handle aircraft selection from URL
        if (urlAircraft && !aircraft) {
            const exactMatch = aircraftOptions.find(ac =>
                ac.value.toLowerCase() === urlAircraft.toLowerCase()
            );

            if (exactMatch) {
                setAircraft(exactMatch.value);
            } else {
                const partialMatch = aircraftOptions.find(ac =>
                    ac.value.toLowerCase().includes(urlAircraft.toLowerCase())
                );

                if (partialMatch) {
                    setAircraft(partialMatch.value);
                }
            }
        }
    }, [ searchParams, aircraftOptions, flightNumber, departureIcao, arrivalIcao, aircraft ]);

    // --- State for IFATC form fields ---
    const [ ifatcDate, setIfatcDate ] = useState(today);
    const [ airportIcao, setAirportIcao ] = useState('');
    const [ ifatcTime, setIfatcTime ] = useState({ open: '', close: '' });
    const [ selectedIfatcMultiplierIdx, setSelectedIfatcMultiplierIdx ] = useState("0");
    const [ ifatcComments, setIfatcComments ] = useState(ifatcMultiplierOptions[ 0 ]?.description || '');
    const [ submitting, setSubmitting ] = useState(false);
    const [ fetchingIF, setFetchingIF ] = useState(false);

    const importFromIF = async () => {
        setFetchingIF(true);
        try {
            const res = await fetch('/api/if-last-flight');
            if (!res.ok) {
                const err = await res.json();
                alert(err.error || 'Failed to fetch flight from Infinite Flight');
                return;
            }
            const data = await res.json();
            if (data.departure) setDepartureIcao(data.departure.slice(0, 4));
            if (data.arrival) setArrivalIcao(data.arrival.slice(0, 4));
            if (data.totalMinutes) {
                setFlightTime({
                    hh: String(Math.floor(data.totalMinutes / 60)).padStart(2, '0'),
                    mm: String(Math.round(data.totalMinutes % 60)).padStart(2, '0'),
                });
            }
            if (data.aircraftName) {
                const norm = s => s.toLowerCase().replace(/[\s\-_]/g, '');
                const ifNorm = norm(data.aircraftName);
                const match =
                    aircraftOptions.find(o => norm(o.label) === ifNorm || norm(o.value) === ifNorm) ||
                    aircraftOptions.find(o => norm(o.label).includes(ifNorm) || ifNorm.includes(norm(o.label)));
                if (match) setAircraft(match.value);
            }
        } catch {
            alert('An error occurred while fetching your last Infinite Flight flight.');
        } finally {
            setFetchingIF(false);
        }
    };

    // Helper: is the current value valid?
    const validIfatcIdx = ifatcMultiplierCollection.items.findIndex(item => item.value === selectedIfatcMultiplierIdx);
    const isValidIfatcMultiplier = validIfatcIdx !== -1;

    // Always keep selected index in bounds if options change
    useEffect(() => {
        if (ifatcMultiplierOptions.length === 0) {
            setSelectedIfatcMultiplierIdx("");
            setIfatcComments("");
        } else {
            const idx = parseInt(selectedIfatcMultiplierIdx, 10);
            if (
                Number.isNaN(idx) ||
                idx < 0 ||
                idx >= ifatcMultiplierOptions.length ||
                !ifatcMultiplierOptions[ idx ] ||
                ifatcMultiplierOptions[ idx ].value !== selectedIfatcMultiplierIdx
            ) {
                setSelectedIfatcMultiplierIdx("0");
                setIfatcComments(ifatcMultiplierOptions[ 0 ]?.description || '');
            } else {
                setIfatcComments(ifatcMultiplierOptions[ idx ]?.description || '');
            }
        }
    }, [ selectedIfatcMultiplierIdx, ifatcMultiplierOptions ]);

    // Handles form submission for both Flight and IFATC PIREPs.
    const handleSubmit = async (type) => {
        try {
            setSubmitting(true);
            let formData = {};

            if (type === 'flight') {
                // Validate required fields
                if (!flightNumber.trim()) {
                    alert('Flight Number is required');
                    return;
                }
                if (!departureIcao.trim() || departureIcao.length !== 4) {
                    alert('Valid 4-character Departure ICAO is required');
                    return;
                }
                if (!arrivalIcao.trim() || arrivalIcao.length !== 4) {
                    alert('Valid 4-character Arrival ICAO is required');
                    return;
                }
                if (!flightTime.hh.trim() || !flightTime.mm.trim()) {
                    alert('Flight Time is required');
                    return;
                }
                if (isNaN(parseInt(flightTime.hh)) || isNaN(parseInt(flightTime.mm))) {
                    alert('Flight Time must be valid numbers');
                    return;
                }
                if (parseInt(flightTime.hh) < 0 || parseInt(flightTime.hh) > 23) {
                    alert('Flight hours must be between 0-23');
                    return;
                }
                if (parseInt(flightTime.mm) < 0 || parseInt(flightTime.mm) > 60) {
                    alert('Flight minutes must be between 0-60');
                    return;
                }

                // Resolve multiplier raw value from the selected index (allows duplicate numeric values)
                const selIdx = parseInt(selectedMultiplierIdx, 10) || 0;
                const resolvedMultiplier = multiplierCollection.items[ selIdx ]?.rawValue || multiplierOptions[ selIdx ]?.value || '1.0';

                formData = {
                    flightNumber,
                    date: flightDate,
                    flightTime: `${flightTime.hh.padStart(2, '0')}:${flightTime.mm.padStart(2, '0')}:00`,
                    departureIcao,
                    arrivalIcao,
                    aircraft,
                    operator,
                    multiplier: resolvedMultiplier,
                    comments,
                    userId
                };

                const response = await fetch('/api/users/pireps', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    alert('Flight PIREP submitted successfully!');
                    // Reset form fields
                    setFlightDate(today);
                    setFlightNumber('');
                    setDepartureIcao('');
                    setArrivalIcao('');
                    setFlightTime({ hh: '', mm: '' });
                    setSelectedMultiplierIdx('0');
                    setComments(multiplierCollection.items[ 0 ]?.description || '');
                } else {
                    const error = await response.json();
                    alert(`Error: ${error.error || 'Failed to submit flight PIREP'}`);
                }
            } else if (type === 'ifatc') {
                const openTimeStr = ifatcTime.open;
                const closeTimeStr = ifatcTime.close;

                if (!airportIcao || !openTimeStr || !closeTimeStr) {
                    alert("Please fill in Airport, Open Time, and Close Time.");
                    return;
                }

                const openDate = new Date(`1970-01-01T${openTimeStr}:00`);
                const closeDate = new Date(`1970-01-01T${closeTimeStr}:00`);

                let timeDifference = closeDate.getTime() - openDate.getTime();
                if (timeDifference < 0) {
                    timeDifference += 24 * 60 * 60 * 1000;
                }

                const hours = Math.floor(timeDifference / (1000 * 60 * 60));
                const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
                const computedFlightTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

                // Resolve IFATC multiplier by index from collection
                const ifatcIdx = parseInt(selectedIfatcMultiplierIdx, 10) || 0;
                let multiplierValue = ifatcMultiplierCollection.items[ ifatcIdx ]?.rawValue || (initialIfatcMultipliers && initialIfatcMultipliers[ ifatcIdx ]?.value) || '1.0';

                formData = {
                    flightNumber: 'IFATC',
                    date: ifatcDate,
                    flightTime: computedFlightTime,
                    departureIcao: airportIcao,
                    arrivalIcao: airportIcao,
                    aircraft: '',
                    operator: 'Indian Virtual',
                    multiplier: multiplierValue,
                    comments: ifatcComments,
                    userId
                };

                const response = await fetch('/api/users/pireps', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    alert('PIREP submitted successfully!');
                    setIfatcDate(today);
                    setAirportIcao('');
                    setIfatcTime({ open: '', close: '' });
                    setSelectedIfatcMultiplierIdx("0");
                    setIfatcComments(ifatcMultiplierOptions[ 0 ]?.description || '');
                } else {
                    const error = await response.json();
                    alert(`Error: ${error.error || 'Failed to submit PIREP'}`);
                }
            }
        } catch (err) {
            console.error('An error occurred during PIREP submission:', err);
            alert('An unexpected error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Tabs.Root variant="enclosed" fitted defaultValue="flight" colorPalette="purple">
            <Tabs.List bg="purple.50" _dark={{ bg: "purple.900" }} borderRadius="md">
                <Tabs.Trigger 
                    value="flight" 
                    color="purple.700" 
                    _dark={{ color: "purple.200" }}
                    _selected={{ bg: "white", color: "purple.600", _dark: { bg: "purple.800", color: "purple.100" } }}
                    px={6}
                    py={2}
                    borderRadius="sm"
                    fontWeight="medium"
                    transition="all 0.2s"
                >
                    Flight
                </Tabs.Trigger>
                <Tabs.Trigger 
                    value="ifatc" 
                    color="purple.700" 
                    _dark={{ color: "purple.200" }}
                    _selected={{ bg: "white", color: "purple.600", _dark: { bg: "purple.800", color: "purple.100" } }}
                    px={6}
                    py={2}
                    borderRadius="sm"
                    fontWeight="medium"
                    transition="all 0.2s"
                >
                    IFATC
                </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="flight" pt={8}>
                <form>
                    <Fieldset.Root>
                        <Fieldset.Legend>Flight Details</Fieldset.Legend>
                        <Button
                            size="md"
                            onClick={importFromIF}
                            loading={fetchingIF}
                            loadingText="Fetching..."
                            mb={4}
                            bg="purple.100"
                            color="purple.800"
                            _dark={{ bg: "purple.800", color: "purple.100" }}
                            _hover={{ bg: "purple.200", _dark: { bg: "purple.700" } }}
                            fontFamily="mono"
                            letterSpacing="wide"
                        >
                            <Icon as={MdCloudDownload} boxSize={5} />
                            Import Last IF Flight
                        </Button>
                        <Fieldset.Content as={Stack} spacing={5}>
                            <SimpleGrid columns={{ base: 1, md: 2 }} gap={8}>
                                <Field.Root>
                                    <Field.Label>Arrival Date</Field.Label>
                                    <Input type="date" value={flightDate} onChange={(e) => setFlightDate(e.target.value)} />
                                </Field.Root>
                                <Field.Root required>
                                    <Field.Label>Flight Number <Field.RequiredIndicator /></Field.Label>
                                    <Input
                                        placeholder="AI108(A)"
                                        value={flightNumber}
                                        onChange={(e) => setFlightNumber(e.target.value.toUpperCase().slice(0, 10))}
                                        maxLength={10}
                                    />
                                </Field.Root>
                                <Field.Root required>
                                    <Field.Label>Departure (ICAO)<Field.RequiredIndicator /></Field.Label>
                                    <Input
                                        placeholder="e.g., VOMM"
                                        value={departureIcao}
                                        onChange={(e) => setDepartureIcao(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4))}
                                        maxLength={4}
                                    />
                                </Field.Root>
                                <Field.Root required>
                                    <Field.Label>Arrival (ICAO)<Field.RequiredIndicator /></Field.Label>
                                    <Input
                                        placeholder="e.g., VECC"
                                        value={arrivalIcao}
                                        onChange={(e) => setArrivalIcao(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4))}
                                        maxLength={4}
                                    />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>Aircraft</Field.Label>
                                    <Select.Root
                                        collection={aircraftCollection}
                                        value={[ aircraft ]}
                                        onValueChange={e => setAircraft(e.value[ 0 ])}
                                        size="sm"
                                        width="100%"
                                    >
                                        <Select.HiddenSelect />
                                        <Select.Control>
                                            <Select.Trigger>
                                                <Select.ValueText placeholder="Select aircraft..." />
                                            </Select.Trigger>
                                            <Select.IndicatorGroup>
                                                <Select.Indicator />
                                            </Select.IndicatorGroup>
                                        </Select.Control>
                                        <Portal>
                                            <Select.Positioner>
                                                <Select.Content>
                                                    {aircraftCollection.items.map((item, idx) => (
                                                        <Select.Item item={item} key={item.value + '-' + idx}>
                                                            {item.label}
                                                            <Select.ItemIndicator />
                                                        </Select.Item>
                                                    ))}
                                                </Select.Content>
                                            </Select.Positioner>
                                        </Portal>
                                    </Select.Root>
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>Operator</Field.Label>
                                    <Select.Root
                                        collection={operatorCollection}
                                        value={[ operator ]}
                                        onValueChange={e => setOperator(e.value[ 0 ])}
                                        size="sm"
                                        width="100%"
                                    >
                                        <Select.HiddenSelect />
                                        <Select.Control>
                                            <Select.Trigger>
                                                <Select.ValueText placeholder="Select operator..." />
                                            </Select.Trigger>
                                            <Select.IndicatorGroup>
                                                <Select.Indicator />
                                            </Select.IndicatorGroup>
                                        </Select.Control>
                                        <Portal>
                                            <Select.Positioner>
                                                <Select.Content>
                                                    {operatorCollection.items.map((item, idx) => (
                                                        <Select.Item item={item} key={item.value + '-' + idx}>
                                                            {item.label}
                                                            <Select.ItemIndicator />
                                                        </Select.Item>
                                                    ))}
                                                </Select.Content>
                                            </Select.Positioner>
                                        </Portal>
                                    </Select.Root>
                                </Field.Root>
                            </SimpleGrid>
                            <Field.Root required>
                                <Field.Label>Flight Time <Field.RequiredIndicator /></Field.Label>
                                <HStack spacing={8}>
                                    <Input
                                        placeholder="HH"
                                        w="70px"
                                        maxLength={2}
                                        value={flightTime.hh}
                                        onChange={(e) => setFlightTime({ ...flightTime, hh: e.target.value.replace(/[^0-9]/g, '').slice(0, 2) })}
                                    />
                                    <Input
                                        placeholder="MM"
                                        w="70px"
                                        maxLength={2}
                                        value={flightTime.mm}
                                        onChange={(e) => setFlightTime({ ...flightTime, mm: e.target.value.replace(/[^0-9]/g, '').slice(0, 2) })}
                                    />
                                </HStack>
                            </Field.Root>
                            <Field.Root>
                                <Field.Label>Multiplier</Field.Label>
                                <Select.Root
                                    collection={multiplierCollection}
                                    value={[ selectedMultiplierIdx ]}
                                    onValueChange={e => {
                                        const val = e.value && e.value[ 0 ] ? e.value[ 0 ] : '0';
                                        setSelectedMultiplierIdx(val);
                                        const idx = parseInt(val, 10) || 0;
                                        setComments(multiplierCollection.items[ idx ]?.description || '');
                                    }}
                                    size="sm"
                                    width="100%"
                                >
                                    <Select.HiddenSelect />
                                    <Select.Control>
                                        <Select.Trigger>
                                            <Select.ValueText placeholder="Select multiplier..." />
                                        </Select.Trigger>
                                        <Select.IndicatorGroup>
                                            <Select.Indicator />
                                        </Select.IndicatorGroup>
                                    </Select.Control>
                                    <Portal>
                                        <Select.Positioner>
                                            <Select.Content>
                                                {multiplierCollection.items.map((item, idx) => (
                                                    <Select.Item item={item} key={item.value + '-' + idx}>
                                                        {item.label}
                                                        <Select.ItemIndicator />
                                                    </Select.Item>
                                                ))}
                                            </Select.Content>
                                        </Select.Positioner>
                                    </Portal>
                                </Select.Root>
                            </Field.Root>
                            <Field.Root>
                                <Field.Label>Pilot Remarks</Field.Label>
                                <Textarea placeholder="Add any comments about your flight..." value={comments} onChange={(e) => setComments(e.target.value.toUpperCase())} />
                            </Field.Root>
                            <Button alignSelf="flex-start" rounded="lg" onClick={() => handleSubmit('flight')} disabled={submitting} isLoading={submitting}>Submit Flight PIREP</Button>
                        </Fieldset.Content>
                    </Fieldset.Root>
                </form>
            </Tabs.Content>

            <Tabs.Content value="ifatc" pt={8}>
                <form>
                    <Fieldset.Root>
                        <Fieldset.Legend>IFATC Session Details</Fieldset.Legend>
                        <Fieldset.Content as={Stack} spacing={10}>
                            <SimpleGrid columns={{ base: 1, md: 2 }} gap={12}>
                                <Field.Root>
                                    <Field.Label>Date</Field.Label>
                                    <Input type="date" value={ifatcDate} onChange={(e) => setIfatcDate(e.target.value)} />
                                </Field.Root>
                                <Field.Root required>
                                    <Field.Label>Airport (ICAO)<Field.RequiredIndicator /></Field.Label>
                                    <Input
                                        placeholder="e.g., VECC"
                                        value={airportIcao}
                                        onChange={(e) => setAirportIcao(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4))}
                                        maxLength={4}
                                    />
                                </Field.Root>
                                <Field.Root required>
                                    <Field.Label>Open Time (Local)<Field.RequiredIndicator /></Field.Label>
                                    <Input type="time" w="120px" value={ifatcTime.open} onChange={(e) => setIfatcTime({ ...ifatcTime, open: e.target.value })} />
                                </Field.Root>
                                <Field.Root required>
                                    <Field.Label>Close Time (Local)<Field.RequiredIndicator /></Field.Label>
                                    <Input type="time" w="120px" value={ifatcTime.close} onChange={(e) => setIfatcTime({ ...ifatcTime, close: e.target.value })} />
                                </Field.Root>
                            </SimpleGrid>
                            <Field.Root required>
                                <Field.Label>Multiplier<Field.RequiredIndicator /></Field.Label>
                                <Select.Root
                                    collection={ifatcMultiplierCollection}
                                    value={[ selectedIfatcMultiplierIdx ]}
                                    onValueChange={e => setSelectedIfatcMultiplierIdx(e.value[ 0 ])}
                                    size="sm"
                                    width="100%"
                                >
                                    <Select.HiddenSelect />
                                    <Select.Control>
                                        <Select.Trigger>
                                            <Select.ValueText placeholder="Select multiplier..." />
                                        </Select.Trigger>
                                        <Select.IndicatorGroup>
                                            <Select.Indicator />
                                        </Select.IndicatorGroup>
                                    </Select.Control>
                                    <Portal>
                                        <Select.Positioner>
                                            <Select.Content>
                                                {ifatcMultiplierCollection.items.map((item, idx) => (
                                                    <Select.Item item={item} key={item.value + '-' + idx}>
                                                        {item.label}
                                                        <Select.ItemIndicator />
                                                    </Select.Item>
                                                ))}
                                            </Select.Content>
                                        </Select.Positioner>
                                    </Portal>
                                </Select.Root>
                            </Field.Root>
                            <Field.Root>
                                <Field.Label>ATC Remarks</Field.Label>
                                <Textarea placeholder="Add any comments about your session..." value={ifatcComments} onChange={(e) => setIfatcComments(e.target.value.toUpperCase())} />
                            </Field.Root>
                            <Button alignSelf="flex-start" onClick={() => handleSubmit('ifatc')} disabled={submitting} isLoading={submitting}>Submit IFATC PIREP</Button>
                        </Fieldset.Content>
                    </Fieldset.Root>
                </form>
            </Tabs.Content>
        </Tabs.Root>
    );
};
