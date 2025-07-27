"use client"

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
} from '@chakra-ui/react'
import { useState } from 'react'

// Mock data for select inputs
const aircraftOptions = [ "Airbus A320", "Boeing 737", "ATR 72-600", "Bombardier Q400" ];
const operatorOptions = [ "Indian Virtual", "IndiGo Virtual", "Vistara Virtual" ];

const multiplierOptions = [
    { value: "1.0", label: "1.0 - Standard Flight", description: "Standard flight with no special events or circumstances." },
    { value: "1.5", label: "1.5 - Inaugural Event", description: "First flight of a new route, aircraft type, or airline service." },
    { value: "2.0", label: "2.0 - Special Event", description: "Flight supporting special events like holidays, seasonal services, or promotional flights." },
    { value: "2.5", label: "2.5 - Major Event", description: "Flight during major aviation events, airshows, or significant operational milestones." },
    { value: "3.0", label: "3.0 - Anniversary Event", description: "Flight celebrating important anniversaries, company milestones, or historic aviation events." }
];

export default function PirepForm({ userId }) {
    const today = new Date().toISOString().split('T')[ 0 ];

    // --- NEW: State for ALL Flight form fields ---
    const [ flightDate, setFlightDate ] = useState(today);
    const [ flightNumber, setFlightNumber ] = useState('');
    const [ departureIcao, setDepartureIcao ] = useState('');
    const [ arrivalIcao, setArrivalIcao ] = useState('');
    const [ aircraft, setAircraft ] = useState(aircraftOptions[ 0 ]);
    const [ operator, setOperator ] = useState(operatorOptions[ 0 ]);
    const [ flightTime, setFlightTime ] = useState({ hh: '', mm: '' });
    const [ selectedMultiplier, setSelectedMultiplier ] = useState('1.0');
    const [ comments, setComments ] = useState('Standard flight with no special events or circumstances.');

    // --- NEW: State for ALL IFATC form fields ---
    const [ ifatcDate, setIfatcDate ] = useState(today);
    const [ airportIcao, setAirportIcao ] = useState('');
    const [ ifatcTime, setIfatcTime ] = useState({ open: '', close: '' });
    const [ selectedIfatcMultiplier, setSelectedIfatcMultiplier ] = useState('1.0');
    const [ ifatcComments, setIfatcComments ] = useState('Standard flight with no special events or circumstances.');


    const handleSubmit = async (type) => {
        try {
            let formData = {};

            if (type === 'flight') {
                // --- MODIFIED: Read from state, not the DOM ---
                formData = {
                    flightNumber: flightNumber,
                    date: flightDate,
                    flightTime: `${flightTime.hh.padStart(2, '0')}:${flightTime.mm.padStart(2, '0')}:00`,
                    departureIcao: departureIcao,
                    arrivalIcao: arrivalIcao,
                    aircraft: aircraft,
                    operator: operator,
                    multiplier: selectedMultiplier,
                    comments: comments,
                    userId: userId
                };
            } else if (type === 'ifatc') {
                // --- MODIFIED: Read from state, not the DOM ---
                const openTimeStr = ifatcTime.open;
                const closeTimeStr = ifatcTime.close;
                
                // Simple validation
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

                formData = {
                    flightNumber: 'IFATC',
                    date: ifatcDate,
                    flightTime: computedFlightTime,
                    departureIcao: airportIcao,
                    arrivalIcao: airportIcao,
                    aircraft: '',
                    operator: 'Indian Virtual',
                    multiplier: selectedIfatcMultiplier,
                    comments: ifatcComments,
                    userId: userId
                };
            }
            
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
                                <Field.Root>
                                    <Field.Label>Arrival Date</Field.Label>
                                    {/* --- MODIFIED: Controlled component --- */}
                                    <Input type="date" value={flightDate} onChange={(e) => setFlightDate(e.target.value)} />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>Flight Number</Field.Label>
                                    {/* --- MODIFIED: Controlled component --- */}
                                    <Input placeholder="IV1234" value={flightNumber} onChange={(e) => setFlightNumber(e.target.value)} />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>Departure (ICAO)</Field.Label>
                                    {/* --- MODIFIED: Controlled component --- */}
                                    <Input placeholder="e.g., VOMM" value={departureIcao} onChange={(e) => setDepartureIcao(e.target.value)} />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>Arrival (ICAO)</Field.Label>
                                    {/* --- MODIFIED: Controlled component --- */}
                                    <Input placeholder="e.g., VECC" value={arrivalIcao} onChange={(e) => setArrivalIcao(e.target.value)} />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>Aircraft</Field.Label>
                                    <NativeSelect.Root>
                                        {/* --- MODIFIED: Controlled component --- */}
                                        <NativeSelect.Field value={aircraft} onChange={(e) => setAircraft(e.target.value)}>
                                            {aircraftOptions.map((ac) => <option key={ac} value={ac}>{ac}</option>)}
                                        </NativeSelect.Field>
                                        <NativeSelect.Indicator />
                                    </NativeSelect.Root>
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>Operator</Field.Label>
                                    <NativeSelect.Root>
                                        {/* --- MODIFIED: Controlled component --- */}
                                        <NativeSelect.Field value={operator} onChange={(e) => setOperator(e.target.value)}>
                                            {operatorOptions.map((op) => <option key={op} value={op}>{op}</option>)}
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
                                                const selected = multiplierOptions.find(opt => opt.value === value);
                                                if (selected) setComments(selected.description);
                                            }}
                                        >
                                            {multiplierOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                                        </NativeSelect.Field>
                                        <NativeSelect.Indicator />
                                    </NativeSelect.Root>
                                </Field.Root>
                            </SimpleGrid>
                            <Field.Root>
                                <Field.Label>Comments</Field.Label>
                                <Textarea placeholder="Add any comments about your flight..." value={comments} onChange={(e) => setComments(e.target.value)} />
                            </Field.Root>
                            <Button alignSelf="flex-start" colorScheme="blue" onClick={() => handleSubmit('flight')}>Submit Flight PIREP</Button>
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
                                    {/* --- MODIFIED: Controlled component --- */}
                                    <Input type="date" value={ifatcDate} onChange={(e) => setIfatcDate(e.target.value)} />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>Airport (ICAO)</Field.Label>
                                    {/* --- MODIFIED: Controlled component --- */}
                                    <Input placeholder="e.g., VIDP" value={airportIcao} onChange={(e) => setAirportIcao(e.target.value)} />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>Open Time (UTC)</Field.Label>
                                    <Input type="time" w="120px" value={ifatcTime.open} onChange={(e) => setIfatcTime({ ...ifatcTime, open: e.target.value })} />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>Close Time (UTC)</Field.Label>
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
                                                const selected = multiplierOptions.find(opt => opt.value === value);
                                                if (selected) setIfatcComments(selected.description);
                                            }}
                                        >
                                            {multiplierOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                                        </NativeSelect.Field>
                                        <NativeSelect.Indicator />
                                    </NativeSelect.Root>
                                </Field.Root>
                            </SimpleGrid>
                            <Field.Root>
                                <Field.Label>Comments</Field.Label>
                                <Textarea placeholder="Add any comments about your session..." value={ifatcComments} onChange={(e) => setIfatcComments(e.target.value)} />
                            </Field.Root>
                            <Button alignSelf="flex-start" colorScheme="blue" onClick={() => handleSubmit('ifatc')}>Submit IFATC PIREP</Button>
                        </Fieldset.Content>
                    </Fieldset.Root>
                </form>
            </Tabs.Content>
        </Tabs.Root>
    )
}