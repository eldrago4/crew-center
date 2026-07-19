import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

let cachedStaff = null;
let cachedStaffAt = 0;
const STAFF_CACHE_TTL_MS = 10 * 60 * 1000; // re-read Redis so staff changes propagate across warm instances

export async function getStaff() {
  if (cachedStaff && (Date.now() - cachedStaffAt) < STAFF_CACHE_TTL_MS) {
    return cachedStaff;
  }
  try {
    const data = await redis.json.get('staff');
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

    await redis.json.set('staff', '$', jsonData);

    cachedStaff = null;

    return { success: true, message: 'Staff data updated successfully.' };
  } catch (error) {
    console.error('Error updating staff data in Redis:', error);
    return { success: false, message: 'Failed to update staff data.', error: error.message };
  }
}