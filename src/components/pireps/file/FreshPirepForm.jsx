"use client";

import { useEffect, useState } from 'react';
import { PirepForm } from './PirepForm';

export function FreshPirepForm({ userId, session, initialAircraft, initialOperators, initialMultipliers, initialIfatcMultipliers }) {
    const [ refreshKey, setRefreshKey ] = useState(0);
    const [ multipliers, setMultipliers ] = useState(initialMultipliers);

    useEffect(() => {
        const refreshMultipliers = async () => {
            try {
                console.log('[FRESH FORM] Fetching fresh multipliers...');
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
                    console.log('[FRESH FORM] Fresh multipliers received:', freshMultipliers);
                    setMultipliers(freshMultipliers);
                    setRefreshKey(prev => prev + 1); // Force component re-render
                } else {
                    console.error('[FRESH FORM] Failed to fetch fresh multipliers');
                }
            } catch (error) {
                console.error('[FRESH FORM] Error fetching multipliers:', error);
            }
        };

        refreshMultipliers();
    }, [ initialMultipliers ]);

    console.log('[FRESH FORM] Rendering with refreshKey:', refreshKey);
    console.log('[FRESH FORM] Using multipliers:', multipliers);

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
