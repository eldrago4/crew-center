import { Redis } from '@upstash/redis';

// Lazy so Redis.fromEnv() reads UPSTASH_* at first use (request time) rather than at
// module load. On Cloudflare Workers (OpenNext) env isn't populated at isolate init, so
// a top-level fromEnv() throws "Unable to find environment variable". No-op on Vercel.
let _redis = null;
function getRedis() {
  if (!_redis) _redis = Redis.fromEnv();
  return _redis;
}

let cachedStaff = null;
let cachedStaffAt = 0;
const STAFF_CACHE_TTL_MS = 10 * 60 * 1000; // re-read Redis so staff changes propagate across warm instances

export async function getStaff() {
  if (cachedStaff && (Date.now() - cachedStaffAt) < STAFF_CACHE_TTL_MS) {
    return cachedStaff;
  }
  try {
    const data = await getRedis().json.get('staff');
    cachedStaff = data;
    cachedStaffAt = Date.now();
    return data;
  } catch (error) {
    console.error('Error fetching staff from Redis:', error);
    return null;
  }
}


export async function updateStaff(jsonData) {
  try {
    if (typeof window !== 'undefined') {
      throw new Error('updateStaff function should only be called on the server');
    }

    await getRedis().json.set('staff', '$', jsonData);

    cachedStaff = null;

    return { success: true, message: 'Staff data updated successfully.' };
  } catch (error) {
    console.error('Error updating staff data in Redis:', error);
    return { success: false, message: 'Failed to update staff data.', error: error.message };
  }
}