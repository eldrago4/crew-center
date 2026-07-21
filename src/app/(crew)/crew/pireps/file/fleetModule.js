import { cacheLife, cacheTag, revalidateTag } from 'next/cache';
import db from '@/db/client';
import { crewcenter } from '@/db/schema';
import { eq } from 'drizzle-orm';

// All crewcenter module reads share one 5-minute cache — including multipliers and
// ifatcMultipliers, which used to sit in a NO_CACHE_MODULES set and hit Postgres on
// every single request. Under Cache Components this is 'use cache: remote' (the
// durable platform cache shared across instances) instead of the old per-instance
// Map + Date.now() TTL — which also violated the new "no Date.now() before request
// data" rule and broke the /crew/admin/fleet build. Admin edits now land instantly
// EVERYWHERE: updateModuleValue revalidates the module's tag, where the old Map
// delete only refreshed the instance that performed the edit.
//
// A thrown DB error is never cached, so failures aren't pinned for the window —
// callers keep their own fallbacks.
async function fetchModuleValue(moduleName) {
  'use cache: remote'
  cacheLife({ revalidate: 300, expire: 3600 })
  cacheTag(`crewcenter-${moduleName}`)
  return fetchModuleValueFresh(moduleName);
}

// Uncached read, straight from Postgres. Use this for read-modify-write flows
// (gate-allocations, gate-briefing): reading a possibly-minutes-stale value and
// writing it back would silently clobber concurrent edits.
async function fetchModuleValueFresh(moduleName) {
  const result = await db.select().from(crewcenter).where(eq(crewcenter.module, moduleName));

  if (result.length === 0) {
    throw new Error(`Module '${moduleName}' not found`);
  }

  // Drizzle ORM with jsonb() type should already return a parsed JavaScript object/array.
  // No need for JSON.parse here.
  return result[ 0 ].value;
}

async function fetchFleetModule(module) {
  const data = await fetchModuleValue(module);
  // For 'fleet', data is already in { label, value } format
  return data;
}

async function updateModuleValue(moduleName, newValue) {
  try {
    await db.insert(crewcenter)
      .values({ module: moduleName, value: newValue })
      .onConflictDoUpdate({
        target: crewcenter.module,
        set: { value: newValue }
      });

    // Expire the cached read everywhere so the edit shows on the next request.
    // All writers are route handlers, where revalidateTag is the sanctioned API
    // (updateTag is Server-Action-only).
    revalidateTag(`crewcenter-${moduleName}`);
  } catch (error) {
    console.error(`Error updating module '${moduleName}':`, error);
    throw error;
  }
}

export {
  fetchModuleValue,
  fetchModuleValueFresh,
  fetchFleetModule,
  updateModuleValue
};
