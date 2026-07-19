"use client";

import { useEffect, useState } from 'react';
import { PirepForm } from './PirepForm';

export function FreshPirepForm({ userId, session, initialAircraft, initialOperators, initialMultipliers, initialIfatcMultipliers }) {
    const [ refreshKey, setRefreshKey ] = useState(0);
    const [ multipliers, setMultipliers ] = useState(initialMultipliers);

    useEffect(() => {
        const refreshMultipliers = async () => {
            try {
                const response = await fetch('/api/crewcenter?moduleName=multipliers', {
                    cache: 'no-cache',
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                });

                if (response.ok) {
                    const freshMultipliers = await response.json();
                    setMultipliers(freshMultipliers);
                    setRefreshKey(prev => prev + 1); // Force component re-render
                }
            } catch (error) {
                console.error('Error refreshing multipliers:', error);
            }
        };

        refreshMultipliers();
    }, [ initialMultipliers ]);

    return (
        <div key={refreshKey}>
            <PirepForm
                userId={userId}
                session={session}
                initialAircraft={initialAircraft}
                initialOperators={initialOperators}
                initialMultipliers={multipliers}
                initialIfatcMultipliers={initialIfatcMultipliers}
                cacheTimestamp={refreshKey}
            />
        </div>
    );
}
