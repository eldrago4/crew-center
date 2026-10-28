"use client";

import {
    Badge,
    Box,
    Button,
    Card,
    Checkbox,
    HStack,
    Link,
    NativeSelect,
    SimpleGrid,
    Stack,
    Table,
    Text,
    Textarea,
    VStack,
} from "@chakra-ui/react";
import { useState, useTransition } from "react";
import { toaster } from "@/components/ui/toaster";
import {
    checkHealth,
    clearQuotaFlag,
    endMaintenance,
    getConsoleState,
    refreshCaches,
    startMaintenance,
    switchToStandby,
} from "@/app/(crew)/crew/admin/server-config/actions";
import { CACHE_GROUPS } from "@/app/(crew)/crew/admin/server-config/cache-groups";

const DURATIONS = [
    { value: 0, label: "Until I end it" },
    { value: 30, label: "30 minutes" },
    { value: 60, label: "1 hour" },
    { value: 120, label: "2 hours" },
    { value: 360, label: "6 hours" },
];

const when = (iso) =>
    iso ? new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

const minutesLeft = (ttl) => (ttl > 0 ? `${Math.ceil(ttl / 60)} min` : null);

function Section({ title, badge, children }) {
    return (
        <Card.Root p={{ base: 4, md: 5 }}>
            <VStack align="stretch" gap={4}>
                <HStack justify="space-between" wrap="wrap" gap={2}>
                    <Text fontWeight="semibold" fontSize="lg">{title}</Text>
                    {badge}
                </HStack>
                {children}
            </VStack>
        </Card.Root>
    );
}

function Row({ label, children }) {
    return (
        <HStack justify="space-between" align="start" gap={4}>
            <Text fontSize="sm" color="fg.muted" flexShrink={0}>{label}</Text>
            <Box fontSize="sm" textAlign="right">{children}</Box>
        </HStack>
    );
}

export default function ServerConsole({ initialState, deployment, standbyConfigured }) {
    const [state, setState] = useState(initialState);
    const [pending, startTransition] = useTransition();
    const [busy, setBusy] = useState(null);
    const [message, setMessage] = useState("");
    const [minutes, setMinutes] = useState(0);
    const [cacheGroups, setCacheGroups] = useState([]);
    const [health, setHealth] = useState(null);

    // Runs an action, reports it, and re-reads the console state so every panel
    // reflects what the action actually changed.
    const run = (key, action, success, { reload = true } = {}) => {
        setBusy(key);
        startTransition(async () => {
            const result = await action();
            if (result?.ok) {
                if (success) toaster.create({ type: "success", title: success });
                if (reload) {
                    try {
                        setState(await getConsoleState());
                    } catch {
                        // keep showing the last state we had
                    }
                }
            } else {
                toaster.create({ type: "error", title: result?.error ?? "Something went wrong." });
            }
            setBusy(null);
            return result;
        });
    };

    const forced = deployment.maintenanceEnv;
    const manual = state.maintenance;
    const maintenanceOn = forced || manual || state.quota;
    const onStandby = Boolean(state.dbMode);

    const maintenanceBadge = (
        <Badge colorPalette={maintenanceOn ? "orange" : "green"} size="lg">
            {maintenanceOn ? "Crew center offline" : "Crew center online"}
        </Badge>
    );

    return (
        <Stack gap={5}>
            {!state.redis && (
                <Card.Root p={4} borderColor="red.500" borderWidth="1px">
                    <Text color="red.500">Redis is not configured, so these controls can't take effect.</Text>
                </Card.Root>
            )}

            <SimpleGrid columns={{ base: 1, xl: 2 }} gap={5} alignItems="start">
                <Section title="Maintenance" badge={maintenanceBadge}>
                    {forced && (
                        <Text fontSize="sm">
                            Forced on by <code>MAINTENANCE_MODE=1</code> in the Vercel environment. Remove it and redeploy to reopen.
                        </Text>
                    )}

                    {state.quota && (
                        <HStack justify="space-between" wrap="wrap" gap={3}>
                            <Text fontSize="sm">
                                Neon quota exceeded — offline automatically
                                {minutesLeft(state.quotaTtl) ? `, rechecks in ${minutesLeft(state.quotaTtl)}` : ""}.
                            </Text>
                            <Button
                                size="sm"
                                variant="outline"
                                loading={busy === "quota"}
                                disabled={pending}
                                onClick={() => run("quota", clearQuotaFlag, "Quota flag cleared")}
                            >
                                Clear now
                            </Button>
                        </HStack>
                    )}

                    {manual ? (
                        <VStack align="stretch" gap={3}>
                            <Row label="Started">{when(manual.at)} by {manual.by}</Row>
                            <Row label="Ends">
                                {manual.until ? `${when(manual.until)} (${minutesLeft(state.maintenanceTtl) ?? "now"})` : "When ended here"}
                            </Row>
                            {manual.message && <Row label="Note to pilots">{manual.message}</Row>}
                            <Button
                                colorPalette="green"
                                alignSelf="flex-start"
                                loading={busy === "end"}
                                disabled={pending}
                                onClick={() => run("end", endMaintenance, "Crew center is back online")}
                            >
                                End maintenance
                            </Button>
                        </VStack>
                    ) : (
                        <VStack align="stretch" gap={3}>
                            <Box>
                                <Text mb={2} fontSize="sm" fontWeight="medium">Note to pilots</Text>
                                <Textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    maxLength={300}
                                    placeholder="Optional — e.g. Migrating the logbook, PIREPs filed before 18:00 are safe."
                                />
                            </Box>
                            <Box>
                                <Text mb={2} fontSize="sm" fontWeight="medium">End automatically</Text>
                                <NativeSelect.Root>
                                    <NativeSelect.Field value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
                                        {DURATIONS.map((d) => (
                                            <option key={d.value} value={d.value}>{d.label}</option>
                                        ))}
                                    </NativeSelect.Field>
                                    <NativeSelect.Indicator />
                                </NativeSelect.Root>
                            </Box>
                            <Button
                                colorPalette="orange"
                                alignSelf="flex-start"
                                loading={busy === "start"}
                                disabled={pending}
                                onClick={() => {
                                    if (!window.confirm("Take the crew center offline for everyone except CEOs?")) return;
                                    run("start", async () => {
                                        const result = await startMaintenance({ message, minutes });
                                        if (result?.ok) setMessage("");
                                        return result;
                                    }, "Crew center is offline");
                                }}
                            >
                                Start maintenance
                            </Button>
                        </VStack>
                    )}
                    {maintenanceOn && (
                        <Text fontSize="xs" color="fg.muted">You can still use the whole crew center as CEO.</Text>
                    )}
                </Section>

                <Section
                    title="Database"
                    badge={
                        <Badge colorPalette={onStandby ? "orange" : "green"} size="lg">
                            {onStandby ? "Serving from Supabase" : "Serving from Neon"}
                        </Badge>
                    }
                >
                    {onStandby && (
                        <VStack align="stretch" gap={2}>
                            <Row label="Since">{when(state.dbMode.since)}</Row>
                            <Row label="Reason">{state.dbMode.reason}</Row>
                            <Text fontSize="xs" color="fg.muted">
                                Moves back to Neon by itself within 15 minutes of Neon recovering.
                            </Text>
                        </VStack>
                    )}

                    {health && (
                        <Table.Root size="sm">
                            <Table.Body>
                                {[
                                    ["Neon", health.neon],
                                    ["Supabase standby", health.standby],
                                    ["Redis", health.redis],
                                ].filter(([, r]) => r).map(([name, r]) => (
                                    <Table.Row key={name}>
                                        <Table.Cell>{name}</Table.Cell>
                                        <Table.Cell>
                                            <Badge colorPalette={r.ok ? "green" : "red"}>{r.ok ? `${r.ms} ms` : "Down"}</Badge>
                                        </Table.Cell>
                                        <Table.Cell color="fg.muted" fontSize="xs">
                                            {r.ok
                                                ? r.detail
                                                    ? `Last sync ${when(r.detail.last_sync)} · ${r.detail.unmerged} unmerged writes`
                                                    : ""
                                                : r.error}
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    )}

                    <HStack wrap="wrap" gap={3}>
                        <Button
                            variant="outline"
                            loading={busy === "health"}
                            disabled={pending}
                            onClick={() => {
                                setBusy("health");
                                startTransition(async () => {
                                    const result = await checkHealth();
                                    if (result?.ok) setHealth(result);
                                    else toaster.create({ type: "error", title: result?.error ?? "Health check failed." });
                                    setBusy(null);
                                });
                            }}
                        >
                            Check health
                        </Button>
                        {standbyConfigured && !onStandby && (
                            <Button
                                variant="outline"
                                colorPalette="orange"
                                loading={busy === "standby"}
                                disabled={pending}
                                onClick={() => {
                                    if (!window.confirm("Move all database traffic to the Supabase standby now?")) return;
                                    run("standby", switchToStandby, "Switched to the Supabase standby");
                                }}
                            >
                                Switch to Supabase
                            </Button>
                        )}
                    </HStack>
                    {!standbyConfigured && (
                        <Text fontSize="xs" color="fg.muted">No Supabase standby configured.</Text>
                    )}
                </Section>

                <Section title="Caches">
                    <Text fontSize="sm" color="fg.muted">
                        For after editing data directly in the database.
                    </Text>
                    <VStack align="stretch" gap={2}>
                        {CACHE_GROUPS.map((g) => (
                            <Checkbox.Root
                                key={g.id}
                                checked={cacheGroups.includes(g.id)}
                                onCheckedChange={(e) =>
                                    setCacheGroups((prev) => (e.checked ? [...prev, g.id] : prev.filter((id) => id !== g.id)))
                                }
                            >
                                <Checkbox.HiddenInput />
                                <Checkbox.Control />
                                <Checkbox.Label>{g.label}</Checkbox.Label>
                            </Checkbox.Root>
                        ))}
                    </VStack>
                    <HStack gap={3}>
                        <Button
                            variant="outline"
                            loading={busy === "cache"}
                            disabled={pending || !cacheGroups.length}
                            onClick={() =>
                                run("cache", async () => {
                                    const result = await refreshCaches(cacheGroups);
                                    if (result?.ok) setCacheGroups([]);
                                    return result;
                                }, "Caches refreshed")
                            }
                        >
                            Refresh selected
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={pending}
                            onClick={() => setCacheGroups(CACHE_GROUPS.map((g) => g.id))}
                        >
                            Select all
                        </Button>
                    </HStack>
                </Section>

                <Section title="Deployment">
                    <VStack align="stretch" gap={2}>
                        <Row label="Environment">{deployment.env}</Row>
                        <Row label="Region">{deployment.region}</Row>
                        <Row label="Commit">
                            {deployment.commitUrl ? (
                                <Link href={deployment.commitUrl} target="_blank" rel="noreferrer" colorPalette="blue">
                                    {deployment.commit}
                                </Link>
                            ) : (
                                deployment.commit
                            )}
                            {deployment.commitMessage && (
                                <Text color="fg.muted" fontSize="xs" lineClamp={2}>{deployment.commitMessage}</Text>
                            )}
                        </Row>
                        <Row label="Runtime">Next.js {deployment.next} · Node {deployment.node}</Row>
                    </VStack>
                </Section>
            </SimpleGrid>

        </Stack>
    );
}
