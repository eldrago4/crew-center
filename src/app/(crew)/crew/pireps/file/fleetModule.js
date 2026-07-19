import db from '@/db/client';
import { crewcenter } from '@/db/schema';
import { eq } from 'drizzle-orm';

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

// All crewcenter modules share the 5-minute cache — including multipliers and
// ifatcMultipliers, which used to sit in a NO_CACHE_MODULES set and hit Postgres
// on every single request. The filing page is prefetched/rendered far more often
// than multipliers change; admin edits still land within 5 minutes (and instantly
// on the instance that performed the edit, via invalidateCache in updateModuleValue).
async function fetchModuleValue(moduleName, forceRefresh = false) {
  const now = Date.now();
  const cached = cache.get(moduleName);

  if (!forceRefresh && cached && (now - cached.timestamp < CACHE_TTL)) {
    return cached.value;
  }

  try {
    return await fetchFromDatabase(moduleName);
  } catch (error) {
    console.error(`Error fetching module '${moduleName}':`, error);
    throw error;
  }
}

async function fetchFromDatabase(moduleName) {
  const result = await db.select().from(crewcenter).where(eq(crewcenter.module, moduleName));

  if (result.length === 0) {
    throw new Error(`Module '${moduleName}' not found`);
  }

  // Drizzle ORM with jsonb() type should already return a parsed JavaScript object/array.
  // No need for JSON.parse here.
  const value = result[ 0 ].value;

  cache.set(moduleName, { value: value, timestamp: Date.now() });

  return value;
}

async function fetchFleetModule(module, forceRefresh = false) {
  const data = await fetchModuleValue(module, forceRefresh);
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

    // Invalidate cache for the updated module to ensure fresh data on next fetch
    invalidateCache(moduleName);
  } catch (error) {
    console.error(`Error updating module '${moduleName}':`, error);
    throw error;
  }
}

function invalidateCache(moduleName) {
  if (moduleName) {
    cache.delete(moduleName);
  } else {
    cache.clear();
  }
}

export {
  fetchModuleValue,
  fetchFleetModule,
  updateModuleValue,
  invalidateCache
};
