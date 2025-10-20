// scripts/importFlights.js
import fs from "fs";
import path from "path";
import Papa from "papaparse";
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, text, time } from 'drizzle-orm/pg-core';

// Define a minimal `routes` table locally so this script can run with plain Node
export const routes = pgTable('routes', {
    flightNumber: text().primaryKey().notNull(),
    departureIcao: text().notNull(),
    arrivalIcao: text().notNull(),
    flightTime: time(),
    aircraft: text().notNull(),
});

// Load .env if DATABASE_URL isn't already provided in the environment
if (!process.env.DATABASE_URL) {
    dotenv.config();
}

// Create a local Drizzle DB instance using DATABASE_URL from env
const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema: { routes } });

export async function importCSV() {
    try {
        console.log("📦 Reading flights.csv...");
        const csvPath = path.resolve(process.cwd(), "src", "db", "INVA", "routes.csv");
        const csvData = fs.readFileSync(csvPath, "utf8");

        console.log("🧩 Parsing CSV...");
        const { data, errors } = Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
        });

        if (errors.length > 0) {
            console.error("CSV Parse Errors:", errors);
            return;
        }

        const flights = data.map((row) => ({
            flightNumber: row[ "Flight Number" ],
            departureIcao: row[ "Departure" ],
            arrivalIcao: row[ "Arrival" ],
            aircraft: row[ "Aircraft Types" ],
            flightTime: row[ "Flight Time" ] || null,
        }));

        console.log(`🚀 Inserting ${flights.length} records...`);
        await db
            .insert(routes)
            .values(flights)
            .onConflictDoNothing({ target: routes.flightNumber });

        console.log("✅ CSV Import Complete!");
    } catch (err) {
        console.error("❌ Import failed:", err);
    }
}

// Run script directly if executed (when called like `node src/scripts/routes.js`)
if (process.argv[ 1 ] && process.argv[ 1 ].endsWith("routes.js")) {
    importCSV().then(() => process.exit(0));
}
