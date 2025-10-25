import db from './src/db/client.js';
import { crewcenter } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

async function checkFleetDB() {
    try {
        console.log('Checking fleet data in database...');
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

        console.log(`Fleet array has ${fleetData.length} items`);

        // Check each item
        fleetData.forEach((item, index) => {
            console.log(`Item ${index}:`, typeof item, item);
            if (typeof item === 'object' && item !== null) {
                console.log(`  Keys:`, Object.keys(item));
                if (item.icao) {
                    console.log(`  ICAO: ${item.icao}`);
                } else {
                    console.log(`  No ICAO property`);
                }
            }
        });

    } catch (error) {
        console.error('Error:', error.message);
        console.log('Make sure DATABASE_URL environment variable is set');
    } finally {
        process.exit(0);
    }
}

checkFleetDB();
