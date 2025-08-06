"use client";

import {
    Button,
    Field,
    Fieldset,
    HStack,
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

// The component receives pre-fetched data and the userId as props from its parent Server Component.
export function PirepForm({ userId, initialAircraft, initialOperators, initialMultipliers, initialIfatcMultipliers }) {
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
    const multiplierCollection = createListCollection({ items: multiplierOptions });
    // For IFATC, build select options with string index as value for robust selection
    const ifatcMultiplierOptions = (initialIfatcMultipliers || []).map((opt, idx) => ({
        label: typeof opt === 'string' ? opt : opt.label,
        value: String(idx),
        description: typeof opt === 'string' ? '' : opt.description,
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
    const [ selectedMultiplierIdx, setSelectedMultiplierIdx ] = useState(0);
    const [ comments, setComments ] = useState(multiplierOptions[ 0 ]?.description || '');

    // Auto-fill form fields from URL parameters
    useEffect(() => {
        const urlFlightNumber = searchParams.get('flightNumber');
        const urlDepartureIcao = searchParams.get('departureIcao');
        const urlArrivalIcao = searchParams.get('arrivalIcao');
        const urlAircraft = searchParams.get('aircraft');

        if (urlFlightNumber) setFlightNumber(urlFlightNumber);
        if (urlDepartureIcao) setDepartureIcao(urlDepartureIcao);
        if (urlArrivalIcao) setArrivalIcao(urlArrivalIcao);

        // Handle aircraft selection from URL
        if (urlAircraft) {
            // Find exact match in aircraft options
            const exactMatch = aircraftOptions.find(ac =>
                ac.value.toLowerCase() === urlAircraft.toLowerCase()
            );

            if (exactMatch) {
                setAircraft(exactMatch.value);
            } else {
                // Try to find partial match (e.g., "A320" matches "Airbus 320")
                const partialMatch = aircraftOptions.find(ac =>
                    ac.value.toLowerCase().includes(urlAircraft.toLowerCase())
                );

                if (partialMatch) {
                    setAircraft(partialMatch.value);
                }
            }
        }
    }, [ searchParams, aircraftOptions ]);

    // --- State for IFATC form fields ---
    const [ ifatcDate, setIfatcDate ] = useState(today);
    const [ airportIcao, setAirportIcao ] = useState('');
    const [ ifatcTime, setIfatcTime ] = useState({ open: '', close: '' });
    const [ selectedIfatcMultiplierIdx, setSelectedIfatcMultiplierIdx ] = useState("0");
    const [ ifatcComments, setIfatcComments ] = useState(ifatcMultiplierOptions[ 0 ]?.description || '');

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
            let formData = {};

            if (type === 'flight') {
                formData = {
                    flightNumber,
                    date: flightDate,
                    flightTime: `${flightTime.hh.padStart(2, '0')}:${flightTime.mm.padStart(2, '0')}:00`,
                    departureIcao,
                    arrivalIcao,
                    aircraft,
                    operator,
                    multiplier: multiplierOptions[ selectedMultiplierIdx ]?.value,
                    comments,
                    userId
                };
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
                if (timeDifference < 0) { // Handles sessions that cross midnight
                    timeDifference += 24 * 60 * 60 * 1000;
                }

                const hours = Math.floor(timeDifference / (1000 * 60 * 60));
                const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
                const computedFlightTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

                const idx = parseInt(selectedIfatcMultiplierIdx, 10);
                const multiplierValue = (initialIfatcMultipliers && initialIfatcMultipliers.length > idx)
                    ? (typeof initialIfatcMultipliers[ idx ] === 'string'
                        ? initialIfatcMultipliers[ idx ]
                        : initialIfatcMultipliers[ idx ]?.value)
                    : '1.0';
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
            }

            // Post the prepared data to the API endpoint.
            const response = await fetch('/api/users/pireps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert('PIREP submitted successfully!');
                // Reset form data
                setFlightDate(today);
                setFlightNumber('');
                setDepartureIcao('');
                setArrivalIcao('');
                setFlightTime({ hh: '', mm: '' });
                setSelectedMultiplierIdx(0);
                setComments(multiplierOptions[ 0 ]?.description || '');
            } else {
                const error = await response.json();
                alert(`Error: ${error.error || 'Failed to submit PIREP'}`);
            }
        } catch (err) {
            console.error('An error occurred during PIREP submission:', err);
            alert('An unexpected error occurred. Please try again.');
        }
    };

    return (
        <Tabs.Root variant="enclosed" fitted defaultValue="flight">
            <Tabs.List>
                <Tabs.Trigger value="flight">Flight</Tabs.Trigger>
                <Tabs.Trigger value="ifatc">IFATC</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="flight" pt={8}>
                <form>
                    <Fieldset.Root>
                        <Fieldset.Legend>Flight Details</Fieldset.Legend>
                        <Fieldset.Content as={Stack} spacing={5}>
                            <SimpleGrid columns={{ base: 1, md: 2 }} gap={8}>
                                {/* Fields for Flight Details... */}
                                <Field.Root>
                                    <Field.Label>Arrival Date</Field.Label>
                                    <Input type="date" value={flightDate} onChange={(e) => setFlightDate(e.target.value)} />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>Flight Number</Field.Label>
                                    <Input
                                        placeholder="IV1234"
                                        value={flightNumber}
                                        onChange={(e) => setFlightNumber(e.target.value.toUpperCase().slice(0, 10))}
                                        maxLength={10}
                                    />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>Departure (ICAO)</Field.Label>
                                    <Input
                                        placeholder="e.g., VOMM"
                                        value={departureIcao}
                                        onChange={(e) => setDepartureIcao(e.target.value.toUpperCase().slice(0, 4))}
                                        maxLength={4}
                                    />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>Arrival (ICAO)</Field.Label>
                                    <Input
                                        placeholder="e.g., VECC"
                                        value={arrivalIcao}
                                        onChange={(e) => setArrivalIcao(e.target.value.toUpperCase().slice(0, 4))}
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
                                        <Select.HiddenSelect />                                        <Select.Control>
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
                                <Field.Root>
                                    <Field.Label>Flight Time</Field.Label>
                                    <HStack spacing={8}>
                                        <Input placeholder="HH" w="70px" value={flightTime.hh} onChange={(e) => setFlightTime({ ...flightTime, hh: e.target.value })} />
                                        <Input placeholder="MM" w="70px" value={flightTime.mm} onChange={(e) => setFlightTime({ ...flightTime, mm: e.target.value })} />
                                    </HStack>
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>Multiplier</Field.Label>
                                    <Select.Root
                                        collection={multiplierCollection}
                                        value={[ multiplierOptions[ selectedMultiplierIdx ]?.value ]}
                                        onValueChange={e => {
                                            const idx = multiplierOptions.findIndex(opt => opt.value.toString() === e.value[ 0 ]?.toString());
                                            setSelectedMultiplierIdx(idx === -1 ? 0 : idx);
                                            setComments(multiplierOptions[ idx === -1 ? 0 : idx ]?.description || '');
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
                            </SimpleGrid>
                            <Field.Root>
                                <Field.Label>Pilot Remarks</Field.Label>
                                <Textarea placeholder="Add any comments about your flight..." value={comments} onChange={(e) => setComments(e.target.value.toUpperCase())} />
                            </Field.Root>
                            <Button alignSelf="flex-start" onClick={() => handleSubmit('flight')}>Submit Flight PIREP</Button>
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
                                {/* Fields for IFATC Details... */}
                                <Field.Root>
                                    <Field.Label>Date</Field.Label>
                                    <Input type="date" value={ifatcDate} onChange={(e) => setIfatcDate(e.target.value)} />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>Airport (ICAO)</Field.Label>
                                    <Input placeholder="e.g., VIDP" value={airportIcao} onChange={(e) => setAirportIcao(e.target.value)} />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>Open Time (Local)</Field.Label>
                                    <Input type="time" w="120px" value={ifatcTime.open} onChange={(e) => setIfatcTime({ ...ifatcTime, open: e.target.value })} />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>Close Time (Local)</Field.Label>
                                    <Input type="time" w="120px" value={ifatcTime.close} onChange={(e) => setIfatcTime({ ...ifatcTime, close: e.target.value })} />
                                </Field.Root>
                                {/* Only render Select if value is valid and present in options */}
                                {ifatcMultiplierOptions.length > 0 &&
                                    typeof selectedIfatcMultiplierIdx === 'string' &&
                                    selectedIfatcMultiplierIdx !== "" &&
                                    isValidIfatcMultiplier && (
                                        <Field.Root>
                                            <Field.Label>Multiplier</Field.Label>
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
                                                            {ifatcMultiplierCollection.items
                                                                .filter(item => typeof item.value === 'string' && item.label)
                                                                .map((item, idx) => (
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
                                    )}
                            </SimpleGrid>
                            <Field.Root>
                                <Field.Label>ATC Remarks</Field.Label>
                                <Textarea placeholder="Add any comments about your session..." value={ifatcComments} onChange={(e) => setIfatcComments(e.target.value.toUpperCase())} />
                            </Field.Root>
                            <Button alignSelf="flex-start" onClick={() => handleSubmit('ifatc')}>Submit IFATC PIREP</Button>
                        </Fieldset.Content>
                    </Fieldset.Root>
                </form>
            </Tabs.Content>
        </Tabs.Root>
    )
}