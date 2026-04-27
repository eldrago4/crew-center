
import { fetchFleetModule } from '@/app/(crew)/crew/pireps/file/fleetModule.js';
import AdminRoutesClient from './RoutesClientRSC';

export default async function AdminRoutesPageRSC() {

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
