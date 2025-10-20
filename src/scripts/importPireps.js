import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, integer, text, date, time, numeric, timestamp, boolean, interval } from 'drizzle-orm/pg-core';

// Load .env when needed
if (!process.env.DATABASE_URL) dotenv.config();

// Minimal pireps table definition matching src/db/schema.ts
export const pireps = pgTable('pireps', {
    // we don't include pirepId for inserts (it's generated)
    flightNumber: text().notNull(),
    date: date().notNull(),
    flightTime: interval({ precision: 0 }).notNull(),
    departureIcao: text().notNull(),
    arrivalIcao: text().notNull(),
    operator: text().default('Indian Virtual').notNull(),
    aircraft: text().notNull(),
    multiplier: numeric(),
    comments: text(),
    userId: text().notNull(),
    valid: boolean(),
    updatedAt: timestamp({ mode: 'string' }),
    adminComments: text(),
});

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema: { pireps } });

function parseTimeField(raw) {
    if (!raw) return null;
    raw = raw.trim();
    // Accept hh:mm:ss
    if (/^\d{1,2}:\d{2}:\d{2}$/.test(raw)) return raw;
    // Convert strings like "1 day, 4:57:00" to total hours string "28:57:00"
    const dayMatch = raw.match(/(\d+)\s*day[s]?\s*,\s*(\d{1,2}:\d{2}:\d{2})/);
    if (dayMatch) {
        const days = Number(dayMatch[ 1 ]);
        const [ h, m, s ] = dayMatch[ 2 ].split(':').map(Number);
        // Return Postgres interval format: '28:57:00' isn't valid for interval directly; use '28 hours 57 minutes 0 seconds'
        const totalHours = days * 24 + h;
        return `${totalHours} hours ${m} minutes ${s} seconds`;
    }
    // fallback: return raw and let DB decide
    return raw;
}

function chunkArray(arr, size) {
    const res = [];
    for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
    return res;
}

async function importPireps({ run = false, batchSize = 1000 } = {}) {
    const pilotsPath = path.resolve(process.cwd(), 'src', 'db', 'INVA', 'pilots.csv');
    const pirepsPath = path.resolve(process.cwd(), 'src', 'db', 'INVA', 'pireps.csv');

    if (!fs.existsSync(pilotsPath) || !fs.existsSync(pirepsPath)) {
        console.error('Missing pilots.csv or pireps.csv in src/db/INVA');
        process.exit(1);
    }

    console.log('📦 Reading pilots.csv...');
    const pilotsRaw = fs.readFileSync(pilotsPath, 'utf8');
    const pilotsParsed = Papa.parse(pilotsRaw, { header: true, skipEmptyLines: true });
    const pilotMap = new Map(); // username(lowercase) -> callsign (user id)
    for (const row of pilotsParsed.data) {
        const usernameRaw = (row[ 'Username' ] || row[ 'username' ] || '').trim();
        const username = usernameRaw.toLowerCase();
        const callsign = (row[ 'Callsign' ] || row[ 'callSign' ] || '').trim();
        if (username) pilotMap.set(username, callsign || null);
    }

    console.log('📦 Reading pireps.csv...');
    const pirepsRaw = fs.readFileSync(pirepsPath, 'utf8');
    const { data: rows, errors } = Papa.parse(pirepsRaw, { header: true, skipEmptyLines: true });
    if (errors.length) {
        console.warn('CSV parse warnings/errors:', errors.slice(0, 5));
    }

    const toInsert = [];
    const skipped = [];

    for (const row of rows) {
        const pilotNameRaw = (row[ 'Pilot' ] || row[ 'username' ] || '').trim();
        const pilotName = pilotNameRaw.toLowerCase();
        const userId = pilotMap.get(pilotName);
        // Strictly skip when there's no mapping or the mapped userId is falsy
        if (!pilotNameRaw || !userId) {
            skipped.push({ row, reason: `No pilot mapping for '${pilotNameRaw}'` });
            continue;
        }

        const flightTime = parseTimeField(row[ 'Flight Time' ]);
        if (!flightTime) {
            skipped.push({ row, reason: `Unparseable flight time: '${row[ 'Flight Time' ]}'` });
            continue;
        }

        const dateRaw = (row[ 'Flight Date' ] || row[ 'Date' ] || '').trim();
        if (!dateRaw) {
            skipped.push({ row, reason: 'Missing flight date' });
            continue;
        }

        const multiplier = row[ 'Multiplier' ] ? Number(row[ 'Multiplier' ]) : null;
        const valid = (String(row[ 'Status' ] || '').toLowerCase() === 'approved');

        toInsert.push({
            flightNumber: row[ 'Flight Number' ] || row[ 'Flight' ] || null,
            departureIcao: row[ 'Departure' ] || null,
            arrivalIcao: row[ 'Arrival' ] || null,
            aircraft: row[ 'Aircraft' ] || null,
            operator: row[ 'Operator' ] || 'Indian Virtual',
            flightTime,
            date: dateRaw,
            multiplier,
            comments: row[ 'Comments' ] || null,
            adminComments: row[ 'Admin Comments' ] || null,
            userId,
            valid,
        });
    }

    console.log(`✅ Prepared ${toInsert.length} rows to insert, skipped ${skipped.length} rows.`);
    if (skipped.length) console.log('Examples of skipped rows:', skipped.slice(0, 5));

    if (!run) {
        console.log('Dry run complete. To actually insert into DB run with `--run` flag.');
        // dump skipped unmapped rows for review
        const unmapped = skipped.filter(s => s.reason && s.reason.startsWith('No pilot mapping'));
        if (unmapped.length) {
            const outDir = path.resolve(process.cwd(), 'tmp');
            try { fs.mkdirSync(outDir, { recursive: true }); } catch { }
            fs.writeFileSync(path.join(outDir, 'skipped_pireps_unmapped.json'), JSON.stringify(unmapped, null, 2), 'utf8');
            console.log(`Wrote ${unmapped.length} unmapped skipped rows to tmp/skipped_pireps_unmapped.json`);
        }
        return { prepared: toInsert.length, skipped };
    }

    const batches = chunkArray(toInsert, batchSize);
    let inserted = 0;
    for (const [ i, batch ] of batches.entries()) {
        console.log(`Inserting batch ${i + 1}/${batches.length} (${batch.length} rows)...`);
        // add updatedAt timestamps and ensure correct types where needed
        const prepared = batch.map(r => ({ ...r, updatedAt: new Date().toISOString() }))
        try {
            await db.insert(pireps).values(prepared).execute();
            inserted += prepared.length;
        } catch (err) {
            console.error('Batch insert failed:', err);
            // try row-by-row fallback to continue past bad rows
            for (const row of prepared) {
                try {
                    await db.insert(pireps).values(row).execute()
                    inserted++;
                } catch (innerErr) {
                    console.error('Row insert failed, skipping row:', innerErr);
                }
            }
        }
    }

    console.log('🎉 Import complete');
    // dump unmapped skipped rows
    const unmapped = skipped.filter(s => s.reason && s.reason.startsWith('No pilot mapping'));
    if (unmapped.length) {
        const outDir = path.resolve(process.cwd(), 'tmp');
        try { fs.mkdirSync(outDir, { recursive: true }); } catch { }
        fs.writeFileSync(path.join(outDir, 'skipped_pireps_unmapped.json'), JSON.stringify(unmapped, null, 2), 'utf8');
        console.log(`Wrote ${unmapped.length} unmapped skipped rows to tmp/skipped_pireps_unmapped.json`);
    }

    return { inserted, skipped };
}

// CLI
if (process.argv[ 1 ] && process.argv[ 1 ].endsWith('importPireps.js')) {
    const run = process.argv.includes('--run');
    importPireps({ run }).then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
