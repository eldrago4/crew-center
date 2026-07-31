import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from "@/auth";
import CrewChrome from '@/components/crew-runtime/CrewChrome';

export default async function GatesLayout({ children }) {
    const session = await auth();

    if (!session) {
        redirect('/crew');
    }

    const isAdmin = session.user.permissions?.length > 0 || false;

    return (
        <CrewChrome
            callsign={session.user.callsign}
            isAdmin={isAdmin}
            showSidebar={false}
        >
            {React.Children.map(children, child =>
                React.cloneElement(child, { session })
            )}
        </CrewChrome>
    );
}
