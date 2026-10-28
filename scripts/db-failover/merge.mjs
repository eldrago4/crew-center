// Supabase → Neon: replay what the app changed while it was running on Supabase.
//
// The triggers only log *which* rows changed; each one is resolved by its current
// state on Supabase — present means upsert into Neon, gone means delete from it.
// Supabase wins any row both sides touched. Rows Neon wrote that Supabase never
// saw (the gap between the last sync and the outage) are left alone.
import { describeTables, getMeta, inTx, list, packRows, q, qt, unpackRows } from './db.mjs';

const keyMatch = (cols, a, b) => cols.map((c) => `${a}.${q(c)} = ${b}.${q(c)}`).join(' and ');

export async function mergeBack({ neon, supa }) {
    // Exactly-once: Neon records the last changelog id it absorbed in the same
    // transaction as the rows themselves, so a crash anywhere replays nothing twice.
    const instance = await inTx(supa, () => getMeta(supa, 'changelog_instance'));
    const last = await inTx(neon, async () => {
        await neon.query(`
            create schema if not exists failover;
            create table if not exists failover.merge_state (
                id int primary key default 1 check (id = 1),
                changelog_instance text not null,
                last_changelog_id bigint not null
            );
            -- Supabase-born rows and the id Neon gave them, so a row that is
            -- edited again after a first merge updates its copy instead of
            -- inserting another. Keyed by watermark: ids restart above it after
            -- each sync.
            create table if not exists failover.id_map (
                tbl text not null,
                watermark bigint not null,
                backup_id bigint not null,
                primary_id bigint not null,
                primary key (tbl, watermark, backup_id)
            );`);
        const { rows: [s] } = await neon.query('select changelog_instance, last_changelog_id::text from failover.merge_state');
        // A recreated changelog restarts its ids; an old high-water mark would skip them.
        return s && s.changelog_instance === instance ? BigInt(s.last_changelog_id) : 0n;
    });

    const pending = await inTx(supa, async () => {
        const { rows: [{ upto }] } = await supa.query(
            'select max(id)::text as upto from failover.changelog where id > $1', [last.toString()]);
        if (!upto) return null;
        const { rows } = await supa.query(`
            select tbl, jsonb_agg(distinct pk)::text as keys, count(distinct pk)::int as n
              from failover.changelog where id > $1 and id <= $2 group by tbl`, [last.toString(), upto]);
        return { upto, byTable: new Map(rows.map((r) => [r.tbl, r])) };
    });

    if (!pending) {
        await inTx(supa, () => supa.query('delete from failover.changelog where id <= $1', [last.toString()]));
        return [];
    }

    const tables = (await inTx(neon, () => describeTables(neon))).filter((t) => pending.byTable.has(t.name));
    const unknown = [...pending.byTable.keys()].filter((name) => !tables.some((t) => t.name === name));
    if (unknown.length) throw new Error(`Changelog names tables Neon doesn't have: ${unknown.join(', ')}`);

    // Current Supabase state of every logged key, read in one snapshot.
    const current = await inTx(supa, async () => {
        await supa.query('set transaction isolation level repeatable read');
        const rows = new Map();
        for (const t of tables) {
            const { rows: [{ json }] } = await supa.query(`
                select ${packRows(t, 'r')} as json from ${qt(t.name)} r
                 where exists (select 1 from jsonb_populate_recordset(null::${qt(t.name)}, $1::jsonb) k
                                where ${keyMatch(t.pk, 'k', 'r')})`, [pending.byTable.get(t.name).keys]);
            rows.set(t.name, json);
        }
        return rows;
    });

    const watermarks = new Map();
    for (const t of tables.filter((x) => x.seq)) {
        const w = await inTx(supa, () => getMeta(supa, `watermark:${t.name}`));
        if (w == null) continue;
        // Interpolated into SQL below, so normalise it to plain digits first.
        const watermark = BigInt(w).toString();
        // Re-keying a row would orphan anything pointing at it.
        if (t.hasChildren) throw new Error(`${t.name} is referenced by other tables; can't re-key rows created during failover`);
        watermarks.set(t.name, watermark);
    }

    const report = [];
    await inTx(neon, async () => {
        for (const [i, t] of tables.entries()) {
            // LIKE the real table, so text columns compare under the same collation.
            await neon.query(`create temp table _rows${i} (like ${qt(t.name)}) on commit drop`);
            await neon.query(`insert into _rows${i} (${list(t.cols)}) ${unpackRows(t, '$1')}`, [current.get(t.name)]);
            await neon.query(`create temp table _keys${i} on commit drop as
                select ${list(t.pk)} from jsonb_populate_recordset(null::${qt(t.name)}, $1::jsonb) k
                 where not exists (select 1 from _rows${i} r where ${keyMatch(t.pk, 'r', 'k')})`,
                [pending.byTable.get(t.name).keys]);
        }

        // Parents before children for upserts…
        for (const [i, t] of tables.entries()) {
            const w = watermarks.get(t.name);
            const rest = t.cols.filter((c) => !t.pk.includes(c));
            const setRest = rest.map((c) => `${q(c)} = excluded.${q(c)}`).join(', ');
            const pk = t.pk.length === 1 ? q(t.pk[0]) : null;

            const upserted = await neon.query(`
                insert into ${qt(t.name)} (${list(t.cols)}) overriding system value
                select ${list(t.cols)} from _rows${i} ${w != null ? `where ${pk} <= ${w}` : ''}
                on conflict (${list(t.pk)}) ${rest.length ? `do update set ${setRest}` : 'do nothing'}`);
            let created = 0;
            let updated = upserted.rowCount;

            if (w != null) {
                // Rows born on Supabase. Already merged once → update that copy;
                // otherwise take the next id from Neon's own sequence.
                if (rest.length) {
                    const { rowCount } = await neon.query(`
                        update ${qt(t.name)} d set ${rest.map((c) => `${q(c)} = r.${q(c)}`).join(', ')}
                          from _rows${i} r join failover.id_map m
                            on m.tbl = $1 and m.watermark = $2 and m.backup_id = r.${pk}
                         where d.${pk} = m.primary_id`, [t.name, w]);
                    updated += rowCount;
                }
                await neon.query(`
                    create temp table _new${i} on commit drop as
                    select r.${pk} as backup_id, nextval('${t.seq}') as primary_id from _rows${i} r
                     where r.${pk} > ${w} and not exists (
                        select 1 from failover.id_map m where m.tbl = $1 and m.watermark = $2 and m.backup_id = r.${pk})`,
                    [t.name, w]);
                const others = t.cols.filter((c) => c !== t.pk[0]);
                ({ rowCount: created } = await neon.query(`
                    insert into ${qt(t.name)} (${pk}, ${list(others)}) overriding system value
                    select n.primary_id, ${list(others, 'r.')} from _rows${i} r join _new${i} n on n.backup_id = r.${pk}`));
                await neon.query(`insert into failover.id_map select $1::text, $2::bigint, backup_id, primary_id from _new${i}`, [t.name, w]);
            }
            report.push({ table: t.name, upserted: updated, created, deleted: 0 });
        }

        // …children before parents for deletes.
        for (const [i, t] of [...tables.entries()].reverse()) {
            const w = watermarks.get(t.name);
            const pk = t.pk.length === 1 ? q(t.pk[0]) : null;
            let { rowCount: deleted } = await neon.query(`
                delete from ${qt(t.name)} d using _keys${i} k
                 where ${keyMatch(t.pk, 'k', 'd')} ${w != null ? `and k.${pk} <= ${w}` : ''}`);
            if (w != null) {
                // Created and deleted on Supabase: only touch Neon if it was merged in between.
                const { rowCount } = await neon.query(`
                    delete from ${qt(t.name)} d using _keys${i} k join failover.id_map m
                        on m.tbl = $1 and m.watermark = $2 and m.backup_id = k.${pk}
                     where k.${pk} > ${w} and d.${pk} = m.primary_id`, [t.name, w]);
                deleted += rowCount;
            }
            report.find((r) => r.table === t.name).deleted = deleted;
        }

        await neon.query(`
            insert into failover.merge_state (changelog_instance, last_changelog_id) values ($1, $2)
            on conflict (id) do update set changelog_instance = excluded.changelog_instance,
                                           last_changelog_id = excluded.last_changelog_id`,
            [instance, pending.upto]);
    });

    await inTx(supa, () => supa.query('delete from failover.changelog where id <= $1', [pending.upto]));
    return report;
}
