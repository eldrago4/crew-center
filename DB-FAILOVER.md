# Supabase standby for Neon

Neon is the primary database. Supabase holds a copy, and when Neon stops
answering (quota exceeded, endpoint disabled, can't connect) the app moves to
Supabase on its own — reads **and** writes — and moves back once Neon is
healthy, after copying across whatever was written in the meantime.

```
             normal                             Neon outage
  app ──► Neon ──(hourly diff)──► Supabase      app ──► Supabase  (triggers log changed keys)
                                                          │
                     failback, once Neon answers:         ▼
                     merge logged rows → Neon, flip back, re-sync
```

## Moving parts

| Piece | What it does |
|---|---|
| `src/db/failover.js` + `src/db/client.js` | Sit under Drizzle at the SQL-client level. A query that Neon rejects as unavailable is replayed on Supabase in the same request, and `db:mode` is set in Redis so every instance follows. Results come back in exactly the shape neon-http returns, so no calling code changes. |
| `db:mode` (Upstash Redis) | Present ⇒ the app serves from Supabase. **Sticky**: only the failback job deletes it. Instances re-read it every 20 s. |
| `failover` schema in Supabase | `changelog` (key of every row the app wrote), `meta` (last sync, sequence watermarks), and the `failover_log` triggers on every `public` table. |
| `scripts/db-failover/` | The job. `auto` decides what's needed: failback if failed over and Neon is back, else merge any stragglers and sync if an hour has passed. |
| `.github/workflows/db-failover.yml` | Runs `auto` every 15 min; manual runs can pick `sync`, `status`, `failover` (drill) or `failback`. |

Without `SUPABASE_DATABASE_URL` in the app's env none of this is active, and a
quota error raises the old maintenance flag exactly as before.

## Setup (in this order)

1. **Create the Supabase project** in the same region as Neon
   (`ap-southeast-1`, Singapore). Use Postgres 17 if offered (matches Neon).
2. **Connection string**: Supabase → Connect → *Transaction pooler* (port
   `6543`, IPv4). Optionally download the CA cert (Database settings → SSL) to
   verify TLS; without it the connection is encrypted but unverified.
3. **GitHub secrets** (repo → Settings → Secrets → Actions). `DATABASE_URL` and
   `DISCORD_BACKUP_WEBHOOK` already exist for the monthly backup.
   - `SUPABASE_DATABASE_URL` — from step 2
   - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — same values as Vercel's
   - `SUPABASE_CA_CERT` — optional, the PEM contents
4. **First sync**: Actions → *Supabase Standby* → Run workflow → `sync`. The
   first run sees an empty Supabase, installs a Postgres 18 client, copies the
   schema with `pg_dump`, then the data. Check with `status`.
5. **Only then, Vercel env** (Production): `SUPABASE_DATABASE_URL`, plus
   `SUPABASE_CA_CERT` if you used it, then redeploy. Doing this before step 4
   would let the app fail over onto an empty database.
6. **Drill**: run the workflow with `failover`. Within ~20 s the site serves
   from Supabase; make a harmless write (e.g. edit a NOTAM). The next 15-minute
   `auto` run sees Neon healthy, merges that write into Neon and switches back,
   and posts to Discord.

## What to expect

- **Freshness.** Supabase is at most ~1 h behind. During an outage, anything
  written to Neon after the last sync isn't visible; it's still in Neon and
  reappears after failback.
- **Same answers, same order.** Supabase's database sorts text by ICU `en-US`,
  Neon's by code point, so after each schema rebuild every text column on
  Supabase is pinned to Neon's collation (`pg_c_utf8`). Checked against
  production: the app's queries return identical results, in identical order,
  from both.
- **Conflicts.** A row changed on both sides in that window ends up as
  Supabase's version (whole row, not per column).
- **PIREPs filed during an outage get new IDs on failback.** Neon kept issuing
  the same numbers to its own last writes, so Supabase-born rows take the next
  free Neon id. `failover.id_map` in Neon records the mapping. Nothing outside
  the database references `pirepId`.
- **Cost.** The hourly sync wakes Neon compute and hashes every table, but only
  copies tables whose hash differs, so egress stays small. Lower the cadence with
  the `SYNC_INTERVAL_MINUTES` env var on the job if Neon compute is tight.
- **Supabase free tier** pauses projects that look inactive. The hourly sync
  connects and writes; confirm in the dashboard that this keeps it awake.

## Operating it

```bash
# locally, with the same env vars the workflow uses
node scripts/db-failover/run.mjs status     # serving_from, last_sync, unmerged_changes
node scripts/db-failover/run.mjs sync       # sync now
node scripts/db-failover/run.mjs failback   # leave failover now (needs Neon healthy)
```

- **From the site**: `/crew/admin/server-config` (CEO) shows which database is
  serving, runs a health check (Neon, standby last sync, unmerged writes, Redis)
  and can switch to Supabase manually. Switching back is always the job's call.
- **Schema changes** (Drizzle migrations against Neon) need nothing extra: the
  next sync notices the schema fingerprint changed and rebuilds Supabase's
  tables first. It refuses to while Supabase holds unmerged writes.
- **Stuck on Supabase?** `status` shows the reason the app recorded. Failback
  waits for Neon to answer a query from the runner; if it says Neon is back but
  the app keeps failing over again, the problem is between Vercel and Neon.
- **Sync refusing to run** with "unmerged writes": something wrote to Supabase
  while the app was on Neon (an instance that couldn't reach Redis). `auto`
  merges those first; run it.

## Things that bit during real testing

- **Session settings leak through Supabase's transaction pooler.** A server
  connection is handed to the next client as-is, so anything the job sets for
  the session lands in the app's queries. pg_dump's preamble
  (`search_path = ''`, `row_security = off`) did exactly that and broke every
  unqualified table name; the restore now makes them transaction-local. Keep
  any new job SQL to `SET LOCAL`.
- **Connection URLs never go on a command line.** A failed `pg_dump` repeats
  its arguments in the error, and the Actions logs are public. `pg_dump`/`psql`
  get `PG*` variables instead (which also drops Neon's `pool_timeout`, a
  parameter libpq rejects).

## Limits

- `db.batch()` isn't failover-aware (nothing uses it). Tables without a primary
  key are copied to Supabase but writes to them during an outage aren't merged
  back (the job warns if one appears).
- A table whose rows are created on Supabase during an outage can only be
  re-keyed if nothing references it by foreign key. True today for `pireps`; the
  job errors out rather than guess if that changes.
- Covers `main` (Vercel). The `cloudflare` branch's Workers runtime is untested
  with the `pg` pool.
- The repo is public, so Actions logs are too: the job logs table names and
  counts only.
