# The `cloudflare` branch — architecture & how to merge `main` into it

This branch deploys the app to **Cloudflare Workers** via the
[OpenNext Cloudflare adapter](https://opennext.js.org/cloudflare). It is a
long‑lived branch that **deliberately diverges** from `main` (which deploys to
Vercel). Feature work happens on `main` and is periodically merged down here.

Merging is *not* a plain fast‑forward: a handful of files must keep their
Cloudflare versions, and — more subtly — the Workers runtime has an environment
model that breaks common Node/Vercel patterns. Read this before every merge.

> **Writing a feature (on either branch)?** Start with
> **["Coding etiquette — write it so it ports"](#coding-etiquette--write-it-so-it-ports)**.
> Most of the merge pain below is self‑inflicted: code authored on `main` in a
> shape that doesn't survive the Workers runtime. The etiquette rules are no‑ops
> on Vercel and make the merge a fast‑forward.

> **⚠️ Cache Components / PPR — STRIP on every merge (settled 2026‑07‑22).**
> `main` runs `cacheComponents: true` + `'use cache' / 'use cache: remote'` +
> `cacheLife`/`cacheTag`. **This branch does NOT** — we strip it and use
> `unstable_cache` instead. Reasons: `'use cache'`/PPR durability on Workers needs
> an OpenNext incremental cache (R2/KV) **and** tag cache (D1/Durable Objects)
> wired into `open-next.config.ts` (currently bare), and the adapter warns *cache
> interception does not work with PPR*. `unstable_cache` survives instances and
> deploys with zero extra infra. The full strip‑and‑convert procedure is in
> **["Cache Components: strip it every merge"](#cache-components-strip-it-every-merge)**
> below — read it whenever a merge pulls in new `'use cache'` files.

---
//b
## TL;DR — the merge procedure

```bash
git checkout cloudflare
git pull                      # get latest cloudflare
git merge main                # bring in main's changes

# Resolve conflicts keeping the Cloudflare side for the platform files
# (see "Files that must stay Cloudflare's" below), then:

npm install --package-lock-only   # re-sync the lockfile with package.json
npm ci                            # must succeed — this is what CI runs

# CRITICAL 1: strip Cache Components main brought in (flag + 'use cache'),
#             and restore connection() parity — see the dedicated section.
git grep -l "use cache" -- 'src/**'   # must be empty (comments aside) when done

# CRITICAL 2: scan for any NEW module-scope env access that main introduced
grep -rnE "^(const|let|var) +[A-Za-z0-9_]+ *= *(new Redis\(|Redis\.fromEnv\(|neon\()" src
# ^ every hit must be made lazy (see "The runtime gotcha")

# CRITICAL 3: next pin — bump main's 16.2.10 back to ^16.2.11 (opennext peer)
# CRITICAL 4: src/proxy.js must NOT come back (Node middleware unsupported)
# CRITICAL 5: wrangler.jsonc must keep "minify": true (3 MiB Free-plan limit)

npx next build                    # must reach a full manifest
npm run cf:build                  # MUST also pass — catches Workers-only failures

# CRITICAL 6: the size gate — this fails the deploy, not the build, so check it
#             locally BEFORE pushing (gzip must stay under 3072 KiB):
npx wrangler deploy --dry-run --outdir /tmp/wout | grep "Total Upload"

git commit
git push origin cloudflare
npm run cf:deploy             # or let the Workers build deploy it
```

Then smoke‑test **`/crew`** and any page that talks to the DB or Redis.

---

## Coding etiquette — write it so it ports

Every merge costs exactly as much as the code makes it cost. The rules below are
what we've learned (mostly the hard way) about **writing a feature on `main` so
it lands here without hand‑surgery**, and about **where a Workers‑only fix is
allowed to live**. Follow them on *both* branches — most are free no‑ops on
Vercel.

### The direction of flow

- **Features are written on `main` and merged down.** Never develop a feature
  here first; there is no `cloudflare → main` merge and there never should be
  (this branch carries platform edits that would break Vercel).
- **Provider fixes stay on their own branch** — but a fix that is *portable*
  (helps both runtimes) should be written on `main` and merged down, not applied
  here directly. Anything applied only here becomes a permanent merge hazard: it
  has to survive every future merge by hand. See the ledger at the end of this
  section.

### The divergence ledger — what differs and how to copy it

| Concern | `main` (Vercel/Node) | `cloudflare` (Workers) | Copying a change |
|---|---|---|---|
| Env access | `process.env` at module load | **request‑time only** | Write lazy on both → **copies clean** |
| Cached reads | `'use cache' / cacheLife / cacheTag` | `unstable_cache` | **Hand‑convert every merge** |
| Force‑dynamic | `await connection()` | same | **copies clean — keep it** |
| Middleware | `src/proxy.js` | **does not exist** | **Never copy** |
| Firebase | `firebase-admin` | Firestore REST + `jose` | **Never copy** — keep ours |
| AI Search | REST + `CF_ACCOUNT_ID`/token | `env.AI.autorag(...)` binding | **Never copy** — keep ours |
| Cron | `vercel.json` `crons` | `wrangler.jsonc triggers` + `worker.js` | **Edit both, separately** |
| `next/image` | optimizer on | `unoptimized: true` | **Never copy** the flag |
| Outbound `fetch` | anything Node can reach | hostname + standard port only | Design for the strict side |
| Response bodies | streaming fine | **no streamed bodies** (OpenNext hangs) | Design for the strict side |
| Bundle size | effectively unbounded | **3 MiB gzipped, hard** | Watch new deps here |
| CPU | Fluid Active CPU (billed) | **~2 s/request, hard 1102** | Cold‑start work is portable |

### 1. Lazy‑init anything that reads env — **on `main` too**

The single biggest source of "worked on Vercel, 500s on Workers". Full
explanation in [the runtime gotcha](#the-runtime-gotcha-lazyinit-anything-that-reads-env);
the etiquette half is: **write the lazy `getRedis()` / `getDb()` shape when you
first author the code on `main`.** On Node it is a pure no‑op (the client is
built on first call instead of at import), and it means the file merges down
untouched instead of needing a conversion pass. Every eager client we've had to
convert here (`stats`, `leaderboard/cron`, `db/client.js`, …) is a file that now
conflicts on every merge that touches it.

### 2. Keep cached reads in one named wrapper, at the top of the file

The `'use cache'` ⇄ `unstable_cache` conversion is mechanical **only if the
cached read is a standalone exported function**. It becomes surgery when
`'use cache'` is sprinkled inside a component body or a route handler.

```js
// ✅ portable shape — one hunk to convert, everything else merges clean
const getNotams = unstable_cache(async () => { … }, ['dashboard-notams'],
                                 { revalidate: 300, tags: ['notams'] });
// main writes the same function as: async function getNotams(){ 'use cache: remote'; cacheLife(…); cacheTag('notams'); … }
```

Corollaries:
- **Keep the cache key and the tag string identical on both branches**
  (`'notams'`, `crewcenter-${moduleName}`). `revalidateTag()` calls then copy
  down verbatim, and the diff stays inside the wrapper.
- **Put error fallbacks in the same place on both branches.** On `main` they must
  sit *outside* the cached scope (a thrown error inside a build‑executed
  `'use cache'` fails the build); `unstable_cache` doesn't care either way, so
  match main's placement and the conversion stays a one‑liner.
- `updateTag` is Cache‑Components‑only. Always write `revalidateTag` — it works
  on both.

### 3. `connection()` is portable — write it, don't strip it

Any page that reads the DB and isn't already forced dynamic by `auth()` needs
`await connection()` from `next/server` on **both** branches. On `main` it keeps
cached reads out of the build; here it is what stops a prerender attempt from
crashing with `No database connection string`. It is a plain Next API, not
Cache‑Components‑gated. Adding it on `main` is the cheapest possible parity win.

### 4. Gate auth in the layout/page — never in middleware

`src/proxy.js` cannot exist here (Node middleware is unsupported by
OpenNext‑Cloudflare, and Next 16 gives no edge escape hatch). So **don't move
gating into the proxy on `main` either** — keep `auth()` + `redirect()` in each
section `layout.jsx`/`page.jsx`, which runs identically on both. Anything you
add to the proxy on `main` is functionality this branch silently loses.

### 5. Outbound `fetch`: hostname, standard port, HTTPS

Workers subrequests **cannot** target a raw IP literal, and a non‑standard port
is silently dropped to the scheme's default. Node/undici has neither
restriction, so this class of bug is invisible on `main`.

- **Never hardcode a host.** Put every external base URL in an env var/secret
  (`BOT_API_URL`, `RECS_API_URL`) so a transport fix is a `wrangler secret put`,
  not a code change on two branches.
- Point those at a **hostname on 443** (Cloudflare Tunnel, or proxied DNS + an
  Origin Rule rewriting the port). `http://1.2.3.4:25565` is a dead address here.
- The failure signature is nasty: workerd **strips the message** on an
  internally‑rejected subrequest, so you get a stack with no `Name: message`
  header and `error.message === ''`. Which leads to:
- **Log `error.name` + `error.stack` + the target URL, and never return a bare
  `error.message` to the client** — it renders as an empty toast. This is the
  `/api/inactive-notice` lesson (all five bot integrations were dead for days
  behind a blank error).

### 6. Bindings stay in the route handler

`getCloudflareContext()` and `env.AI` only exist here. Keep them **inside the one
route handler that needs them** (see `api/aig/chat/route.js`) and never import
them into a shared `src/lib/*` module — the moment a binding leaks into shared
code, that file joins the "never copy" list and every merge touching it
conflicts. Same rule in reverse on `main`: keep `CF_ACCOUNT_ID`/token REST calls
in the route, not in a helper.

### 7. Adding a cron = two edits, and the route must be portable

There is no Vercel Cron here. A new scheduled job needs:
1. `vercel.json` → `crons` entry (on `main`), **and**
2. `wrangler.jsonc` → `triggers.crons` expression **plus** a matching
   `CRON_ROUTES` key in `worker.js` — byte‑identical strings, or the event is a
   silent no‑op.

So write the job as a **plain `GET` route handler, `CRON_SECRET` Bearer‑gated
and idempotent**, never as platform‑specific glue. Both runners then just call
it. (`vercel.json` on this branch keeps only the `git.deploymentEnabled`
block — don't let main's `crons` array merge back in.)

### 8. Don't stream response bodies

Returning a streamed body from a route handler **hangs under OpenNext on
Workers** (~15 s → 502; see `156aab7`). Keep API responses plain JSON on both
branches and do progressive reveal on the client (AI.g uses a typewriter
effect). If you build a streaming feature on `main`, you are building something
that must be rewritten here.

### 9. Perf work: portable by default, Workers‑only by exception

The two platforms punish different things — Vercel bills Fluid **Active CPU**,
Workers **hard‑fails at ~2 s** with a 1102 — but the fixes overlap almost
entirely, so **write them on `main` and merge them down**:

- Heavy interactive client trees → `next/dynamic(..., { ssr: false })` with a
  fixed‑size placeholder. Cuts cold‑start module‑init here, cuts SSR CPU there.
  Fully portable. **The whole `/crew` tree now works this way** — see
  "The crew app renders client‑only" below, and obey its one rule.
- Shrink server→client payloads (the packed tab/newline routes string). Portable.
- `CDN-Cache-Control` on any GET with no `auth()` and no per‑user input;
  `Cache-Control: private, max-age=N` on slow‑changing per‑user reads. Both
  branches honour these — **already in parity, keep it that way.** Remember
  neither has a purge wired, so the TTL is a hard staleness ceiling.

Genuinely Workers‑only (do **not** push these to `main`): `wrangler.jsonc`
`minify`, `unoptimized: true`, the guard worker, anything about the 3 MiB gate.

### 10. New dependency? Check three things before merging it down

1. Does it need Node built‑ins beyond `nodejs_compat`? (`firebase-admin` did —
   that's why `src/lib/firebase.js` is a REST client.) Prefer Web‑standard
   APIs: `fetch`, Web Crypto, `jose`.
2. Does it push the worker past the size gate?
   `npx wrangler deploy --dry-run --outdir /tmp/wout | grep "Total Upload"` —
   gzip must stay under 3072 KiB, and headroom is ~9%.
3. Is it a client‑only lib? Then `ssr: false` it and it costs the worker nothing.

### The cloudflare‑only patch ledger

These files carry Workers‑specific edits that **a merge from `main` will try to
revert**. Anything you add to this list should also earn a line here:

| File | Why it diverges |
|---|---|
| `src/lib/firebase.js` | Firestore REST + `jose` (exports `Timestamp`) |
| `src/db/client.js` | lazy neon behind a `Proxy` |
| `next.config.mjs` | no `cacheComponents`, jose tracing, `unoptimized` |
| `package.json` / `.npmrc` | jose/wrangler/opennext, `next ^16.2.11`, no `pg` |
| `vercel.json` | deploy disabled for this branch; no `crons` |
| `src/app/api/aig/chat/route.js` | AI binding instead of REST |
| `src/app/api/stats/route.js` | `Timestamp` from our firebase shim + lazy Redis |
| `src/app/api/leaderboard/cron/route.js` | lazy Redis |
| `dashboard/dashboardData.js`, `fleetModule.js`, `admin/statistics/queries.js`, `crew/routes/page.jsx`, `crew/admin/rotw/page.jsx` | Cache Components stripped → `unstable_cache` |
| `src/components/crew-runtime/*`, every `(crew)/**/layout.jsx` + `page.jsx`, the `*View.jsx` files, `ResponsiveCrewLayout.jsx`, `crew/page.jsx` + `CrewLoginClient.jsx` | the client‑only crew runtime — 1102 cold‑start work (**portable — fold into `main` when convenient and this row goes away**) |
| `worker.js`, `worker.guard.js`, `wrangler*.jsonc`, `open-next.config.ts`, `public/1102.html` | Cloudflare‑only files |

Regenerate it any time with `git diff --stat main..cloudflare`.

---

## Why this branch is different (architecture)

| Concern | `main` (Vercel / Node) | `cloudflare` (Workers / OpenNext) |
|---|---|---|
| Runtime | Node.js | Cloudflare Workers (`workerd`) |
| Firebase | `firebase-admin` (`src/lib/firebase.js`) | **Firestore REST client** signed with `jose`, same file |
| Postgres driver | `@neondatabase/serverless` (neon‑http) | same — HTTP driver, Workers‑safe. **No `pg`.** |
| Auth JWTs | firebase‑admin | `jose` |
| Build tooling | `vercel` | `wrangler` + `@opennextjs/cloudflare` |
| Build output | `.next` / `.vercel` | `.open-next` / `.wrangler` |
| Env vars | on `process.env` at module load **and** request time | **only populated per‑request** (see gotcha) |

### Cloudflare‑only files (do not exist on `main`)
- `open-next.config.ts` — OpenNext adapter config
- `wrangler.jsonc` — Worker config (name, compat date, bindings)

### Files deleted on this branch (exist on `main`)
- `src/proxy.js` — must **stay deleted** here, and it is a *hard* constraint, not a
  preference. In **Next 16, Proxy (renamed from Middleware) runs on the Node.js
  runtime and the `runtime` config option is not available** (setting it throws).
  **OpenNext‑Cloudflare cannot run Node middleware** — `cf:build` fails with
  `ERROR Node.js middleware is not currently supported. Consider switching to Edge
  Middleware`. There is no edge escape hatch, so there is simply **no proxy on this
  branch**. Removing `proxyAuth` from it is not enough — the file must not exist.
  - **Casualty:** the Neon‑quota **auto‑maintenance gate** and `MAINTENANCE_MODE`
    kill‑switch lived in the proxy. `src/db/client.js` still calls `raiseQuotaFlag()`
    (harmless — writes a Redis flag with no reader). To restore graceful
    degradation, add the `isQuotaFlagRaised()` check to the crew **layout** (a
    server component, which runs fine on Workers), not a proxy.
  - **Auth gating** therefore stays where it already is: each section
    `layout.jsx`/`page.jsx` calls `auth()` + `redirect()`. Do not try to move it to
    a proxy. (A future edge‑gated design would need an edge‑safe **JWT‑only NextAuth
    split config**, since the DB‑backed `auth()` can't run on the edge.)

### `next.config.mjs` Cloudflare addition
Contains an `outputFileTracingIncludes` block that force‑includes
`node_modules/jose/dist/**` for `/api/**` routes. Without it the Workers bundler
can't resolve `jose`'s `workerd` export condition. Keep it.

### `package.json` differences (keep this branch's)
- `jose` instead of `firebase-admin`
- **no `pg`**
- `wrangler` + `@opennextjs/cloudflare` instead of `vercel`
- extra scripts: `cf:build`, `cf:preview`, `cf:deploy`
- `next` is **`^16.2.11` here, not `16.2.10` like `main`**. This is a hard
  requirement: **`@opennextjs/cloudflare@1.20.2` peer‑requires `next >=16.2.11`**
  (`npm install` errors with `ERESOLVE` on `16.2.10`). When a merge brings main's
  exact `16.2.10` pin, bump it back to `^16.2.11` during conflict resolution. If
  you upgrade OpenNext, re‑check its `next` peer range and bump `next` to match.

---

## Files that must stay Cloudflare's during a merge

When `git merge main` reports conflicts (or even when it auto‑merges), verify
these kept the **Cloudflare** version. If a conflict, take "ours":

```bash
git checkout --ours -- <file>   # while merging main INTO cloudflare, "ours" = cloudflare
git add <file>
```

- `src/lib/firebase.js` — **must remain the Firestore REST client.** If a merge
  ever pulls in `firebase-admin` here, the Worker build breaks. Verify with:
  ```bash
  git diff origin/cloudflare -- src/lib/firebase.js   # empty = still ours
  grep -c "firebase-admin" src/lib/firebase.js         # references only, not an import
  ```
- `package.json` — must keep `jose`/`wrangler`/`opennext`, **no** `firebase-admin`/`pg`:
  ```bash
  grep -E '"firebase-admin"|"pg":' package.json   # expect NO matches
  ```
- `next.config.mjs`, `vercel.json`
- `.gitignore` — this branch adds `.open-next`, `.wrangler`, `.dev.vars`. The
  common conflict is additive (main adds its own ignores); **keep both sides.**
- Ensure `src/proxy.js` stayed deleted, and `open-next.config.ts` /
  `wrangler.jsonc` are intact.

Everything else (pages, components, most API routes, `src/db/client.js`,
`src/app/shared/users.js`) should take `main`'s changes — *subject to the
runtime gotcha below.*

---

## The runtime gotcha: lazy‑init anything that reads env

**This is the one that bites.** On Cloudflare Workers, `process.env` is **not
populated at module‑evaluation time** — only once a request is being handled.
Any client constructed at module scope that reads env will throw when its module
is first evaluated at isolate init:

- `neon(process.env.DATABASE_URL)` → `No database connection string was provided to neon()`
- `Redis.fromEnv()` / `new Redis({ url: process.env.… })` → `Unable to find environment variable`

This 500s whatever imports that module. It's insidious because the **same code
works fine on Vercel** (Node has env at module load), so it sails through review
on `main` and only breaks here — and only when the import graph happens to
evaluate that module at init (e.g. `/crew`, whose layout runs `auth()`).

### The rule
**Never construct a DB or Redis client at module scope. Build it lazily on first
use**, so the env read happens inside a request.

### The pattern
```js
// ❌ breaks on Workers
const redis = Redis.fromEnv()

// ✅ lazy — reads env at first call, i.e. during a request
let _redis = null
function getRedis() {
  if (!_redis) _redis = Redis.fromEnv()
  return _redis
}
// then use getRedis().get(...) instead of redis.get(...)
```

`src/db/client.js` already does this for neon (a lazy `getDb()` behind a `Proxy`
so `import db` still works everywhere). `src/app/shared/users.js`, the PIREP
route, and every `src/app/api/**` Redis route have been converted. **New code
merged from `main` may reintroduce the eager pattern** — that's why the
post‑merge checklist greps for it.

### Fine as‑is (already lazy)
Clients built **inside a function** or as a **default parameter**
(`function f(redis = Redis.fromEnv())`) are evaluated per‑call (request time) and
do not need changing — e.g. `src/lib/maintenance-flag.js`,
`src/app/api/get-avatar/route.js`, the `src/app/api/chanda/*` helpers.

---

## The crew app renders client‑only

`/crew/*` is authenticated and `noindex`, so server rendering buys it nothing —
and it cost the Worker everything. Two separate CPU bills were being paid on
every request:

1. **Render.** Chakra v3 is CSS‑in‑JS, so each `<Box>` recomputes styles through
   Emotion during the SSR pass. A crew page renders hundreds of them; that was
   the ~270 ms of warm CPU per request.
2. **Module init.** React's Flight client evaluates **every client module the RSC
   payload references**, rendered or not — `requireModule` runs as the payload's
   `I` rows are parsed. So merely *naming* a Chakra‑importing component in the
   payload dragged Chakra, Emotion, react‑icons and recharts into a cold isolate.
   That was the ~2 s spike, and it is why per‑component `ssr: false` alone never
   fixed `/crew/dashboard`.

`src/components/crew-runtime/` closes both. Three `dynamic(..., { ssr: false })`
gates — `CrewRuntime` (providers), `CrewChrome` (nav + sidebar), `CrewPage` (a
registry of every page body) — plus `CareerChrome` for career mode. The Worker
renders a plain‑CSS skeleton from `skeletons.jsx` and nothing else; the browser
loads the real UI. Server files still do `auth()`, the redirects and the DB
reads, and hand plain JSON across the boundary, so gating and first‑paint data
are unchanged.

**The rule this imposes — the whole thing rests on it:**

> Every client component a `/crew` **server** file references must be a tiny gate
> module. A layout or page that imports a Chakra component directly — even one
> `<Box>` — re‑introduces the module‑init cost for its entire route.

So a crew `page.jsx` is server‑only and ends in `<CrewPage id="…" …props />`; its
markup lives in a sibling `*View.jsx` registered in `CrewPage.jsx`. Adding a page
means adding a registry entry, not an import.

Verify after any crew change — this is the cheap, decisive check:

```bash
npm run build
python3 - <<'EOF'
import glob, re
for p in sorted(glob.glob(".next/server/app/(crew)/**/page_client-reference-manifest.js", recursive=True)):
    mods = set(re.findall(r'"([^"]*node_modules[^"]*?)"', open(p, encoding='utf8', errors='ignore').read()))
    bad = {m for m in mods if 'chakra' in m or 'emotion' in m}
    print(len(bad), p)
EOF
# every crew route must print 0
```

---

## Cache Components: strip it every merge

`main` uses Next 16 Cache Components; this branch does not (see the warning up
top for *why*). Every merge that touches a cached read needs this conversion.
It is mechanical once you know the moves.

### 1. Kill the flag
In `next.config.mjs`, ensure there is **no** `cacheComponents: true` and **no**
`experimental.hideLogsAfterAbort` (that flag only exists to quiet Cache
Components build noise). Keep the `outputFileTracingIncludes` jose block.

### 2. Convert every `'use cache'` file back to `unstable_cache`
Find them:
```bash
git grep -l "use cache" -- 'src/**'          # must end up empty (comments aside)
git grep -nE "cacheLife|cacheTag|updateTag" -- 'src/**'   # cacheComponents-only APIs — must be empty
```
The clean trick: the commit that introduced Cache Components on `main` (find it
with `git log --oneline main -- <file>`) usually *only* swapped `unstable_cache`
→ `'use cache'`. Checking out that commit's **parent** gives you the file with
all its other history but the pre‑Cache‑Components caching intact:
```bash
git checkout <cacheComponents-commit>^ -- path/to/file.jsx
```
⚠️ **Verify the parent didn't drop an export other files import.** On the
2026‑07‑22 merge, `fleetModule.js`'s Cache Components commit *also* added
`fetchModuleValueFresh` (used by the gate routes), so a blind parent‑checkout
broke the build. When in doubt, hand‑convert: wrap the fetch in `unstable_cache`
and keep every export main added.

`unstable_cache` shape (tags let `revalidateTag()` bust it, same as before):
```js
export const getThing = unstable_cache(
  async () => db.select()…,
  ['thing-key'],
  { revalidate: 86400, tags: ['thing'] },
);
// per-arg caching: wrap and call — unstable_cache(fn, [key, arg], {tags:[`thing-${arg}`]})()
```

### 3. Keep `connection()` on DB‑reading pages — this is the subtle one
`main` removed the crew layout's `auth()` (commit 680bd5c), so pages under
`(crew)` are **no longer forced dynamic by the layout**. Under Cache Components a
DB read must be `'use cache'` *or* dynamic, so `main` added `await connection()`
(from `next/server`) to the cached‑read pages. **With the flag stripped,
`connection()` is what still keeps them from prerendering against a build‑time DB
and crashing the build** (`No database connection string was provided to neon()`
during "Generating static pages"). It is a general Next API (not Cache
Components‑gated), so **keep it.** Confirm parity with `main`:
```bash
comm -23 <(git grep -l "await connection()" main  -- 'src/**' | sed 's|^main:||' | sort) \
         <(git grep -l "await connection()"       -- 'src/**' | sort)
# ^ prints files that have connection() on main but NOT here — add it to each.
```
As of 2026‑07‑22 that set is: `api/fleet`, `api/routes`, `crew/admin/fleet`,
`crew/admin/rotw`, `crew/admin/routes` (page.server), `crew/admin/statistics`,
`crew/routes`. Pages that gate with `auth()` (dashboard, pireps) are already
dynamic and don't need it.

### 4. Rebuild
`npx next build` must reach a full manifest with those pages marked `ƒ (Dynamic)`,
**not** fail during "Generating static pages". Then run `npm run cf:build` — only
that catches Workers‑only failures like the Node‑middleware error above.

---

## Step‑by‑step merge

1. **Start clean**
   ```bash
   git checkout cloudflare && git pull
   git status            # working tree must be clean
   ```
2. **Merge**
   ```bash
   git merge main
   ```
3. **Resolve conflicts.** Usually only `.gitignore`. For any platform file listed
   above, keep the Cloudflare side (`git checkout --ours -- <file>`). For feature
   files, take the merged/main content. Then confirm nothing platform‑specific
   leaked:
   ```bash
   grep -E '"firebase-admin"|"pg":' package.json          # none
   git diff origin/cloudflare -- src/lib/firebase.js       # empty
   test -f src/proxy.js && echo "PROXY LEAKED BACK" || echo ok
   ```
4. **Re‑sync the lockfile.** A merge can leave `package-lock.json` inconsistent,
   and missing transitive deps (e.g. recharts→d3) make `npm ci` fail the build:
   ```bash
   npm install --package-lock-only
   npm ci --dry-run        # must exit 0, no "Missing … from lock file"
   ```
   > Don't hand‑edit the lockfile. Regenerating from `package.json` keeps pinned
   > versions (`@opennextjs/cloudflare`, `next`, `wrangler`) unchanged and only
   > fills in the missing transitive deps.
5. **Hunt the runtime gotcha** — the most important step:
   ```bash
   grep -rnE "^(const|let|var) +[A-Za-z0-9_]+ *= *(new Redis\(|Redis\.fromEnv\(|neon\()" src
   ```
   Convert every hit to the lazy `getRedis()` / `getDb()` pattern.
6. **Strip Cache Components** — see
   [the section above](#cache-components-strip-it-every-merge): kill the flag,
   convert `'use cache'` → `unstable_cache`, and restore `connection()` parity.
7. **Verify the build twice**
   ```bash
   npx next build          # must reach a full manifest, no "Generating static
                           # pages" DB crash. Local env not required.
   npm run cf:build        # the Workers bundle — the ONLY check that catches
                           # Node-middleware / jose-resolution / bundling failures.
                           # Success = ".open-next/worker.js" written.
   ```
   > `npx next build` passing is necessary but **not sufficient** — it happily
   > builds things `cf:build` then rejects (e.g. a leaked `src/proxy.js`). Always
   > run both.
8. **(Optional) Smoke‑test under real `workerd`** before pushing:
   ```bash
   # .dev.vars (gitignored) with DATABASE_URL + UPSTASH_* + AUTH_SECRET + AUTH_TRUST_HOST
   npm run cf:preview
   curl -s -X POST localhost:8787/api/validate-callsign \
     -H 'content-type: application/json' -d '{"callsign":"INVA005"}'   # -> {"valid":true}
   ```
   This is the definitive test — it caught the 2026‑07‑22 login regression
   (`validate-callsign` works here even though a plain `node` DB test is
   sandbox‑blocked). Delete `.dev.vars` when done if you don't want secrets on disk.
9. **Commit & push**
   ```bash
   git commit
   git push origin cloudflare
   ```
10. **Deploy & smoke‑test.** `npm run cf:deploy` (or the Workers build). Check
    `/crew` login, the dashboard, and a page that reads Redis (leaderboard/stats).

---

## Post‑merge checklist

- [ ] Conflicts resolved; platform files kept Cloudflare's version
- [ ] `grep '"firebase-admin"\|"pg":' package.json` → no matches
- [ ] `src/lib/firebase.js` unchanged from cloudflare; `src/proxy.js` still gone
- [ ] `open-next.config.ts`, `wrangler.jsonc`, the `next.config.mjs` jose block intact
- [ ] `next` bumped back to `^16.2.11` (not main's `16.2.10`); `cacheComponents` flag gone
- [ ] **No `'use cache'`** left (`git grep "use cache" -- 'src/**'` empty); no `cacheLife`/`cacheTag`/`updateTag`
- [ ] `connection()` parity with main restored on DB‑reading pages (comm check above)
- [ ] `npm install --package-lock-only` run; `npm ci` (or `--dry-run`) exits 0
- [ ] **No module‑scope `neon(`/`new Redis(`/`Redis.fromEnv(`** (grep above)
- [ ] `npx next build` compiles **and** `npm run cf:build` writes `.open-next/worker.js`
- [ ] Every row of the [cloudflare‑only patch ledger](#the-cloudflareonly-patch-ledger)
      still holds (`git diff --stat main..cloudflare` — a file that *disappeared*
      from the diff means main's version overwrote ours)
- [ ] No new `fetch()` to a raw IP or non‑standard port; no streamed response bodies
- [ ] New cron? `wrangler.jsonc triggers.crons` **and** `worker.js CRON_ROUTES` both updated
- [ ] Deployed and `/crew` login + a DB page + a Redis page load without 500s

---

## Env / secrets

The Worker needs the same secrets as Vercel — at minimum `DATABASE_URL`,
`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, the `AUTH_*` / NextAuth
secrets, Discord tokens, and the `FIREBASE_*` values used by the Firestore REST
client. Set them with `wrangler secret put <NAME>` (or the Cloudflare dashboard);
they persist across deploys. A missing secret produces the *same* error text as
the module‑scope bug above (`No database connection string`, `Unable to find
environment variable`) — if a lazy‑init fix doesn't resolve a 500, check that the
secret is actually set on the Worker.

---

## The 3 MiB Worker size limit (Free plan)

**This is a deploy-time gate, not a build-time one.** `next build` and
`npm run cf:build` both pass happily and *then* `wrangler deploy` fails with:

```
✘ [ERROR] Your Worker failed validation because it exceeded size limits.
   - Your Worker exceeded the size limit of 3 MiB. [code: 10027]
```

The limit is on the **gzipped** script (3072 KiB). Assets in
`.open-next/assets` don't count — only the worker bundle.

**Why it nearly bit us.** OpenNext emits an already-minified
`.open-next/server-functions/default/handler.mjs` (~2.5k very long lines).
Wrangler then re-bundles it with its *own* esbuild pass, which **pretty-prints
that code back out** — the handler expands to ~202k lines inside `worker.js`,
taking the upload from 10.0 MB to 14.5 MB raw and **3131 KiB gzipped, 60 KiB
over the limit**. Nothing in the app had actually grown by 4 MB; the merge just
nudged an already-marginal bundle past the edge.

**The fix, already applied:** `"minify": true` in `wrangler.jsonc`. That undoes
the re-printing (and mangles identifiers on top), giving **2790 KiB gzipped —
~282 KiB / 9% of headroom**. Keep this key through every merge (CRITICAL 5).

**Caveat worth knowing.** OpenNext deliberately sets `minifyIdentifiers: false`
in its own bundle ("stay safe by not renaming identifiers"), and `"minify": true`
overrides that intent for the final upload. It was smoke-tested under real
`workerd` (`wrangler dev --minify`) — login, NextAuth session/csrf/providers,
the Chakra-SSR pages, Neon and Redis routes all 200 with zero errors — but
**re-run that smoke test after any wrangler / Next / OpenNext upgrade**.

**Check before pushing** — the build log won't warn you:

```bash
npm run cf:build
npx wrangler deploy --dry-run --outdir /tmp/wout | grep "Total Upload"
# gzip must be < 3072 KiB
```

**If headroom runs out** (9% is not much — a few new heavy client-SSR'd
components could eat it):

1. Move client-only heavy components to `next/dynamic({ ssr: false })` so they
   leave the server bundle entirely (check `recharts`, `papaparse`,
   `react-frame-component`, `typed.js` — none are server-bundled today).
2. Add heavy barrel packages to `experimental.optimizePackageImports`.
3. **Upgrade to the Workers paid plan ($5/mo) → 10 MiB.** Honestly the robust
   answer if this becomes recurring; every option above is shaving percent.

To see what's actually big:

```bash
node -e "const m=require('./.open-next/server-functions/default/handler.mjs.meta.json');
for(const [k,v] of Object.entries(m.outputs)) if(k.endsWith('handler.mjs')&&v.inputs)
  Object.entries(v.inputs).map(([f,i])=>[f,i.bytesInOutput]).sort((a,b)=>b[1]-a[1])
    .slice(0,25).forEach(([f,b])=>console.log((b/1024).toFixed(0).padStart(7)+' KiB  '+f));"
```

---

## Reducing `/crew` Worker compute (and the `staleTimes` lever)

Most compute on this deployment comes from **`/crew/*`**. Understanding what is and
isn't reducible on Workers matters, because the obvious playbook (the Vercel
"Phase B" of proxy‑gating pages into static shells) **does not apply here.**

### Why static crew shells are off the table
1. **No proxy/middleware** to gate at (see the `src/proxy.js` section) — so the
   only place to gate is inside the render, which forces the route dynamic.
2. The crew shells are **per‑user**: every section layout feeds `callsign` /
   `isAdmin` / `careerMode` into `ResponsiveCrewLayout`. A "static" shell would
   have to move that to client‑side `useSession`.
3. Making them static therefore requires **client‑side gating**, which means a
   logged‑out visitor briefly sees the crew chrome before redirect. Product
   decision (2026‑07‑22): **not acceptable — keep instant server‑side redirects.**

So crew pages stay **dynamic (per‑request Worker render)**, and the dominant cost —
per‑user dashboard/pireps **Chakra SSR** — is irreducible without either static
shells (rejected) or a Cloudflare **paid plan** (edge error/transform features).

### What we *do* instead (the safe lever): cache to cut repeat invocations
Keep server gating; reduce how often the Worker runs. This is the committed
"Phase B" (commit `01f3d27`):
- **Shared, non‑per‑user reads → `CDN-Cache-Control`** so Cloudflare's edge answers
  repeats (e.g. `chanda/stats` edge **1 week**; `stats` edge **1 month**; already
  done in round 1 for fleet/routes/leaderboard/events/notams). **Rule of thumb: any
  GET with no `auth()` and no per‑user input is an edge‑cache candidate.** Retention
  is tuned to data volatility, not a single value — pick from how often the data
  actually changes and whether a stale window is acceptable (no edge purge is wired,
  so an edge TTL is a hard staleness ceiling).
- **Slow‑changing per‑user reads → `Cache-Control: private, max-age=N`** so the
  *browser* (never a shared cache) skips the Worker on repeat/soft‑nav. Current
  policy: `users/badges` **~forever** (1y — badges also come from the server prop, so
  new ones still show on full load), `chanda/lotus/status` **1 month** (monthly
  billing), `user-rank` 300s, the expensive external `if-last-flight`/`if-last-atc`
  120s. Private caches have **no server‑side bust** — size the window to how long a
  stale value is tolerable.
- **Watch for client fetches that defeat it:** a caller doing
  `fetch(url, { cache: 'no-store' })` (or `no-cache`/`Pragma`) nullifies the
  header. Grep for those when you add a cache header.

### Future option: `experimental.staleTimes` (not enabled yet)
`staleTimes` controls how long Next's **client‑side Router Cache** reuses an
already‑fetched RSC payload before refetching on navigation. Default for
dynamically‑rendered routes is `0` (every soft‑nav back to a crew page re‑hits the
Worker to re‑render). Setting a small window makes intra‑app navigation reuse the
cached render:

```js
// next.config.mjs
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@chakra-ui/react'],
    staleTimes: { dynamic: 30, static: 180 },  // seconds
  },
};
```

**How we'd use it:** the crew app has a lot of back‑and‑forth navigation
(dashboard ⇄ routes ⇄ pireps). With `dynamic: 30`, navigating away and back within
30 s reuses the client‑cached page instead of triggering another Worker render —
a direct cut to repeat SSR, the biggest remaining `/crew` cost. It is **config‑only,
keeps server gating, and makes nothing static** (unlike the shell approach).

**The tradeoff to weigh before enabling:** it's client‑side staleness. Just‑filed
PIREP not showing on the dashboard for up to 30 s; a rank/permission change lagging
on a back‑nav. Mitigations: keep the window short (15–30 s), and any action that
mutates data can call `router.refresh()` to force a fresh render immediately. It is
**distinct from prefetch** (which round 1 disabled to stop a prefetch storm) —
`staleTimes` only governs reuse *after an actual navigation*, so it won't
reintroduce that storm.

**Status:** left **off** pending sign‑off on the staleness tradeoff. Enable by
adding the `staleTimes` block above, then `next build` + `cf:build` + a soft‑nav
smoke test (confirm no Worker hit on a within‑window back‑navigation via
`wrangler tail` / network panel).
