"use client";

import { Tabs } from "@chakra-ui/react";
import { LuClock, LuXCircle, LuCheckCircle } from "react-icons/lu";
import AdminPirepsTable from "@/components/admin/AdminPirepsTable";

export default function PirepsTabs({ data, onActionSuccess }) {
    // data: array of all PIREPs
    // onActionSuccess: callback for approve/reject
    const pending = data.filter((p) => p.valid === null);
    const rejected = data.filter((p) => p.valid === false);
    const accepted = data.filter((p) => p.valid === true);

    return (
        <Tabs.Root defaultValue="pending" variant="enclosed" colorPalette="purple">
            <Tabs.List mb={4}>
                <Tabs.Trigger value="pending">
                    <LuClock style={{ marginRight: 6 }} /> Pending
                </Tabs.Trigger>
                <Tabs.Trigger value="rejected">
                    <LuXCircle style={{ marginRight: 6 }} /> Rejected
                </Tabs.Trigger>
                <Tabs.Trigger value="accepted">
                    <LuCheckCircle style={{ marginRight: 6 }} /> Accepted
                </Tabs.Trigger>
                <Tabs.Indicator rounded="l2" />
            </Tabs.List>
            <Tabs.Content value="pending">
                <AdminPirepsTable pireps={pending} onPirepActionSuccess={onActionSuccess} />
            </Tabs.Content>
            <Tabs.Content value="rejected">
                <AdminPirepsTable pireps={rejected} onPirepActionSuccess={onActionSuccess} />
            </Tabs.Content>
            <Tabs.Content value="accepted">
                <AdminPirepsTable pireps={accepted} onPirepActionSuccess={onActionSuccess} />
            </Tabs.Content>
        </Tabs.Root>
    );
}
