#!/usr/bin/env node
// Neon → Supabase standby: sync, merge-back and failback. See DB-FAILOVER.md.
//
//   node scripts/db-failover/run.mjs auto       what the cron runs: failback if the
//                                               app is on Supabase and Neon is back,
//                                               else merge stragglers + sync if due
//   node scripts/db-failover/run.mjs sync       sync now
//   node scripts/db-failover/run.mjs status
//   node scripts/db-failover/run.mjs failover   drill: move the app onto Supabase
//   node scripts/db-failover/run.mjs failback   leave failover now (if Neon is up)
import { appendFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import {
    clearFailover, connectSupabase, ensureBackupObjects, getFailover, getMeta, inTx, notify,
    startFailover, tryNeon,
} from './db.mjs';
import { mergeBack } from './merge.mjs';
import { SchemaDrift, hasPendingChanges, neonMajor, pgDumpMajor, rebuildBackupSchema, syncToBackup } from './sync.mjs';

const SYNC_INTERVAL_MINUTES = Number(process.env.SYNC_INTERVAL_MINUTES ?? 60);
// Must comfortably exceed MODE_CACHE_MS in src/db/failover.js plus a slow request.
const SETTLE_SECONDS = Number(process.env.FAILBACK_SETTLE_SECONDS ?? 60);

// Exit code for "needs a newer pg_dump"; the workflow installs one and re-runs.
const NEEDS_PG_CLIENT = 3;

const summarise = (report) =>
    report.map((r) => `${r.table}: ${r.upserted} upserted, ${r.created} new, ${r.deleted} deleted`).join('; ') || 'nothing';

async function sync(neon, supa) {
    try {
        return await syncToBackup({ neon, supa });
    } catch (error) {
        if (!(error instanceof SchemaDrift)) throw error;
        const [have, need] = [await pgDumpMajor(), await neonMajor(neon)];
        if (have < need) {
            console.log(`Schema changed on Neon; rebuilding needs pg_dump ${need}+ (found ${have || 'none'})`);
            if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, 'needs_pg_client=true\n');
            process.exitCode = NEEDS_PG_CLIENT;
            return null;
        }
        console.log('Schema changed on Neon; rebuilding Supabase tables');
        await rebuildBackupSchema({ neon, supa });
        await ensureBackupObjects(supa); // triggers + RLS went with the dropped tables
        return syncToBackup({ neon, supa });
    }
}

async function failback(supa, failover) {
    const neon = await tryNeon();
    if (!neon) {
        if ((await inTx(supa, () => getMeta(supa, 'failover_notified'))) !== failover.since) {
            await notify(`🛟 **Crew Center is running on the Supabase backup** since ${failover.since ?? 'unknown'}.\n` +
                `Reason: \`${failover.reason ?? 'unknown'}\`\nIt will move back to Neon automatically once Neon answers again.`);
            await inTx(supa, () => supa.query(
                `insert into failover.meta values ('failover_notified', $1) on conflict (key) do update set value = excluded.value`,
                [JSON.stringify(failover.since)]));
        }
        console.log(`Still on Supabase (since ${failover.since}); Neon not back yet`);
        return;
    }
    try {
        console.log('Neon is back. Merging Supabase writes into Neon (pass 1)');
        const first = await mergeBack({ neon, supa });
        console.log(`Pass 1: ${summarise(first)}`);

        await clearFailover();
        console.log(`Switched the app back to Neon; waiting ${SETTLE_SECONDS}s for instances to follow`);
        await sleep(SETTLE_SECONDS * 1000);

        const second = await mergeBack({ neon, supa });
        console.log(`Pass 2: ${summarise(second)}`);

        if (await getFailover()) {
            console.log('The app failed over again while settling; leaving it on Supabase');
            await notify('⚠️ **Crew Center failback aborted** — the app failed over to Supabase again right after switching back.');
            return;
        }
        const copied = await sync(neon, supa);
        if (copied) console.log(`Re-synced: ${copied.join(', ') || 'no differences'}`);
        await notify(`✅ **Crew Center is back on Neon.** Merged from Supabase — ${summarise([...first, ...second])}.` +
            (copied ? ` Re-synced: ${copied.join(', ') || 'no differences'}.` : ''));
    } finally {
        await neon.end().catch(() => {});
    }
}

async function main(command = 'auto') {
    const supa = await connectSupabase();
    try {
        await ensureBackupObjects(supa);
        const failover = await getFailover();

        if (command === 'status') {
            const meta = await inTx(supa, async () => {
                const { rows } = await supa.query('select key, value from failover.meta order by key');
                const { rows: [{ n }] } = await supa.query('select count(*)::int as n from failover.changelog');
                return { ...Object.fromEntries(rows.map((r) => [r.key, r.value])), unmerged_changes: n };
            });
            console.log({ serving_from: failover ? 'supabase' : 'neon', failover, ...meta });
            return;
        }
        if (command === 'failover') {
            await startFailover('manual drill');
            console.log('App will move to Supabase within ~20s. The next `auto` run moves it back if Neon is healthy.');
            return;
        }
        if (failover || command === 'failback') {
            if (!failover) throw new Error('The app is not failed over');
            return await failback(supa, failover);
        }

        const neon = await tryNeon();
        if (!neon) {
            // Nothing to do: the app fails over by itself on its first query that
            // hits the outage, and Supabase already holds the last sync.
            console.log('Neon is unreachable and the app has not failed over yet; skipping');
            if (command === 'sync') process.exitCode = 1;
            return;
        }
        try {
            if (await inTx(supa, () => hasPendingChanges(supa))) {
                console.log(`Merging writes that reached Supabase after failback: ${summarise(await mergeBack({ neon, supa }))}`);
            }
            const lastSync = await inTx(supa, () => getMeta(supa, 'last_sync'));
            const due = !lastSync || Date.now() - Date.parse(lastSync) >= (SYNC_INTERVAL_MINUTES - 2) * 60_000;
            if (command !== 'sync' && !due) {
                console.log(`Sync not due (last ${lastSync})`);
                return;
            }
            const copied = await sync(neon, supa);
            if (copied) console.log(`Synced: ${copied.join(', ') || 'no differences'}`);
        } finally {
            await neon.end().catch(() => {});
        }
    } finally {
        await supa.end().catch(() => {});
    }
}

main(process.argv[2]).catch(async (error) => {
    console.error(error.message);
    process.exitCode = 1;
});
