"use client";

import {
    Box,
    Button,
    VStack,
    HStack,
    Text,
    Badge,
    Card,
    Stack,
    Input,
    Textarea,
    Checkbox,
    FileUpload,
} from "@chakra-ui/react";
import { useState } from "react";
import GateAllocationDrawer from "./GateAllocationDrawer";

export default function EventsManager({ initialEventsData, moduleName = "events" }) {

    const [ events, setEvents ] = useState(() => {
        console.log("Initial events data:", initialEventsData, "Type:", typeof initialEventsData);
        
        // Handle array data (from API response)
        if (Array.isArray(initialEventsData)) {
            return initialEventsData;
        }
        
        // Handle string data that needs parsing
        if (typeof initialEventsData === "string" && initialEventsData.trim() !== "" && initialEventsData !== "Error loading events data.") {
            try {
                const parsed = JSON.parse(initialEventsData);
                return Array.isArray(parsed) ? parsed : [];
            } catch (error) {
                console.error("Error parsing initial events data:", error);
                return [];
            }
        }
        
        return [];
    });
    const [ editingEvent, setEditingEvent ] = useState(null);
    const [ isAdding, setIsAdding ] = useState(false);
    const [ isUpdating, setIsUpdating ] = useState(false);
    const [ timeInputValue, setTimeInputValue ] = useState("");
    const [ allocatingEvent, setAllocatingEvent ] = useState(null);


    const handleSave = async () => {
        setIsUpdating(true);
        try {
            console.log("Saving events:", events);
            const response = await fetch("/api/crewcenter", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ moduleName, newValue: events }),
            });

            console.log("Save response status:", response.status);
            if (response.ok) {
                alert("Events updated successfully!");
            } else {
                const errorData = await response.json();
                console.error("Save error:", errorData);
                alert(`Failed to update events: ${errorData.error || "Unknown error"}`);
            }
        } catch (error) {
            console.error("Failed to update events:", error);
            alert("An unexpected error occurred during the update process. Please try again.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAdd = () => {
        setEditingEvent({
            id: crypto.randomUUID(),
            title: "",
            route: "",
            multiplier: 1,
            flightNumber: "",
            departureIcao: "",
            arrivalIcao: "",
            aircraft: "",
            signupUrl: "",
            pushbackIso: "",
            pushbackTime: "",
            promoted: false,
            banner: "",
            flightTime: "",
        });
        setTimeInputValue("");
        setIsAdding(true);
    };

    const handleEdit = (event) => {
        const editingEvent = { ...event };
        // If banner is already a URL, don't set bannerFile
        if (editingEvent.banner && editingEvent.banner.startsWith('http')) {
            delete editingEvent.bannerFile;
        }
        setEditingEvent(editingEvent);
        setIsAdding(false);
    };


    const handleDelete = async (index) => {
        const newEvents = events.filter((_, i) => i !== index);
        setEvents(newEvents);

        try {
            const response = await fetch("/api/crewcenter", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ moduleName, newValue: newEvents }),
            });

            if (response.ok) {
                console.log("Event deleted successfully");
            } else {
                const errorData = await response.json();
                console.error("Delete error:", errorData);
                alert(`Failed to delete event: ${errorData.error || "Unknown error"}`);
                // Revert the local state change if save failed
                setEvents(events);
            }
        } catch (error) {
            console.error("Failed to delete event:", error);
            alert("An unexpected error occurred during deletion. Please try again.");
            // Revert the local state change if save failed
            setEvents(events);
        }
    };


    const handlePromote = async (index) => {
        // Only allow promotion if the event is not already promoted
        if (events[ index ].promoted) {
            alert("This event is already promoted.");
            return;
        }

        const newEvents = events.map((event, i) => ({
            ...event,
            promoted: i === index, // Only the selected event gets promoted: true, all others: false
        }));
        setEvents(newEvents);

        try {
            const response = await fetch("/api/crewcenter", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ moduleName, newValue: newEvents }),
            });

            if (response.ok) {
                console.log("Event promoted successfully");
            } else {
                const errorData = await response.json();
                console.error("Promote error:", errorData);
                alert(`Failed to promote event: ${errorData.error || "Unknown error"}`);
                // Revert the local state change if save failed
                setEvents(events);
            }
        } catch (error) {
            console.error("Failed to promote event:", error);
            alert("An unexpected error occurred during promotion. Please try again.");
            // Revert the local state change if save failed
            setEvents(events);
        }
    };

    const handleModalSave = async () => {
        try {
            let eventToSave = { ...editingEvent };

            // Handle banner upload if a file is selected
            if (editingEvent.bannerFile) {
                const formData = new FormData();
                formData.append('file', editingEvent.bannerFile);

                const uploadResponse = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (uploadResponse.ok) {
                    const uploadData = await uploadResponse.json();
                    eventToSave.banner = uploadData.url;
                } else {
                    const errorData = await uploadResponse.json();
                    alert(`Failed to upload banner: ${errorData.error || "Unknown error"}`);
                    return;
                }
            }

            // Format pushbackIso with +5:30 suffix to indicate IST timezone
            if (eventToSave.pushbackIso) {
                try {
                    const date = new Date(eventToSave.pushbackIso);
                    if (!isNaN(date.getTime()) && date.getTime() > 0) {
                        // Input is already in IST, just format with +5:30 suffix
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        const seconds = String(date.getSeconds()).padStart(2, '0');
                        eventToSave.pushbackIso = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+5:30`;
                    } else {
                        console.warn('Invalid pushbackIso date:', eventToSave.pushbackIso);
                        // Don't block saving, just keep the original value
                    }
                } catch (error) {
                    console.warn('Error parsing pushbackIso date:', eventToSave.pushbackIso, error);
                    // Don't block saving, just keep the original value
                }
            }

            // Ensure promoted is a boolean
            eventToSave.promoted = Boolean(eventToSave.promoted);

            // Backfill id for legacy events that were created before this field existed
            if (!eventToSave.id) eventToSave.id = crypto.randomUUID();

            // Remove temporary fields
            delete eventToSave.bannerFile;

            // Update local state
            let updatedEvents;
            if (isAdding) {
                updatedEvents = [ ...events, eventToSave ];
                setEvents(updatedEvents);
            } else {
                const index = events.findIndex((e) => e.id === eventToSave.id || e === editingEvent);
                if (index !== -1) {
                    updatedEvents = [ ...events ];
                    updatedEvents[ index ] = eventToSave;
                    setEvents(updatedEvents);
                } else {
                    updatedEvents = events;
                }
            }

            // Auto-save to database
            const response = await fetch("/api/crewcenter", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ moduleName, newValue: updatedEvents }),
            });

            if (response.ok) {
                alert("Event saved successfully!");
            } else {
                const errorData = await response.json();
                alert(`Failed to save event: ${errorData.error || "Unknown error"}`);
            }

            setEditingEvent(null);
            setIsAdding(false);
        } catch (error) {
            console.error("Failed to save event:", error);
            alert("An unexpected error occurred during the save process. Please try again.");
        }
    };

    const handleCancel = () => {
        setEditingEvent(null);
        setIsAdding(false);
    };

    return (
        <Box>
            <HStack justify="space-between" mb={4}>
                <Text fontSize="lg" fontWeight="bold">
                    Events Management
                </Text>
                <Button onClick={handleAdd} colorPalette="blue">
                    Add New Event
                </Button>
            </HStack>
            <VStack spacing={4} align="stretch">
                {events.length === 0 ? (
                    <Card.Root p={4}>
                        <Text textAlign="center" color="gray.500">
                            No events found. Click "Add New Event" to create your first event.
                        </Text>
                    </Card.Root>
                ) : (
                    events.map((event, index) => (
                        <Card.Root key={index} p={4}>
                            <Stack spacing={2}>
                                <HStack justify="space-between">
                                    <Text fontWeight="bold">{event.title}</Text>
                                    {event.promoted && <Badge colorPalette="green">Promoted</Badge>}
                                </HStack>
                                <Text>Route: {event.route}</Text>
                                <Text>Multiplier: {event.multiplier}x</Text>
                                <Text>Flight Number: {event.flightNumber}</Text>
                                <Text>Departure: {event.departureIcao}</Text>
                                <Text>Arrival: {event.arrivalIcao}</Text>
                                <Text>Aircraft: {event.aircraft}</Text>
                                <Text>Signup URL: {event.signupUrl}</Text>
                                <Text>Flight Time: {event.flightTime ? `${event.flightTime} hours` : 'Not set'}</Text>
                                <Text>Banner: {event.banner ? (event.banner.startsWith('http') ? 'Uploaded' : event.banner) : 'None'}</Text>
                                <Text>Pushback: {event.pushbackTime || event.pushbackIso}</Text>
                                <HStack spacing={2}>
                                    <Button size="sm" onClick={() => handleEdit(event)}>
                                        Edit
                                    </Button>
                                    <Button size="sm" colorPalette="red" onClick={() => handleDelete(index)}>
                                        Delete
                                    </Button>
                                    <Button
                                        size="sm"
                                        colorPalette="green"
                                        onClick={() => handlePromote(index)}
                                        isDisabled={event.promoted}
                                    >
                                        Promote
                                    </Button>
                                    <Button
                                        size="sm"
                                        colorPalette="purple"
                                        onClick={() => setAllocatingEvent(event)}
                                    >
                                        Allocate Gates
                                    </Button>
                                </HStack>
                            </Stack>
                        </Card.Root>
                    ))
                )}
            </VStack>

            {editingEvent && (
                <Card.Root mt={4} p={4}>
                    <VStack spacing={4} align="stretch">
                        <Text fontSize="lg" fontWeight="bold">
                            {isAdding ? "Add New Event" : "Edit Event"}
                        </Text>
                        <Box>
                            <Text mb={2}>Title</Text>
                            <Input
                                value={editingEvent.title || ""}
                                onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                            />
                        </Box>
                        <Box>
                            <Text mb={2}>Route</Text>
                            <Input
                                value={editingEvent.route || ""}
                                onChange={(e) => setEditingEvent({ ...editingEvent, route: e.target.value })}
                            />
                        </Box>
                        <Box>
                            <Text mb={2}>Multiplier</Text>
                            <Input
                                type="number"
                                value={editingEvent.multiplier || 1}
                                onChange={(e) => setEditingEvent({ ...editingEvent, multiplier: parseFloat(e.target.value) })}
                            />
                        </Box>
                        <Box>
                            <Text mb={2}>Flight Number</Text>
                            <Input
                                value={editingEvent.flightNumber || ""}
                                onChange={(e) => setEditingEvent({ ...editingEvent, flightNumber: e.target.value })}
                            />
                        </Box>
                        <Box>
                            <Text mb={2}>Departure ICAO</Text>
                            <Input
                                value={editingEvent.departureIcao || ""}
                                onChange={(e) => setEditingEvent({ ...editingEvent, departureIcao: e.target.value })}
                            />
                        </Box>
                        <Box>
                            <Text mb={2}>Arrival ICAO</Text>
                            <Input
                                value={editingEvent.arrivalIcao || ""}
                                onChange={(e) => setEditingEvent({ ...editingEvent, arrivalIcao: e.target.value })}
                            />
                        </Box>
                        <Box>
                            <Text mb={2}>Aircraft</Text>
                            <Input
                                value={editingEvent.aircraft || ""}
                                onChange={(e) => setEditingEvent({ ...editingEvent, aircraft: e.target.value })}
                            />
                        </Box>
                        <Box>
                            <Text mb={2}>Signup URL</Text>
                            <Input
                                value={editingEvent.signupUrl || ""}
                                onChange={(e) => setEditingEvent({ ...editingEvent, signupUrl: e.target.value })}
                            />
                        </Box>
                        <Box>
                            <Text mb={2}>Flight Time (hours)</Text>
                            <Input
                                type="number"
                                step="0.1"
                                value={editingEvent.flightTime || ""}
                                onChange={(e) => setEditingEvent({ ...editingEvent, flightTime: parseFloat(e.target.value) || "" })}
                                placeholder="e.g. 2.4"
                            />
                        </Box>
                        <Box>
                            <Text mb={2}>Banner</Text>
                            <FileUpload.Root
                                accept="image/*"
                                maxFiles={1}
                                onFileAccept={(details) => {
                                    const file = details.files[ 0 ];
                                    setEditingEvent({ ...editingEvent, bannerFile: file, banner: file.name });
                                }}
                            >
                                <FileUpload.HiddenInput />
                                <FileUpload.Trigger asChild>
                                    <Button variant="outline" size="sm">
                                        Upload Banner Image
                                    </Button>
                                </FileUpload.Trigger>
                                <FileUpload.List />
                            </FileUpload.Root>
                        </Box>
                        <Box>
                            <Text mb={2}>Pushback Date</Text>
                            <Input
                                type="date"
                                value={editingEvent.pushbackIso ? editingEvent.pushbackIso.split('T')[ 0 ] : ""}
                                onChange={(e) => {
                                    const date = e.target.value;
                                    const time = editingEvent.pushbackIso ? editingEvent.pushbackIso.split('T')[ 1 ]?.split('.')[ 0 ] || "00:00:00" : "00:00:00";
                                    setEditingEvent({ ...editingEvent, pushbackIso: date ? `${date}T${time}` : "" });
                                }}
                            />
                        </Box>
                        <Box>
                            <Text mb={2}>Pushback Time</Text>
                            <Input
                                type="text"
                                placeholder="HH:MM AM/PM (e.g. 06:30 PM)"
                                value={timeInputValue}
                                onChange={(e) => {
                                    const timeInput = e.target.value.trim();
                                    setTimeInputValue(timeInput);

                                    if (timeInput === "") {
                                        // Allow clearing the field
                                        const date = editingEvent.pushbackIso ? editingEvent.pushbackIso.split('T')[ 0 ] : "";
                                        setEditingEvent({ ...editingEvent, pushbackIso: date ? `${date}T00:00:00` : "" });
                                        return;
                                    }

                                    // Match HH:MM AM/PM format
                                    const match = timeInput.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
                                    if (match) {
                                        let [ _, hoursStr, minutesStr, period ] = match;
                                        const hours = parseInt(hoursStr);
                                        const minutes = parseInt(minutesStr);

                                        if (hours >= 1 && hours <= 12 && minutes >= 0 && minutes <= 59) {
                                            // Convert to 24-hour format
                                            let hours24 = hours;
                                            if (period.toUpperCase() === 'PM' && hours !== 12) {
                                                hours24 = hours + 12;
                                            } else if (period.toUpperCase() === 'AM' && hours === 12) {
                                                hours24 = 0;
                                            }

                                            const time24 = `${hours24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
                                            const date = editingEvent.pushbackIso ? editingEvent.pushbackIso.split('T')[ 0 ] : "";
                                            setEditingEvent({ ...editingEvent, pushbackIso: `${date}T${time24}` });
                                        }
                                    }
                                    // If input doesn't match format, just update the display value (user is still typing)
                                }}
                            />
                        </Box>
                        <HStack spacing={2}>
                            <Button onClick={handleModalSave} colorPalette="blue">
                                Add to List
                            </Button>
                            <Button onClick={handleCancel} variant="outline">
                                Cancel
                            </Button>
                        </HStack>
                    </VStack>
                </Card.Root>
            )}

            <Button mt={4} onClick={handleSave} isLoading={isUpdating} loadingText="Updating...">
                Save Changes
            </Button>

            {allocatingEvent && (
                <GateAllocationDrawer
                    event={allocatingEvent}
                    onClose={() => setAllocatingEvent(null)}
                />
            )}
        </Box>
    );
}