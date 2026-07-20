"use client";

import { PirepForm } from './PirepForm';

// The server (pireps/file/page.jsx) already reads the crewcenter multipliers module
// through fleetModule's 5-minute cache and passes it as initialMultipliers, so this
// wrapper just forwards its props. It used to re-fetch /api/crewcenter?moduleName=
// multipliers on mount with cache:'no-cache' — one guaranteed uncacheable function
// invocation per page view (~920/12h) that also defeated the route's edge cache and
// discarded the server work. Admin multiplier edits still propagate within 5 minutes
// via the fleetModule cache (instantly on the editing instance).
export function FreshPirepForm({ userId, session, initialAircraft, initialOperators, initialMultipliers, initialIfatcMultipliers }) {
    return (
        <PirepForm
            userId={userId}
            session={session}
            initialAircraft={initialAircraft}
            initialOperators={initialOperators}
            initialMultipliers={initialMultipliers}
            initialIfatcMultipliers={initialIfatcMultipliers}
            cacheTimestamp={0}
        />
    );
}
