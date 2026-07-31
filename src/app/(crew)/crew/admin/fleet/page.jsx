import { fetchFleetModule } from '../../pireps/file/fleetModule';
import { connection } from 'next/server';
import CrewPage from '@/components/crew-runtime/CrewPage';

export default async function FleetDatabasePage() {
    // Everything this page reads is cached, so the build would otherwise execute
    // the cached reads at build time (requiring a live DB on every deploy) to bake
    // them into the shell — content that sits below the auth-gated admin layout and
    // can never be served statically anyway. connection() keeps it request-time.
    await connection();

    let initialFleetData = '';
    try {
        initialFleetData = await fetchFleetModule('fleet');
    } catch (error) {
        console.error("Error fetching initial fleet data on server:", error);
        initialFleetData = 'Error loading fleet data.';
    }

    return <CrewPage id="admin-fleet" initialFleetData={initialFleetData} />;
}
