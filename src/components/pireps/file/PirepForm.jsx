"use client";

import {
    Button,
    Field,
    Fieldset,
    HStack,
    Input,
    NativeSelect,
    SimpleGrid,
    Stack,
    Tabs,
    Textarea,
} from '@chakra-ui/react';
import { useState } from 'react';

// The component receives pre-fetched data and the userId as props from its parent Server Component.
export function PirepForm({ userId, initialAircraft, initialOperators, initialMultipliers, initialIfatcMultipliers }) {
    // Get today's date in YYYY-MM-DD format for default input values.
    const today = new Date().toISOString().split('T')[0];

    // --- Data from Props ---
    // Derive options from props, with empty arrays as a fallback to prevent errors.
    const aircraftOptions = initialAircraft || [];
    const operatorOptions = initialOperators || [];
    const multiplierOptions = initialMultipliers || [{ label: 'Regular Flight', value: '1.0', description: '' }];
    const ifatcMultiplierOptions = initialIfatcMultipliers || [];

    // --- State for Flight form fields ---
    const [flightDate, setFlightDate] = useState(today);
    const [flightNumber, setFlightNumber] = useState('');
    const [departureIcao, setDepartureIcao] = useState('');
    const [arrivalIcao, setArrivalIcao] = useState('');
    const [aircraft, setAircraft] = useState(aircraftOptions[0] || 'None available');
    const [operator, setOperator] = useState(operatorOptions[0] || 'None available');
    const [flightTime, setFlightTime] = useState({ hh: '', mm: '' });
    const [selectedMultiplier, setSelectedMultiplier] = useState(multiplierOptions[0]?.value?.toString() || '1.0');
    // MODIFIED: Initialize comments with the description of the default multiplier.
    const [comments, setComments] = useState(multiplierOptions[0]?.description || '');

    // --- State for IFATC form fields ---
    const [ifatcDate, setIfatcDate] = useState(today);
    const [airportIcao, setAirportIcao] = useState('');
    const [ifatcTime, setIfatcTime] = useState({ open: '', close: '' });
    const [selectedIfatcMultiplier, setSelectedIfatcMultiplier] = useState('0');
    // MODIFIED: Initialize IFATC comments with the description of the default multiplier.
    const [ifatcComments, setIfatcComments] = useState(ifatcMultiplierOptions[0]?.description || '');


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
                    multiplier: selectedMultiplier,
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

                // Calculate total session time for IFATC
                const openDate = new Date(`1970-01-01T${openTimeStr}:00`);
                const closeDate = new Date(`1970-01-01T${closeTimeStr}:00`);

                let timeDifference = closeDate.getTime() - openDate.getTime();
                if (timeDifference < 0) { // Handles sessions that cross midnight
                    timeDifference += 24 * 60 * 60 * 1000;
                }

                const hours = Math.floor(timeDifference / (1000 * 60 * 60));
                const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
                const computedFlightTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

                formData = {
                    flightNumber: 'IFATC',
                    date: ifatcDate,
                    flightTime: computedFlightTime,
                    departureIcao: airportIcao,
                    arrivalIcao: airportIcao,
                    aircraft: '',
                    operator: 'Indian Virtual',
                    multiplier: ifatcMultiplierOptions[selectedIfatcMultiplier]?.value || '1.0',
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
                                    <Input placeholder="IV1234" value={flightNumber} onChange={(e) => setFlightNumber(e.target.value)} />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>Departure (ICAO)</Field.Label>
                                    <Input placeholder="e.g., VOMM" value={departureIcao} onChange={(e) => setDepartureIcao(e.target.value)} />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>Arrival (ICAO)</Field.Label>
                                    <Input placeholder="e.g., VECC" value={arrivalIcao} onChange={(e) => setArrivalIcao(e.target.value)} />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>Aircraft</Field.Label>
                                    <NativeSelect.Root>
                                        <NativeSelect.Field value={aircraft} onChange={(e) => setAircraft(e.target.value)}>
                                            {aircraftOptions.map((ac, index) => <option key={`${ac}-${index}`} value={ac}>{ac}</option>)}
                                        </NativeSelect.Field>
                                        <NativeSelect.Indicator />
                                    </NativeSelect.Root>
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>Operator</Field.Label>
                                    <NativeSelect.Root>
                                        <NativeSelect.Field value={operator} onChange={(e) => setOperator(e.target.value)}>
                                            {operatorOptions.map((op, index) => <option key={`${op}-${index}`} value={op}>{op}</option>)}
                                        </NativeSelect.Field>
                                        <NativeSelect.Indicator />
                                    </NativeSelect.Root>
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
                                    <NativeSelect.Root>
                                        <NativeSelect.Field
                                            value={selectedMultiplier}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setSelectedMultiplier(value);
                                                // MODIFIED: Find the full multiplier object to get its description.
                                                // We compare values as strings because e.target.value is always a string.
                                                const selected = multiplierOptions.find(opt => opt.value.toString() === value);
                                                // If a matching object is found, update the comments state.
                                                if (selected) {
                                                    setComments(selected.description);
                                                }
                                            }}
                                        >
                                            {multiplierOptions.map((opt, index) => (<option key={`${opt.value}-${index}`} value={opt.value}>{opt.label}</option>))}
                                        </NativeSelect.Field>
                                        <NativeSelect.Indicator />
                                    </NativeSelect.Root>
                                </Field.Root>
                            </SimpleGrid>
                            <Field.Root>
                                <Field.Label>Pilot Remarks</Field.Label>
                                <Textarea placeholder="Add any comments about your flight..." value={comments} onChange={(e) => setComments(e.target.value)} />
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
                                <Field.Root>
                                    <Field.Label>Multiplier</Field.Label>
                                    <NativeSelect.Root>
                                        <NativeSelect.Field
                                            value={selectedIfatcMultiplier}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setSelectedIfatcMultiplier(value);
                                                // MODIFIED: Find the full multiplier object to get its description.
                                                const selected = ifatcMultiplierOptions[value];
                                                // If a matching object is found, update the comments state.
                                                if (selected) {
                                                    setIfatcComments(selected.description);
                                                }
                                            }}
                                        >
                                            {ifatcMultiplierOptions.map((opt, index) => (<option key={`${opt.value}-${index}`} value={index}>{opt.label}</option>))}
                                        </NativeSelect.Field>
                                        <NativeSelect.Indicator />
                                    </NativeSelect.Root>
                                </Field.Root>
                            </SimpleGrid>
                            <Field.Root>
                                <Field.Label>ATC Remarks</Field.Label>
                                <Textarea placeholder="Add any comments about your session..." value={ifatcComments} onChange={(e) => setIfatcComments(e.target.value)} />
                            </Field.Root>
                            <Button alignSelf="flex-start" onClick={() => handleSubmit('ifatc')}>Submit IFATC PIREP</Button>
                        </Fieldset.Content>
                    </Fieldset.Root>
                </form>
            </Tabs.Content>
        </Tabs.Root>
    )
}