"use client";

import { useState, useEffect } from 'react';
import { Portal, Select, createListCollection, Spinner, Box, useSelectContext } from "@chakra-ui/react";
// Custom ValueText for multi-select: comma-separated ICAOs
function CommaSeparatedValueText({ placeholder }) {
    const select = useSelectContext();
    const selected = select.selectedItems;
    if (!selected || selected.length === 0) {
        return <Select.ValueText placeholder={placeholder} />;
    }
    // selected is array of {label, value}
    return <span>{selected.map(item => item.label).join(', ')}</span>;
}



export default function AircraftSelect({ value, onChange, placeholder = "Select aircraft...", aircraftList: aircraftListProp }) {
    // aircraftListProp is [{label, value}] (from fetchFleetModule)
    const [ aircraftList, setAircraftList ] = useState(Array.isArray(aircraftListProp) ? aircraftListProp : []);
    const [ loading, setLoading ] = useState(!aircraftListProp);
    const [ error, setError ] = useState(null);

    useEffect(() => {
        if (aircraftListProp && Array.isArray(aircraftListProp) && aircraftListProp.length > 0) {
            setAircraftList(aircraftListProp);
            setLoading(false);
            return;
        }
        loadAircraft();
    }, [ aircraftListProp ]);

    const loadAircraft = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/fleet');
            if (!response.ok) {
                throw new Error('Failed to fetch aircraft data');
            }
            const aircraftOptions = await response.json();
            // Assume API returns [{label, value}]
            setAircraftList(Array.isArray(aircraftOptions) ? aircraftOptions : []);
        } catch (err) {
            setError('Failed to load aircraft');
            console.error('Error loading aircraft:', err);
        } finally {
            setLoading(false);
        }
    };

    // For Chakra Select, collection expects [{label, value}]
    const aircraftCollection = createListCollection({
        items: aircraftList
    });

    // Multi-select: value is an array of ICAOs (strings)
    const handleValueChange = (details) => {
        if (onChange) {
            // details.value is an array of selected ICAOs
            onChange(details.value);
        }
    };

    const getSelectedValues = () => {
        if (!value) return [];
        // If value is a string (legacy), convert to array
        if (typeof value === 'string') {
            return value.split(',').map(v => v.trim()).filter(Boolean);
        }
        // If already array, return as is
        return Array.isArray(value) ? value : [];
    };

    if (loading) {
        return (
            <Box p={4}>
                <Spinner size="sm" />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={4} color="red.500">
                {error}
            </Box>
        );
    }

    return (
        <Select.Root
            multiple
            collection={aircraftCollection}
            value={getSelectedValues()}
            onValueChange={handleValueChange}
            size="sm"
            width="100%"
        >
            <Select.HiddenSelect />
            <Select.Label>Select Aircraft</Select.Label>
            <Select.Control>
                <Select.Trigger>
                    <CommaSeparatedValueText placeholder={placeholder} />
                </Select.Trigger>
                <Select.IndicatorGroup>
                    <Select.Indicator />
                </Select.IndicatorGroup>
            </Select.Control>
            <Select.Positioner>
                <Select.Content>
                    {aircraftCollection.items.map((aircraft, idx) => (
                        aircraft.value ? (
                            <Select.Item item={aircraft} key={String(aircraft.value) + '-' + idx}>
                                {aircraft.label}
                                <Select.ItemIndicator />
                            </Select.Item>
                        ) : null
                    ))}
                </Select.Content>
            </Select.Positioner>
        </Select.Root>
    );
}
