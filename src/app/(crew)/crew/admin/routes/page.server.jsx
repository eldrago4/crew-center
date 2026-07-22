
import { fetchFleetModule } from '@/app/(crew)/crew/pireps/file/fleetModule.js';
import AdminRoutesClient from './RoutesClientRSC';
import { connection } from 'next/server';

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

    return (
            <AdminRoutesClient initialFleet={fleetData} />
    );
}
