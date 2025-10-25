const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');
const { crewcenter } = require('./src/db/schema.ts');
const { eq } = require('drizzle-orm');

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema: { crewcenter } });

async function troubleshootFleet() {
    try {
        console.log('Fetching fleet module data...');
        const result = await db.select().from(crewcenter).where(eq(crewcenter.module, 'fleet'));
        if (result.length === 0) {
            console.log('No fleet module found in DB.');
            return;
        }
        const fleetData = result[ 0 ].value;
        console.log('Raw fleet data from DB:', JSON.stringify(fleetData, null, 2));

        if (!Array.isArray(fleetData)) {
            console.log('Fleet data is not an array!');
            return;
        }

        console.log('Fleet data length:', fleetData.length);
        fleetData.forEach((aircraft, index) => {
            console.log(`Aircraft ${index}:`, JSON.stringify(aircraft, null, 2));
            if (!aircraft || typeof aircraft !== 'object') {
                console.log(`  - Invalid aircraft object at index ${index}`);
            } else if (!aircraft.icao) {
                console.log(`  - Missing icao for aircraft at index ${index}`);
            } else {
                console.log(`  - ICAO: ${aircraft.icao}`);
            }
        });

        // Simulate aircraftOptions creation
        const aircraftOptions = fleetData.map(ac => ({
            label: ac.icao,
            value: ac.icao
        }));
        console.log('Aircraft options:', JSON.stringify(aircraftOptions, null, 2));

        // Check for undefined values
        aircraftOptions.forEach((opt, idx) => {
            if (opt.value === undefined) {
                console.log(`Undefined value at index ${idx}`);
            }
        });

        // Simulate the URL param issue
        const urlAircraft = 'Cessna 208 Caravan (FedEx)';
        console.log(`Testing URL aircraft: "${urlAircraft}"`);
        const exactMatch = aircraftOptions.find(ac =>
            ac.value && ac.value.toLowerCase() === urlAircraft.toLowerCase()
        );
        console.log('Exact match found:', exactMatch);

        if (!exactMatch) {
            const partialMatch = aircraftOptions.find(ac =>
                ac.value && ac.value.toLowerCase().includes(urlAircraft.toLowerCase())
            );
            console.log('Partial match found:', partialMatch);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

troubleshootFleet();
