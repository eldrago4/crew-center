/**
 * One-time script: backfill discordId into Firestore users from Neon DB.
 * Only updates Firestore docs that already exist (matched by callsign).
 *
 * Run from crew-center-dashboard root:
 *   node scripts/backfill-discord-ids.mjs
 */

import { readFileSync } from 'fs';
import { createRequire } from 'module';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(__dirname, '..');
const careerRoot = resolve(root, 'Career-Mode-Portal-final2');

// Load DATABASE_URL from crew center .env
try {
    const lines = readFileSync(resolve(root, '.env'), 'utf8').split('\n');
    for (const line of lines) {
        const match = line.match(/^([^#=\s][^=]*)=(.*)$/);
        if (match) process.env[match[1].trim()] ??= match[2].trim().replace(/^['"]|['"]$/g, '');
    }
} catch { /* no .env */ }

const serviceAccount = JSON.parse(
    readFileSync(resolve(__dirname, 'service-account.json'), 'utf8')
);

const require = createRequire(resolve(root, 'package.json'));
const careerRequire = createRequire(resolve(careerRoot, 'package.json'));

const { Pool } = require('pg');
const admin = careerRequire('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const firestore = admin.firestore();

async function main() {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL not set. Add it to .env in the crew-center root.');
        process.exit(1);
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    console.log('Querying Neon for users with discordId...');
    const { rows } = await pool.query(
        `SELECT id AS callsign, "discordId"::text AS discord_id FROM users WHERE "discordId" IS NOT NULL`
    );
    await pool.end();
    console.log(`Found ${rows.length} Neon users with a discordId.\n`);

    let updated = 0, skipped = 0, notFound = 0;

    for (const { callsign, discord_id } of rows) {
        const snapshot = await firestore
            .collection('users')
            .where('callsign', '==', callsign)
            .limit(1)
            .get();

        if (snapshot.empty) {
            console.log(`  [SKIP] ${callsign} — not in Firestore`);
            notFound++;
            continue;
        }

        const doc = snapshot.docs[0];
        if (doc.data().discordId === discord_id) {
            skipped++;
            continue;
        }

        await doc.ref.update({ discordId: discord_id });
        console.log(`  [UPDATED] ${callsign}  →  ${discord_id}`);
        updated++;
    }

    console.log(`\nDone.  updated=${updated}  already-set=${skipped}  not-in-firestore=${notFound}`);
    process.exit(0);
}

main().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});
