// Shared plumbing for the Neon ⇄ Supabase failover jobs. See DB-FAILOVER.md.
//
// The repo is public, so Actions logs are public: log counts and table names,
// never row data or error text that could carry it.
import pg from 'pg';

export const DB_MODE_KEY = 'db:mode'; // must match src/db/failover.js

export function env(name, fallback) {
    const value = process.env[name] ?? fallback;
    if (value === undefined) throw new Error(`${name} is not set`);
    return value;
}

// Same rules as backupConnectionConfig in src/db/failover.js (duplicated so the
// Actions job only has to install pg, not the app).
function supabaseConfig(url) {
    const parsed = new URL(url);
    const plaintext = parsed.searchParams.get('sslmode') === 'disable';
    parsed.searchParams.delete('sslmode');
    const ca = process.env.SUPABASE_CA_CERT?.replace(/\\n/g, '\n');
    return { connectionString: parsed.toString(), ssl: plaintext ? false : ca ? { ca } : { rejectUnauthorized: false } };
}

export async function connectNeon() {
    const client = new pg.Client({ connectionString: env('DATABASE_URL'), connectionTimeoutMillis: 20_000 });
    await client.connect();
    return client;
}

export async function connectSupabase() {
    const client = new pg.Client({ ...supabaseConfig(env('SUPABASE_DATABASE_URL')), connectionTimeoutMillis: 20_000 });
    await client.connect();
    return client;
}

/** A Neon connection if Neon is answering queries, else null. */
export async function tryNeon() {
    let client;
    try {
        client = await connectNeon();
        await client.query('select 1');
        return client;
    } catch (error) {
        console.log(`Neon is not answering (${error.code ?? 'no SQLSTATE'})`);
        await client?.end().catch(() => {});
        return null;
    }
}

// Every statement runs inside one of these. SET LOCAL survives transaction-mode
// poolers, and pinning the output styles makes row text — which is what gets
// hashed and shipped between the two servers — identical on both sides.
export async function inTx(client, fn) {
    await client.query('begin');
    try {
        await client.query(`set local DateStyle = 'ISO, MDY'; set local IntervalStyle = 'postgres';
            set local TimeZone = 'UTC'; set local extra_float_digits = 1`);
        const result = await fn();
        await client.query('commit');
        return result;
    } catch (error) {
        await client.query('rollback').catch(() => {});
        throw error;
    }
}

export const q = (ident) => `"${ident.replace(/"/g, '""')}"`;
export const qt = (table) => `public.${q(table)}`;
export const list = (cols, prefix = '') => cols.map((c) => prefix + q(c)).join(', ');

// Rows travel between the servers as JSON arrays of each column's Postgres text
// form, cast back with the column's own type on arrival. Text I/O round-trips
// every type exactly; json_agg/jsonb_populate_recordset would not (a jsonb
// `null` comes back as SQL NULL).
export const packRows = (t, alias) =>
    `coalesce(json_agg(json_build_array(${t.cols.map((c) => `${alias}.${q(c)}::text`).join(', ')})), '[]')::text`;
export const unpackRows = (t, param) =>
    `select ${t.cols.map((c, i) => `(e->>${i})::${t.types[i]} as ${q(c)}`).join(', ')} from jsonb_array_elements(${param}::jsonb) e`;

/**
 * Tables in `public`, parents before children. Read from Neon, which is the
 * authority on the schema: Supabase's copy is rebuilt from it.
 */
export async function describeTables(client) {
    const { rows } = await client.query(`
        select c.relname::text as name,
            (select array_agg(a.attname::text order by array_position(i.indkey::int2[], a.attnum))
               from pg_index i join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey)
              where i.indrelid = c.oid and i.indisprimary) as pk,
            (select array_agg(a.attname::text order by a.attnum) from pg_attribute a
              where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped and a.attgenerated = '') as cols,
            (select array_agg(format_type(a.atttypid, a.atttypmod) order by a.attnum) from pg_attribute a
              where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped and a.attgenerated = '') as types,
            (select array_agg(distinct f.relname::text) from pg_constraint k join pg_class f on f.oid = k.confrelid
              where k.conrelid = c.oid and k.contype = 'f' and k.confrelid <> c.oid) as parents
          from pg_class c join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relispartition
         order by c.relname`);

    for (const t of rows) {
        t.pk ??= [];
        t.parents ??= [];
        // A single-column key fed by a sequence (identity or serial). Rows created
        // on Supabase during an outage get a fresh value from Neon's sequence on
        // merge-back, since Neon kept issuing the same numbers to its own writes.
        t.seq = null;
        if (t.pk.length === 1) {
            const { rows: [s] } = await client.query('select pg_get_serial_sequence($1, $2) as seq', [qt(t.name), t.pk[0]]);
            t.seq = s.seq;
        }
    }
    for (const t of rows) t.hasChildren = rows.some((o) => o.name !== t.name && o.parents.includes(t.name));
    return topoSort(rows);
}

function topoSort(tables) {
    const byName = new Map(tables.map((t) => [t.name, t]));
    const done = new Set();
    const out = [];
    const visit = (t, path = new Set()) => {
        if (done.has(t.name)) return;
        if (path.has(t.name)) throw new Error(`Foreign-key cycle through ${t.name}`);
        path.add(t.name);
        for (const p of t.parents) if (byName.has(p)) visit(byName.get(p), path);
        done.add(t.name);
        out.push(t);
    };
    tables.forEach((t) => visit(t));
    return out;
}

/** Supabase-side bookkeeping: the change log the triggers write and a small key/value store. */
export async function ensureBackupObjects(supa) {
    await inTx(supa, async () => {
        await supa.query(`
            create schema if not exists failover;
            revoke all on schema failover from public;
            create table if not exists failover.changelog (
                id bigserial primary key,
                tbl text not null,
                pk jsonb not null,
                at timestamptz not null default now()
            );
            create table if not exists failover.meta (key text primary key, value jsonb not null);
            insert into failover.meta values ('changelog_instance', to_jsonb(gen_random_uuid()::text))
                on conflict do nothing;

            -- Records the key of every row the app touches. The sync job sets
            -- failover.syncing so its own copying isn't mistaken for app writes.
            -- A key change logs both keys: the old one resolves to a delete.
            create or replace function failover.log_change() returns trigger
            language plpgsql security definer set search_path = '' as $fn$
            declare
                new_pk jsonb := '{}';
                old_pk jsonb := '{}';
                col text;
            begin
                if current_setting('failover.syncing', true) = 'on' then
                    return null;
                end if;
                foreach col in array TG_ARGV loop
                    if TG_OP <> 'DELETE' then new_pk := new_pk || jsonb_build_object(col, to_jsonb(NEW) -> col); end if;
                    if TG_OP <> 'INSERT' then old_pk := old_pk || jsonb_build_object(col, to_jsonb(OLD) -> col); end if;
                end loop;
                if TG_OP <> 'DELETE' then
                    insert into failover.changelog (tbl, pk) values (TG_TABLE_NAME, new_pk);
                end if;
                if TG_OP <> 'INSERT' and old_pk is distinct from new_pk then
                    insert into failover.changelog (tbl, pk) values (TG_TABLE_NAME, old_pk);
                end if;
                return null;
            end
            $fn$;`);

        const { rows } = await supa.query(`
            select c.relname::text as name, c.relrowsecurity as rls,
                exists (select 1 from pg_trigger g where g.tgrelid = c.oid and g.tgname = 'failover_log') as logged,
                (select array_agg(a.attname::text order by array_position(i.indkey::int2[], a.attnum))
                   from pg_index i join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey)
                  where i.indrelid = c.oid and i.indisprimary) as pk
              from pg_class c join pg_namespace n on n.oid = c.relnamespace
             where n.nspname = 'public' and c.relkind in ('r', 'p')`);
        const { rows: [{ supabase_roles }] } = await supa.query(
            `select count(*) = 2 as supabase_roles from pg_roles where rolname in ('anon', 'authenticated')`);

        for (const t of rows) {
            if (!t.logged && t.pk) {
                const args = t.pk.map((c) => `'${c.replace(/'/g, "''")}'`).join(', ');
                await supa.query(`create trigger failover_log after insert or update or delete on ${qt(t.name)}
                    for each row execute function failover.log_change(${args})`);
            }
            // Supabase exposes `public` through its Data API, and its default
            // privileges hand every new table to anon/authenticated. RLS with no
            // policies shuts that off; the app connects as the owner, which RLS
            // doesn't apply to.
            if (!t.rls) await supa.query(`alter table ${qt(t.name)} enable row level security`);
            if (supabase_roles) await supa.query(`revoke all on ${qt(t.name)} from anon, authenticated`);
        }
        const unlogged = rows.filter((t) => !t.pk).map((t) => t.name);
        if (unlogged.length) console.warn(`No primary key, so writes during failover are NOT merged back: ${unlogged.join(', ')}`);
    });
}

export async function getMeta(supa, key) {
    const { rows } = await supa.query('select value from failover.meta where key = $1', [key]);
    return rows[0]?.value ?? null;
}

export async function setMeta(supa, key, value) {
    await supa.query(
        'insert into failover.meta values ($1, $2) on conflict (key) do update set value = excluded.value',
        [key, JSON.stringify(value)]);
}

// Upstash REST, so the job needs no Redis SDK.
async function redis(...command) {
    const url = env('UPSTASH_REDIS_REST_URL', process.env.KV_REST_API_URL);
    const token = env('UPSTASH_REDIS_REST_TOKEN', process.env.KV_REST_API_TOKEN);
    const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(command),
    });
    const body = await res.json();
    if (!res.ok || body.error) throw new Error(`Redis ${command[0]} failed: ${body.error ?? res.status}`);
    return body.result;
}

/** The failover record the app wrote ({ since, reason }), or null when serving from Neon. */
export async function getFailover() {
    const raw = await redis('GET', DB_MODE_KEY);
    if (raw == null) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return { since: null, reason: String(raw) };
    }
}

export const clearFailover = () => redis('DEL', DB_MODE_KEY);

/** What the app does on its own when Neon fails; here for drills. */
export const startFailover = (reason) =>
    redis('SET', DB_MODE_KEY, JSON.stringify({ since: new Date().toISOString(), reason }), 'NX');

export async function notify(content) {
    const hook = process.env.DISCORD_BACKUP_WEBHOOK;
    if (!hook) return;
    await fetch(hook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
    }).catch(() => {});
}
