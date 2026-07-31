
import { fetchFleetModule } from '@/app/(crew)/crew/pireps/file/fleetModule.js';
import { connection } from 'next/server';
import CrewPage from '@/components/crew-runtime/CrewPage';

export default async function AdminRoutesPageRSC() {
    // Cached-read-only page below the auth-gated admin layout: connection() keeps
    // it request-time instead of executing the cached read at build.
    await connection();

    let fleetData = [];
    try {
        fleetData = await fetchFleetModule('fleet');
    } catch (e) {
        fleetData = [{"icao": "error", "airframe": ""}];
    }

    return <CrewPage id="admin-routes" initialFleet={fleetData} />;
}
