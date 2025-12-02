"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, Spinner, Center, Box, Button, HStack, Text } from "@chakra-ui/react";
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
    const [ pagination, setPagination ] = useState({
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 1
    });
    const [ error, setError ] = useState(null);

    const fetchPireps = useCallback(async (valid, page = 1) => {
        setLoading(true);
        setError(null);
        try {
            const url = `/api/users/pireps?valid=${valid}&page=${page}&pageSize=${pagination.pageSize}`;
            const res = await fetch(url, { cache: "no-store" });
            if (!res.ok) throw new Error("Failed to fetch PIREPs");
            const data = await res.json();
            setPireps(data.data || []);
            setPagination({
                page: data.page || 1,
                pageSize: data.pageSize || 20,
                total: data.total || 0,
                totalPages: data.totalPages || 1
            });
        } catch (err) {
            setError(err.message);
            setPireps([]);
            setPagination({
                page: 1,
                pageSize: 20,
                total: 0,
                totalPages: 1
            });
        } finally {
            setLoading(false);
        }
    }, [ pagination.pageSize ]);

    useEffect(() => {
        fetchPireps(tabToValid[ tab ], 1);
    }, [ tab, fetchPireps ]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchPireps(tabToValid[ tab ], newPage);
        }
    };

    const renderPagination = () => {
        if (pagination.totalPages <= 1) return null;

        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, pagination.page - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <Button
                    key={i}
                    size="sm"
                    variant={i === pagination.page ? "solid" : "outline"}
                    colorPalette="purple"
                    onClick={() => handlePageChange(i)}
                >
                    {i}
                </Button>
            );
        }

        return (
            <HStack spacing={2} justify="center" mt={4}>
                <Button
                    size="sm"
                    variant="outline"
                    colorPalette="purple"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                >
                    Previous
                </Button>
                {pages}
                <Button
                    size="sm"
                    variant="outline"
                    colorPalette="purple"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                >
                    Next
                </Button>
            </HStack>
        );
    };

    return (
        <Tabs.Root
            defaultValue="pending"
            value={tab}
            onValueChange={(e) => {
                setTab(e.value);
                setPagination(prev => ({ ...prev, page: 1 }));
            }}
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
                    <>
                        <AdminPirepsTable pireps={pireps} />
                        <Box textAlign="center" mt={4}>
                            <Text fontSize="sm" color="gray.600" mb={2}>
                                Showing {(pagination.page - 1) * pagination.pageSize + 1}-{(pagination.page - 1) * pagination.pageSize + pireps.length} of {pagination.total} PIREPs
                            </Text>
                            {renderPagination()}
                        </Box>
                    </>
                )}
            </Tabs.Content>
        </Tabs.Root>
    );
}
