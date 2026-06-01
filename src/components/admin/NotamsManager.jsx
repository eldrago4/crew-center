"use client";

import {
    Badge,
    Box,
    Button,
    Card,
    HStack,
    Input,
    SimpleGrid,
    Stack,
    Text,
    Textarea,
    VStack,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";

function toDateTimeLocalValue(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return offsetDate.toISOString().slice(0, 16);
}

function formatDisplayDate(value) {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function isExpired(value) {
    if (!value) return false;
    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && date < new Date();
}

function createEmptyForm() {
    return {
        originalIssued: null,
        issued: toDateTimeLocalValue(new Date().toISOString()),
        expiresOn: "",
        desc: "",
    };
}

export default function NotamsManager({ initialNotams = [] }) {
    const [notams, setNotams] = useState(Array.isArray(initialNotams) ? initialNotams : []);
    const [form, setForm] = useState(createEmptyForm);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingIssued, setDeletingIssued] = useState(null);

    const sortedNotams = useMemo(() => {
        return [...notams].sort((a, b) => new Date(b.issued) - new Date(a.issued));
    }, [notams]);

    const updateForm = (field, value) => {
        setForm(current => ({ ...current, [field]: value }));
    };

    const resetForm = () => {
        setForm(createEmptyForm());
        setEditing(false);
    };

    const handleEdit = (notam) => {
        setForm({
            originalIssued: notam.issued,
            issued: toDateTimeLocalValue(notam.issued),
            expiresOn: toDateTimeLocalValue(notam.expiresOn),
            desc: notam.desc || "",
        });
        setEditing(true);
    };

    const handleSave = async () => {
        if (!form.desc.trim()) {
            alert("Notice text is required.");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                originalIssued: form.originalIssued,
                issued: form.issued ? new Date(form.issued).toISOString() : new Date().toISOString(),
                expiresOn: form.expiresOn ? new Date(form.expiresOn).toISOString() : null,
                desc: form.desc.trim(),
            };

            const response = await fetch("/api/notams", {
                method: editing ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error || "Failed to save NOTAM");
            }

            setNotams(current => {
                if (editing) {
                    return current.map(item => item.issued === form.originalIssued ? data : item);
                }
                return [data, ...current];
            });
            resetForm();
        } catch (error) {
            alert(error.message || "Failed to save NOTAM.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (notam) => {
        if (!confirm("Delete this NOTAM?")) return;

        setDeletingIssued(notam.issued);
        try {
            const response = await fetch("/api/notams", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ issued: notam.issued }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error || "Failed to delete NOTAM");
            }

            setNotams(current => current.filter(item => item.issued !== notam.issued));
            if (form.originalIssued === notam.issued) resetForm();
        } catch (error) {
            alert(error.message || "Failed to delete NOTAM.");
        } finally {
            setDeletingIssued(null);
        }
    };

    return (
        <Box>
            <HStack justify="space-between" align="flex-start" mb={4} gap={4}>
                <Box>
                    <Text fontSize="lg" fontWeight="bold">
                        NOTAM Management
                    </Text>
                    <Text fontSize="sm" color="fg.muted">
                        Publish operational notices shown on the crew dashboard. Leave valid-until blank for ongoing advisories.
                    </Text>
                </Box>
                {editing && (
                    <Button size="sm" variant="outline" onClick={resetForm}>
                        New NOTAM
                    </Button>
                )}
            </HStack>

            <SimpleGrid columns={{ base: 1, xl: 2 }} gap={5} alignItems="start">
                <Card.Root p={4}>
                    <VStack spacing={4} align="stretch">
                        <Text fontWeight="semibold">{editing ? "Edit NOTAM" : "Add NOTAM"}</Text>

                        <Box>
                            <Text mb={2} fontSize="sm" fontWeight="medium">Issued</Text>
                            <Input
                                type="datetime-local"
                                value={form.issued}
                                onChange={(e) => updateForm("issued", e.target.value)}
                            />
                        </Box>

                        <Box>
                            <Text mb={2} fontSize="sm" fontWeight="medium">Valid until</Text>
                            <Input
                                type="datetime-local"
                                value={form.expiresOn}
                                onChange={(e) => updateForm("expiresOn", e.target.value)}
                            />
                            <Text mt={1} fontSize="xs" color="fg.muted">
                                Optional. Blank means no expiry date is available.
                            </Text>
                        </Box>

                        <Box>
                            <Text mb={2} fontSize="sm" fontWeight="medium">Notice</Text>
                            <Textarea
                                minH="140px"
                                value={form.desc}
                                onChange={(e) => updateForm("desc", e.target.value)}
                                placeholder="Runway closure, event procedure, airspace advisory..."
                            />
                        </Box>

                        <HStack>
                            <Button colorPalette="blue" onClick={handleSave} loading={saving} disabled={saving}>
                                {editing ? "Save NOTAM" : "Publish NOTAM"}
                            </Button>
                            <Button variant="outline" onClick={resetForm} disabled={saving}>
                                Clear
                            </Button>
                        </HStack>
                    </VStack>
                </Card.Root>

                <VStack spacing={3} align="stretch">
                    {sortedNotams.length === 0 ? (
                        <Card.Root p={4}>
                            <Text textAlign="center" color="fg.muted">
                                No NOTAMs found. Publish one to show it on the dashboard.
                            </Text>
                        </Card.Root>
                    ) : (
                        sortedNotams.map((notam) => {
                            const expired = isExpired(notam.expiresOn);

                            return (
                                <Card.Root key={notam.issued} p={4}>
                                    <Stack spacing={3}>
                                        <HStack justify="space-between" align="flex-start" gap={3}>
                                            <Box>
                                                <HStack mb={1}>
                                                    <Badge colorPalette={expired ? "red" : "green"}>
                                                        {expired ? "Expired" : "Active"}
                                                    </Badge>
                                                    {!notam.expiresOn && <Badge colorPalette="gray">No expiry</Badge>}
                                                </HStack>
                                                <Text fontSize="xs" color="fg.muted">
                                                    Issued {formatDisplayDate(notam.issued)}
                                                </Text>
                                                <Text fontSize="xs" color="fg.muted">
                                                    Valid until {formatDisplayDate(notam.expiresOn)}
                                                </Text>
                                            </Box>
                                            <HStack>
                                                <Button size="sm" variant="outline" onClick={() => handleEdit(notam)}>
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    colorPalette="red"
                                                    onClick={() => handleDelete(notam)}
                                                    loading={deletingIssued === notam.issued}
                                                    disabled={deletingIssued === notam.issued}
                                                >
                                                    Delete
                                                </Button>
                                            </HStack>
                                        </HStack>
                                        <Text whiteSpace="pre-wrap" color="fg">
                                            {notam.desc}
                                        </Text>
                                    </Stack>
                                </Card.Root>
                            );
                        })
                    )}
                </VStack>
            </SimpleGrid>
        </Box>
    );
}
