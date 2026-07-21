# The `cloudflare` branch — architecture & how to merge `main` into it

This branch deploys the app to **Cloudflare Workers** via the
[OpenNext Cloudflare adapter](https://opennext.js.org/cloudflare). It is a
long‑lived branch that **deliberately diverges** from `main` (which deploys to
Vercel). Feature work happens on `main` and is periodically merged down here.

Merging is *not* a plain fast‑forward: a handful of files must keep their
Cloudflare versions, and — more subtly — the Workers runtime has an environment
model that breaks common Node/Vercel patterns. Read this before every merge.

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
npx next build                    # must compile

# CRITICAL: scan for any NEW module-scope env access that main introduced
grep -rnE "^(const|let|var) +[A-Za-z0-9_]+ *= *(new Redis\(|Redis\.fromEnv\(|neon\()" src
# ^ every hit must be made lazy (see "The runtime gotcha")

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
- `src/proxy.js` — a Vercel‑only proxy; must **stay deleted** here.

### `next.config.mjs` Cloudflare addition
Contains an `outputFileTracingIncludes` block that force‑includes
`node_modules/jose/dist/**` for `/api/**` routes. Without it the Workers bundler
can't resolve `jose`'s `workerd` export condition. Keep it.

### `package.json` differences (keep this branch's)
- `jose` instead of `firebase-admin`
- **no `pg`**
- `wrangler` + `@opennextjs/cloudflare` instead of `vercel`
- extra scripts: `cf:build`, `cf:preview`, `cf:deploy`
- `next` pinned as `^16.2.10`

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
6. **Verify the build**
   ```bash
   npx next build          # must reach "Compiled successfully"
   ```
   (With lazy clients this now completes even without local env, since nothing
   touches the DB at build time.)
7. **Commit & push**
   ```bash
   git commit
   git push origin cloudflare
   ```
8. **Deploy & smoke‑test.** `npm run cf:deploy` (or the Workers build). Check
   `/crew`, the dashboard, and a page that reads Redis (leaderboard/stats).

---

## Post‑merge checklist

- [ ] Conflicts resolved; platform files kept Cloudflare's version
- [ ] `grep '"firebase-admin"\|"pg":' package.json` → no matches
- [ ] `src/lib/firebase.js` unchanged from cloudflare; `src/proxy.js` still gone
- [ ] `open-next.config.ts`, `wrangler.jsonc`, the `next.config.mjs` jose block intact
- [ ] `npm install --package-lock-only` run; `npm ci` (or `--dry-run`) exits 0
- [ ] **No module‑scope `neon(`/`new Redis(`/`Redis.fromEnv(`** (grep above)
- [ ] `npx next build` compiles
- [ ] Deployed and `/crew` + a DB page + a Redis page load without 500s

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
```
