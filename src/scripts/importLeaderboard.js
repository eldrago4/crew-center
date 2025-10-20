import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import Papa from 'papaparse';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, char, varchar, interval } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Load env
if (!process.env.DATABASE_URL) dotenv.config();

// Define minimal users table for updates
export const users = pgTable('users', {
    id: char({ length: 7 }).primaryKey().notNull(),
    ifcName: varchar({ length: 20 }).notNull(),
    flightTime: interval({ precision: 0 }),
});

const neonSql = neon(process.env.DATABASE_URL);
const db = drizzle(neonSql, { schema: { users } });

function parseLeaderboardLines(lines) {
    const pairs = [];
    for (let i = 0; i < lines.length; i += 2) {
        const name = (lines[ i ] || '').trim();
        const ft = (lines[ i + 1 ] || '').trim();
        if (!name || !ft) continue;
        pairs.push({ name, ft });
    }
    return pairs;
}

function ftToInterval(ftRaw) {
    // leaderboard uses HHHH:MM or maybe HHHH:MM:SS. Normalize to 'X hours Y minutes' for Postgres interval
    const s = ftRaw.trim();
    // If already contains seconds
    if (/^\d+:\d{2}:\d{2}$/.test(s)) {
        const [ h, m, sec ] = s.split(':').map(Number);
        return `${h} hours ${m} minutes ${sec} seconds`;
    }
    // HHHH:MM
    const m = s.match(/^(\d+):(\d{2})$/);
    if (m) {
        const hours = Number(m[ 1 ]);
        const minutes = Number(m[ 2 ]);
        return `${hours} hours ${minutes} minutes`;
    }
    // fallback: return raw
    return s;
}

async function importLeaderboard({ run = false } = {}) {
    const lbPath = path.resolve(process.cwd(), 'src', 'db', 'INVA', 'leaderboard.txt');
    const pilotsPath = path.resolve(process.cwd(), 'src', 'db', 'INVA', 'pilots.csv');

    if (!fs.existsSync(lbPath)) {
        console.error('leaderboard.txt not found at src/db/INVA/leaderboard.txt');
        process.exit(1);
    }

    const lines = fs.readFileSync(lbPath, 'utf8').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const pairs = parseLeaderboardLines(lines);
    console.log(`Parsed ${pairs.length} leaderboard entries`);

    // build pilots map username(lowercase) -> { callsign, username: originalCase }
    const pilotMap = new Map();
    if (fs.existsSync(pilotsPath)) {
        const pilotsRaw = fs.readFileSync(pilotsPath, 'utf8');
        const parsed = Papa.parse(pilotsRaw, { header: true, skipEmptyLines: true });
        for (const row of parsed.data) {
            const usernameRaw = ((row[ 'Username' ] || row[ 'username' ] || '') + '').trim();
            const username = usernameRaw.toLowerCase();
            const callsign = ((row[ 'Callsign' ] || row[ 'callSign' ] || '') + '').trim();
            if (username) pilotMap.set(username, { callsign: callsign || null, username: usernameRaw });
        }
    }

    // Populate users table from pilots.csv: create users with id = callsign, ifcName = username
    let inserted = 0
    let insertSkipped = 0
    for (const [ usernameKey, meta ] of pilotMap.entries()) {
        const callsign = meta.callsign
        const usernameOriginal = meta.username
        if (!callsign) {
            insertSkipped++
            continue
        }
        try {
            // Try insert user with case-sensitive ifcName
            await db.insert(users).values({ id: callsign, ifcName: usernameOriginal }).execute()
            inserted++
        } catch (err) {
            const msg = String(err?.message || err)
            if (msg.includes('duplicate') || msg.includes('already exists')) {
                // If already exists, update the ifcName to the case-sensitive username
                try {
                    await db.update(users).set({ ifcName: usernameOriginal }).where(sql`${users.id} = ${callsign}`).execute()
                } catch (upErr) {
                    console.error(`Failed updating user ${callsign} ifcName:`, upErr)
                }
                insertSkipped++
            } else {
                console.error(`Failed inserting user ${callsign}:`, err)
            }
        }
    }
    console.log(`Inserted ${inserted} users from pilots.csv, skipped ${insertSkipped}`)

    const updates = [];
    const skipped = [];

    // Prefetch users and build maps for quick lookups (case-insensitive for ifcName)
    // Refresh users after potential inserts
    const allUsers = await db.select().from(users);
    const ifcNameMap = new Map(); // lower(ifcName) -> { id, ifcName }
    const idMap = new Map(); // id -> { id, ifcName }
    for (const u of allUsers) {
        ifcNameMap.set((u.ifcName || '').toLowerCase(), { id: u.id, ifcName: u.ifcName });
        idMap.set(u.id, { id: u.id, ifcName: u.ifcName });
    }

    for (const { name, ft } of pairs) {
        const nameKey = name.toLowerCase();
        const intervalVal = ftToInterval(ft);

        // Use username -> callsign mapping (compulsory).
        const meta = pilotMap.get(nameKey);
        if (!meta || !meta.callsign) {
            skipped.push({ name, ft, reason: 'no username->callsign mapping' });
            continue;
        }

        const callsign = meta.callsign
        const usernameOriginal = meta.username

        const byId = idMap.get(callsign);
        if (!byId) {
            skipped.push({ name, ft, reason: `callsign ${callsign} not found in users` });
            continue;
        }

        // Use the original-cased username from pilots.csv when updating ifcName
        updates.push({ id: byId.id, ifcName: usernameOriginal, interval: intervalVal });
    }

    console.log(`Prepared ${updates.length} updates, skipped ${skipped.length} entries.`);
    if (skipped.length) {
        const outDir = path.resolve(process.cwd(), 'tmp');
        try { fs.mkdirSync(outDir, { recursive: true }); } catch { }
        fs.writeFileSync(path.join(outDir, 'skipped_leaderboard_unmapped.json'), JSON.stringify(skipped, null, 2), 'utf8');
        console.log(`Wrote ${skipped.length} skipped entries to tmp/skipped_leaderboard_unmapped.json`);
    }

    if (!run) return { prepared: updates.length, skipped };

    // apply updates one by one to capture issues
    const applied = [];
    for (const u of updates) {
        try {
            // Update flightTime and set ifcName to the case-sensitive username
            await db.update(users).set({ flightTime: u.interval, ifcName: u.ifcName }).where(sql`${users.id} = ${u.id}`).execute();
            console.log(`Updated ${u.id} (${u.ifcName}) -> ${u.interval}`);
            applied.push({ id: u.id, ifcName: u.ifcName, interval: u.interval });
        } catch (err) {
            console.error(`Failed to update user ${u.id} (${u.ifcName}):`, err);
        }
    }

    console.log(`Done applying updates. Applied ${applied.length} / ${updates.length} updates.`);
    if (applied.length) {
        const outDir = path.resolve(process.cwd(), 'tmp');
        try { fs.mkdirSync(outDir, { recursive: true }); } catch { }
        fs.writeFileSync(path.join(outDir, 'applied_leaderboard_updates.json'), JSON.stringify(applied, null, 2), 'utf8');
        console.log(`Wrote applied updates to tmp/applied_leaderboard_updates.json`);
    }

    return { applied: applied.length, skipped };
}

// CLI
if (process.argv[ 1 ] && process.argv[ 1 ].endsWith('importLeaderboard.js')) {
    const run = process.argv.includes('--run');
    importLeaderboard({ run }).then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
