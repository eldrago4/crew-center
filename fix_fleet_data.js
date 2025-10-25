// Script to fix the corrupted fleet data in the database
// This script will update the fleet module with proper aircraft data

const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');
const { crewcenter } = require('./src/db/schema.ts');
const { eq } = require('drizzle-orm');

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema: { crewcenter } });

// Correct fleet data format based on user feedback
const properFleetData = [
    { "label": "A318", "value": "A318" },
    { "label": "A319", "value": "A319" },
    { "label": "A320", "value": "A320" },
    { "label": "A321", "value": "A321" },
    { "label": "A220-300", "value": "A220-300" },
    { "label": "A333", "value": "A333" },
    { "label": "A339", "value": "A339" },
    { "label": "A359", "value": "A359" },
    { "label": "A388", "value": "A388" },
    { "label": "Boeing 737-700", "value": "Boeing 737-700" },
    { "label": "Boeing 737-800", "value": "Boeing 737-800" },
    { "label": "Boeing 737-900", "value": "Boeing 737-900" },
    { "label": "Boeing 737MAX", "value": "Boeing 737MAX" },
    { "label": "Boeing 747-400", "value": "Boeing 747-400" },
    { "label": "Boeing 747-8", "value": "Boeing 747-8" },
    { "label": "Boeing 757-200", "value": "Boeing 757-200" },
    { "label": "Boeing 767-300", "value": "Boeing 767-300" },
    { "label": "Boeing 767-300ER", "value": "Boeing 767-300ER" },
    { "label": "Boeing 777-200ER", "value": "Boeing 777-200ER" },
    { "label": "Boeing 777-200LR", "value": "Boeing 777-200LR" },
    { "label": "Boeing 777-300ER", "value": "Boeing 777-300ER" },
    { "label": "Boeing 777F", "value": "Boeing 777F" },
    { "label": "Boeing 787-8", "value": "Boeing 787-8" },
    { "label": "Boeing 787-9", "value": "Boeing 787-9" },
    { "label": "Boeing 787-10", "value": "Boeing 787-10" },
    { "label": "Bombardier Dash 8 Q-400", "value": "Bombardier Dash 8 Q-400" },
    { "label": "CRJ-700", "value": "CRJ-700" },
    { "label": "CRJ-900", "value": "CRJ-900" },
    { "label": "CRJ-1000", "value": "CRJ-1000" },
    { "label": "DC-10", "value": "DC-10" },
    { "label": "DC-10F", "value": "DC-10F" },
    { "label": "E175", "value": "E175" },
    { "label": "E190", "value": "E190" },
    { "label": "MD-11", "value": "MD-11" },
    { "label": "MD-11F", "value": "MD-11F" },
    { "label": "TBM-930", "value": "TBM-930" }
];

async function fixFleetData() {
    try {
        console.log('Checking current fleet data...');
        const result = await db.select().from(crewcenter).where(eq(crewcenter.module, 'fleet'));

        if (result.length === 0) {
            console.log('No fleet module found. Creating new one...');
            await db.insert(crewcenter).values({
                module: 'fleet',
                value: properFleetData
            });
            console.log('Fleet module created with proper data.');
        } else {
            const currentData = result[ 0 ].value;
            console.log('Current fleet data:', JSON.stringify(currentData, null, 2));

            if (!Array.isArray(currentData) || currentData.length === 0 || currentData.every(item => !item.value)) {
                console.log('Fleet data is corrupted. Updating with proper data...');
                await db.update(crewcenter)
                    .set({ value: properFleetData })
                    .where(eq(crewcenter.module, 'fleet'));
                console.log('Fleet data updated successfully.');
            } else {
                console.log('Fleet data appears to be valid. No changes needed.');
            }
        }

        // Verify the fix
        const verifyResult = await db.select().from(crewcenter).where(eq(crewcenter.module, 'fleet'));
        const verifyData = verifyResult[ 0 ].value;
        console.log('Verified fleet data:', JSON.stringify(verifyData, null, 2));

        // Test the aircraft options creation (as done in PirepForm.jsx)
        const aircraftOptions = verifyData.map(opt => typeof opt === 'string' ? { label: opt, value: opt } : opt);
        console.log('Aircraft options length:', aircraftOptions.length);
        console.log('First few aircraft options:', JSON.stringify(aircraftOptions.slice(0, 5), null, 2));

        // Test URL matching logic from PirepForm.jsx
        const testAircraft = 'Cessna 208 Caravan (FedEx)';
        console.log(`Testing URL aircraft matching for: "${testAircraft}"`);

        const exactMatch = aircraftOptions.find(ac =>
            ac.value && ac.value.toLowerCase() === testAircraft.toLowerCase()
        );
        console.log('Exact match found:', exactMatch);

        if (!exactMatch) {
            const partialMatch = aircraftOptions.find(ac =>
                ac.value && ac.value.toLowerCase().includes(testAircraft.toLowerCase())
            );
            console.log('Partial match found:', partialMatch);
        }

    } catch (error) {
        console.error('Error fixing fleet data:', error);
    } finally {
        process.exit(0);
    }
}

fixFleetData();
