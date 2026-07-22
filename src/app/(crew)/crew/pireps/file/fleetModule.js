import { unstable_cache, revalidateTag } from 'next/cache';
import db from '@/db/client';
import { crewcenter } from '@/db/schema';
import { eq } from 'drizzle-orm';

// All crewcenter module reads share one 5-minute cache — including multipliers and
// ifatcMultipliers, which used to hit Postgres on every single request. This branch
// keeps the durable unstable_cache layer (survives across instances and deploys)
// rather than Cache Components' 'use cache: remote', which on Cloudflare Workers
// would need an OpenNext incremental/tag cache wired up. Admin edits still land
// instantly EVERYWHERE: updateModuleValue revalidates the module's tag.
//
// A thrown DB error is never cached (the wrapped promise rejects and nothing is
// stored), so failures aren't pinned for the window — callers keep their own fallbacks.
async function fetchModuleValue(moduleName) {
  return unstable_cache(
    () => fetchModuleValueFresh(moduleName),
    [ 'crewcenter-module', moduleName ],
    { revalidate: 300, tags: [ `crewcenter-${moduleName}` ] }
  )();
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
