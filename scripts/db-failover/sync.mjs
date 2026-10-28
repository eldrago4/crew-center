// Neon → Supabase. Only tables whose contents differ are copied, so a quiet hour
// costs Neon a few hashes rather than a full dump's worth of egress.
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { describeTables, env, getFailover, getMeta, inTx, list, packRows, q, qt, setMeta, unpackRows } from './db.mjs';

const run = promisify(execFile);

export class SchemaDrift extends Error {}

// Columns (with type, nullability, default, generation, identity), keys and enum
// labels for the given tables. Indexes are left out: they don't change what the
// app can read or write.
async function schemaFingerprint(client, tables) {
    const { rows: [{ fp }] } = await client.query(`
        select md5(coalesce(string_agg(x, E'\\n' order by x collate "C"), '')) as fp from (
            select format('col %s.%s %s notnull=%s gen=%s id=%s def=%s', c.relname, a.attname,
                          format_type(a.atttypid, a.atttypmod), a.attnotnull, a.attgenerated, a.attidentity,
                          pg_get_expr(d.adbin, d.adrelid)) as x
              from pg_attribute a
              join pg_class c on c.oid = a.attrelid
              join pg_namespace n on n.oid = c.relnamespace
              left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
             where n.nspname = 'public' and c.relname = any($1) and a.attnum > 0 and not a.attisdropped
            union all
            select format('con %s %s %s', c.relname, k.contype, pg_get_constraintdef(k.oid))
              from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace
             where n.nspname = 'public' and c.relname = any($1) and k.contype in ('p', 'f', 'u', 'c')
            union all
            select format('enum %s %s', t.typname, string_agg(e.enumlabel, ',' order by e.enumsortorder))
              from pg_type t join pg_enum e on e.enumtypid = t.oid join pg_namespace n on n.oid = t.typnamespace
             where n.nspname = 'public' group by t.typname
        ) s`, [tables.map((t) => t.name)]);
    return fp;
}

async function tableHash(client, t) {
    const { rows: [row] } = await client.query(`
        select md5(coalesce(string_agg(r, E'\\n' order by r collate "C"), '')) as hash, count(*)::int as n
          from (select t::text as r from (select ${list(t.cols)} from ${qt(t.name)}) t) s`);
    return row;
}

const pkMatch = (t, a, b) => t.pk.map((c) => `${a}.${q(c)} = ${b}.${q(c)}`).join(' and ');

/**
 * Bring Supabase's copy of `public` in line with Neon. Refuses to run while the
 * app is on Supabase or while Supabase holds writes that haven't been merged into
 * Neon — copying over them would throw those writes away.
 */
export async function syncToBackup({ neon, supa }) {
    if (await getFailover()) throw new Error('App is serving from Supabase; refusing to overwrite it');
    if (await hasPendingChanges(supa)) throw new Error('Supabase has unmerged writes; merge them back first');

    const tables = await inTx(neon, () => describeTables(neon));
    const [neonFp, supaFp, rebuiltFor] = await Promise.all([
        inTx(neon, () => schemaFingerprint(neon, tables)),
        inTx(supa, () => schemaFingerprint(supa, tables)),
        inTx(supa, () => getMeta(supa, 'schema_rebuilt_for')),
    ]);
    // After a rebuild the fingerprints can still differ by how the two server
    // versions print a default or generated expression. Rebuilding again wouldn't
    // change that, so remember what we rebuilt from and only react to Neon moving.
    if (neonFp !== supaFp && neonFp !== rebuiltFor) throw new SchemaDrift('Supabase schema differs from Neon');

    const backupHashes = await inTx(supa, async () => {
        const hashes = new Map();
        for (const t of tables) hashes.set(t.name, (await tableHash(supa, t)).hash);
        return hashes;
    });

    // Hashes, rows and sequence positions all come from one Neon snapshot, so a
    // table that changes mid-run can't leave a child row pointing at a parent
    // that wasn't copied.
    const { changed, data, sequences } = await inTx(neon, async () => {
        await neon.query('set transaction isolation level repeatable read');
        const changed = [];
        const data = new Map();
        for (const t of tables) {
            const { hash, n } = await tableHash(neon, t);
            if (hash === backupHashes.get(t.name)) continue;
            changed.push({ ...t, rows: n });
            const { rows: [{ json }] } = await neon.query(`select ${packRows(t, 'r')} as json from ${qt(t.name)} r`);
            data.set(t.name, json);
        }
        const sequences = [];
        for (const t of tables.filter((x) => x.seq)) {
            const { rows: [s] } = await neon.query(`select last_value::text, is_called from ${t.seq}`);
            sequences.push({ table: t.name, ...s });
        }
        return { changed, data, sequences };
    });

    await inTx(supa, async () => {
        await supa.query(`set local failover.syncing = 'on'`);
        // Blocks writes (not reads) for the few hundred ms this takes. Only matters
        // if a failover starts mid-sync: those writes then queue behind the copy
        // instead of being deleted by it.
        await supa.query(`lock table ${tables.map((t) => qt(t.name)).join(', ')} in exclusive mode`);
        if (await getFailover()) throw new Error('Failover started during sync; aborted');
        if (await hasPendingChanges(supa)) throw new Error('App wrote to Supabase during sync; aborted');

        for (const [i, t] of changed.entries()) {
            // LIKE the real table, so text columns compare under the same collation.
            await supa.query(`create temp table _in${i} (like ${qt(t.name)}) on commit drop`);
            await supa.query(`insert into _in${i} (${list(t.cols)}) ${unpackRows(t, '$1')}`, [data.get(t.name)]);
        }
        for (const [i, t] of changed.entries()) {
            if (!t.pk.length) {
                await supa.query(`delete from ${qt(t.name)}`);
                await supa.query(`insert into ${qt(t.name)} (${list(t.cols)}) overriding system value
                    select ${list(t.cols)} from _in${i}`);
                continue;
            }
            const rest = t.cols.filter((c) => !t.pk.includes(c));
            const onConflict = rest.length
                ? `do update set ${rest.map((c) => `${q(c)} = excluded.${q(c)}`).join(', ')}
                   where row(${list(rest, `${qt(t.name)}.`)})::text is distinct from row(${list(rest, 'excluded.')})::text`
                : 'do nothing';
            await supa.query(`insert into ${qt(t.name)} (${list(t.cols)}) overriding system value
                select ${list(t.cols)} from _in${i} on conflict (${list(t.pk)}) ${onConflict}`);
        }
        for (const [i, t] of [...changed.entries()].reverse()) {
            if (!t.pk.length) continue;
            await supa.query(`delete from ${qt(t.name)} d
                where not exists (select 1 from _in${i} s where ${pkMatch(t, 's', 'd')})`);
        }

        // Supabase carries on from exactly where Neon's sequences are, so anything
        // the app inserts here during an outage is numbered above this watermark.
        for (const s of sequences) {
            const t = tables.find((x) => x.name === s.table);
            await supa.query('select setval($1::regclass, $2::bigint, $3)', [t.seq, s.last_value, s.is_called]);
            const issued = s.is_called ? BigInt(s.last_value) : BigInt(s.last_value) - 1n;
            await setMeta(supa, `watermark:${s.table}`, issued.toString());
        }
        await setMeta(supa, 'last_sync', new Date().toISOString());
    });

    return changed.map((t) => `${t.name} (${t.rows} rows)`);
}

export async function hasPendingChanges(supa) {
    const { rows: [{ pending }] } = await supa.query('select exists (select 1 from failover.changelog) as pending');
    return pending;
}

/** Major version of the pg_dump on PATH (or in $PG_BIN), or 0 if there isn't one. */
export async function pgDumpMajor() {
    try {
        const { stdout } = await run(pgBin('pg_dump'), ['--version']);
        return Number(stdout.match(/(\d+)(\.\d+)?/)[1]);
    } catch {
        return 0;
    }
}

// Connection details go to pg_dump/psql as PG* variables, never argv: a failed
// command's message repeats its arguments, and these logs are public. Building
// them field by field also drops URL parameters libpq rejects (Neon's
// pool_timeout, for one).
function libpqEnv(url) {
    const u = new URL(url);
    const vars = {
        PGHOST: u.hostname,
        PGPORT: u.port || '5432',
        PGUSER: decodeURIComponent(u.username),
        PGPASSWORD: decodeURIComponent(u.password),
        PGDATABASE: decodeURIComponent(u.pathname.slice(1)) || 'postgres',
    };
    const libpqParams = { sslmode: 'PGSSLMODE', channel_binding: 'PGCHANNELBINDING', connect_timeout: 'PGCONNECT_TIMEOUT' };
    for (const [param, name] of Object.entries(libpqParams)) {
        const value = u.searchParams.get(param);
        // connect_timeout=0 means "wait forever"; leave libpq's default instead.
        if (value && !(param === 'connect_timeout' && value === '0')) vars[name] = value;
    }
    return { ...process.env, ...vars };
}

const pgBin = (name) => (process.env.PG_BIN ? `${process.env.PG_BIN}/${name}` : name);

export async function neonMajor(neon) {
    const { rows: [{ v }] } = await neon.query(`select current_setting('server_version_num')::int / 10000 as v`);
    return v;
}

/**
 * Recreate Supabase's `public` tables from Neon's schema. Data is left for the
 * following sync to fill in. Same preconditions as the sync, since it starts by
 * dropping every table.
 */
export async function rebuildBackupSchema({ neon, supa }) {
    if (await getFailover()) throw new Error('App is serving from Supabase; refusing to rebuild it');
    if (await hasPendingChanges(supa)) throw new Error('Supabase has unmerged writes; merge them back first');

    const { stdout } = await run(pgBin('pg_dump'), [
        '--schema-only', '--schema=public', '--no-owner', '--no-privileges', '--no-comments', '--clean', '--if-exists',
    ], { env: libpqEnv(env('DATABASE_URL')), maxBuffer: 64 * 1024 * 1024 }).catch((error) => {
        // execFile's own message repeats the command line; stderr is libpq's text.
        throw new Error(`pg_dump failed: ${error.stderr?.trim() || error.code}`);
    });

    const ddl = stdout
        .split('\n')
        // pg_dump ≥17 emits this; Supabase on Postgres 15 rejects it.
        .filter((line) => !/^SET transaction_timeout\b/.test(line))
        // `public` itself belongs to Supabase (and its grants); only its contents are ours.
        .filter((line) => !/^(DROP|CREATE) SCHEMA (IF EXISTS )?public;$/.test(line))
        // pg_dump's preamble sets search_path to '' (plus row_security,
        // statement_timeout…) for the session. Supabase's transaction pooler hands
        // that same server connection to the app next, without resetting it, and
        // every unqualified table name then fails. Scope them to the restore's
        // transaction instead.
        .map((line) => line
            .replace(/^SET (?!LOCAL )/, 'SET LOCAL ')
            .replace(/^(SELECT pg_catalog\.set_config\('[^']+', '[^']*', )false\);$/, '$1true);'))
        .join('\n');

    await psql(env('SUPABASE_DATABASE_URL'), ddl);

    const tables = await inTx(neon, () => describeTables(neon));
    await matchCollation({ neon, supa }, tables);
    const fp = await inTx(neon, () => schemaFingerprint(neon, tables));
    await inTx(supa, () => setMeta(supa, 'schema_rebuilt_for', fp));
}

// Neon's database sorts text by code point (builtin C.UTF-8); Supabase's sorts by
// ICU en-US, which interleaves case ("Ai2781" lands among "AI278x"). Same rows,
// different ORDER BY — so every text column on Supabase is pinned to the
// collation that matches Neon's default. Runs on the freshly restored, empty tables.
async function matchCollation({ neon, supa }, tables) {
    // datlocale (17+) is what governs the builtin provider; datcollate only libc's.
    const { rows: [db] } = await inTx(neon, () => neon.query(`
        select datlocprovider as provider, datcollate as collate, to_jsonb(d) ->> 'datlocale' as locale
          from pg_database d where datname = current_database()`));
    const builtin = { 'C': 'C', 'C.UTF-8': 'pg_c_utf8', 'PG_UNICODE_FAST': 'pg_unicode_fast' };
    const target =
        db.provider === 'b' ? builtin[db.locale]
        : db.provider === 'c' && ['C', 'POSIX'].includes(db.collate) ? 'C'
        : undefined;
    if (!target) {
        console.warn(`Neon's default collation (${db.provider}/${db.locale ?? db.collate}) has no fixed equivalent; text may sort differently on Supabase`);
        return;
    }
    await inTx(supa, async () => {
        const { rows } = await supa.query(`
            select c.relname::text as tbl, a.attname::text as col, format_type(a.atttypid, a.atttypmod) as type
              from pg_attribute a join pg_class c on c.oid = a.attrelid
             where c.relnamespace = 'public'::regnamespace and c.relname = any($1)
               and a.attnum > 0 and not a.attisdropped and a.attgenerated = ''
               and a.attcollation = (select oid from pg_collation where collname = 'default')`,
            [tables.map((t) => t.name)]);
        const byTable = Map.groupBy(rows, (r) => r.tbl);
        for (const [tbl, cols] of byTable) {
            await supa.query(`alter table ${qt(tbl)} ${cols.map((c) =>
                `alter column ${q(c.col)} type ${c.type} collate ${q(target)}`).join(', ')}`);
        }
    });
}

// The DDL goes in on stdin: pg_dump ≥18 brackets it in \restrict meta-commands,
// which psql only accepts from a script, not from -c.
function psql(url, script) {
    return new Promise((resolve, reject) => {
        const child = spawn(pgBin('psql'), [
            '--no-psqlrc', '--quiet', '--single-transaction', '-v', 'ON_ERROR_STOP=1', '-f', '-',
        ], { env: libpqEnv(url), stdio: ['pipe', 'ignore', 'pipe'] });
        let stderr = '';
        child.stderr.on('data', (chunk) => (stderr += chunk));
        child.on('error', reject);
        // psql's stderr names the failing statement, never row data.
        child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`Schema restore failed: ${stderr.trim()}`))));
        child.stdin.end(script);
    });
}
