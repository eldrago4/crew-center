"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, Spinner, Center, Box } from "@chakra-ui/react";
import { RxArchive, RxCrossCircled, RxCheckCircled } from "react-icons/rx";
import AdminPirepsTable from "@/components/admin/AdminPirepsTable";

const tabToValid = {
    pending: "null",
    rejected: "false",
    accepted: "true",
};

export default function PirepsTabsClient() {
    const [ tab, setTab ] = useState("pending");
    const [ loading, setLoading ] = useState(false);
    const [ pireps, setPireps ] = useState([]);
    const [ error, setError ] = useState(null);

    const fetchPireps = useCallback(async (valid) => {
        setLoading(true);
        setError(null);
        try {
            const url = `/api/users/pireps?valid=${valid}`;
            const res = await fetch(url, { cache: "no-store" });
            if (!res.ok) throw new Error("Failed to fetch PIREPs");
            const data = await res.json();
            setPireps(data.data || []);
        } catch (err) {
            setError(err.message);
            setPireps([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPireps(tabToValid[ tab ]);
    }, [ tab, fetchPireps ]);

    return (
        <Tabs.Root
            defaultValue="pending"
            value={tab}
            onValueChange={(e) => setTab(e.value)}
            variant="enclosed"
            colorPalette="purple"
        >
            <Tabs.List mb={4}>
                <Tabs.Trigger value="pending">
                    <RxArchive style={{ marginRight: 6 }} /> Pending
                </Tabs.Trigger>
                <Tabs.Trigger value="rejected">
                    <RxCrossCircled style={{ marginRight: 6 }} /> Rejected
                </Tabs.Trigger>
                <Tabs.Trigger value="accepted">
                    <RxCheckCircled style={{ marginRight: 6 }} /> Accepted
                </Tabs.Trigger>
                <Tabs.Indicator rounded="l2" />
            </Tabs.List>
            <Tabs.Content value={tab}>
                {loading ? (
                    <Center py={10}>
                        <Spinner size="xl" color="purple.500" thickness="4px" />
                    </Center>
                ) : error ? (
                    <Box color="red.500" textAlign="center" py={10}>
                        {error}
                    </Box>
                ) : (
                    <AdminPirepsTable pireps={pireps} />
                )}
            </Tabs.Content>
        </Tabs.Root>
    );
}
