// Custom Worker entry. `wrangler.jsonc` points `main` here instead of directly
// at .open-next/worker.js so we can add a `scheduled()` handler for Cloudflare
// Cron Triggers — the OpenNext-generated worker only exports `fetch`, and on
// Workers there is no Vercel Cron runner to fire the /api/*/cron routes.
//
// The fetch path is delegated untouched to OpenNext. Cron work is NOT duplicated
// here: the scheduled handler makes one authenticated in-process request back
// through OpenNext's own fetch pipeline, so the existing Next route handlers run
// exactly as they do for a real HTTP hit.
import openNext from "./.open-next/worker.js";

// wrangler binds Durable Objects by class name from whatever module `main`
// resolves to, so the three OpenNext relies on (incremental-cache queue, sharded
// tag cache, R2 bucket purge) must be re-exported from here as well.
export {
  DOQueueHandler,
  DOShardedTagCache,
  BucketCachePurge,
} from "./.open-next/worker.js";

// Each key must stay byte-identical to its `triggers.crons` entry in
// wrangler.jsonc — Cloudflare dispatches scheduled events by the exact cron
// expression string, and an unmapped expression is a silent no-op.
const CRON_ROUTES = {
  "0 3 * * *": "/api/leaderboard/cron", // daily 03:00 UTC — leaderboard cache has a 24h TTL
  "0 4 1 * *": "/api/badges/cron",      // 1st of the month 04:00 UTC — monthly badge recompute
};

export default {
  // Delegate every request to the OpenNext handler unchanged. `fetch` doesn't
  // rely on `this`, so passing the method reference directly is safe.
  fetch: openNext.fetch,

  async scheduled(event, env, ctx) {
    const path = CRON_ROUTES[event.cron];
    if (!path) {
      console.error(`[cron] no route mapped for "${event.cron}"`);
      return;
    }

    // The Bearer token is what each cron route's isAuthorized() check expects.
    // It also means the public URL stays protected: once CRON_SECRET is set,
    // manual/anonymous hits to /api/*/cron are rejected, but this trusted
    // in-process call carries the secret. Host is irrelevant — OpenNext routes
    // by pathname, and AUTH_TRUST_HOST is already set in wrangler vars.
    const req = new Request(`https://cron.internal${path}`, {
      headers: { authorization: `Bearer ${env.CRON_SECRET ?? ""}` },
    });

    ctx.waitUntil(
      openNext
        .fetch(req, env, ctx)
        .then(async (res) => {
          if (res.ok) {
            console.log(`[cron] ${path} ok (${res.status})`);
          } else {
            console.error(`[cron] ${path} -> ${res.status}: ${await res.text()}`);
          }
        })
        .catch((err) => console.error(`[cron] ${path} threw`, err)),
    );
  },
};
