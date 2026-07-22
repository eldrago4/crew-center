# The `cloudflare` branch — architecture & how to merge `main` into it

This branch deploys the app to **Cloudflare Workers** via the
[OpenNext Cloudflare adapter](https://opennext.js.org/cloudflare). It is a
long‑lived branch that **deliberately diverges** from `main` (which deploys to
Vercel). Feature work happens on `main` and is periodically merged down here.

Merging is *not* a plain fast‑forward: a handful of files must keep their
Cloudflare versions, and — more subtly — the Workers runtime has an environment
model that breaks common Node/Vercel patterns. Read this before every merge.

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

npx next build                    # must reach a full manifest
npm run cf:build                  # MUST also pass — catches Workers-only failures

git commit
git push origin cloudflare
npm run cf:deploy             # or let the Workers build deploy it
```

Then smoke‑test **`/crew`** and any page that talks to the DB or Redis.

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
