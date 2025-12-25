import db from '@/db/client';
import { crewcenter } from '@/db/schema';
import { eq } from 'drizzle-orm';

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

async function fetchModuleValue(moduleName, forceRefresh = false) {
  console.log(`[CACHE] Checking cache for module: ${moduleName}, forceRefresh: ${forceRefresh}`);

  const now = Date.now();
  const cached = cache.get(moduleName);

  if (!forceRefresh && cached && (now - cached.timestamp < CACHE_TTL)) {
    console.log(`[CACHE] Cache hit for ${moduleName}:`, cached.value);
    return cached.value;
  }

  console.log(`[CACHE] Cache miss/stale for ${moduleName}, fetching from database`);

  try {
    const result = await db.select().from(crewcenter).where(eq(crewcenter.module, moduleName));

    if (result.length === 0) {
      throw new Error(`Module '${moduleName}' not found`);
    }

    // Drizzle ORM with jsonb() type should already return a parsed JavaScript object/array.
    // No need for JSON.parse here.
    const value = result[ 0 ].value;

    cache.set(moduleName, { value: value, timestamp: now });
    console.log(`[CACHE] Stored in cache for ${moduleName}:`, value);

    return value;
  } catch (error) {
    console.error(`Error fetching module '${moduleName}':`, error);
    throw error;
  }
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

    // Invalidate cache for the updated module to ensure fresh data on next fetch
    invalidateCache(moduleName);
    console.log(`[CACHE] Module '${moduleName}' updated successfully.`);
  } catch (error) {
    console.error(`Error updating module '${moduleName}':`, error);
    throw error;
  }
}

function invalidateCache(moduleName) {
  if (moduleName) {
    cache.delete(moduleName);
    console.log(`[CACHE] Cache invalidated for module: ${moduleName}`);
  } else {
    cache.clear();
    console.log('[CACHE] All module caches invalidated');
  }
}

export {
  fetchModuleValue,
  fetchFleetModule,
  updateModuleValue,
  invalidateCache
};
