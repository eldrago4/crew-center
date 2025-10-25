import db from '@/db/client';
import { crewcenter } from '@/db/schema';
import { eq } from 'drizzle-orm';

const cache = new Map();

async function fetchModuleValue(moduleName) {
  if (cache.has(moduleName)) {
    return cache.get(moduleName).value;
  }

  try {
    const result = await db.select().from(crewcenter).where(eq(crewcenter.module, moduleName));

    if (result.length === 0) {
      throw new Error(`Module '${moduleName}' not found`);
    }

    // Drizzle ORM with jsonb() type should already return a parsed JavaScript object/array.
    // No need for JSON.parse here.
    const value = result[ 0 ].value;

    cache.set(moduleName, { value: value });

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
    await db.update(crewcenter)
      .set({ value: JSON.stringify(newValue) })
      .where(eq(crewcenter.module, moduleName));

    cache.set(moduleName, { value: newValue });
    console.log(`Module '${moduleName}' updated successfully.`);
  } catch (error) {
    console.error(`Error updating module '${moduleName}':`, error);
    throw error;
  }
}

export {
  fetchModuleValue,
  fetchFleetModule,
  updateModuleValue
};
