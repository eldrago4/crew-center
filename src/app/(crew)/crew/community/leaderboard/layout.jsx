import React from 'react';
import ResponsiveCrewLayout from "@/components/ResponsiveCrewLayout";

export default async function RootLayout({ children }) {
    const session = await auth();

    if (!session) {
        redirect('/crew');
    }

    const isAdmin = session.user.permissions?.length > 0 || false;

    return (
        <ResponsiveCrewLayout
            callsign={session.user.callsign}
            isAdmin={isAdmin}
        >
            {React.Children.map(children, child =>
                React.cloneElement(child, { session })
            )}
        </ResponsiveCrewLayout>
    );
}
