
import db from '@/db/client';
import { users } from '@/db/schema';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function getDummyData() {
  try {

    if (typeof window !== 'undefined') {
      throw new Error('function should only be called on the server');
    }
    const data = await db.select({ callsign: users.id, discordId: users.discordId }).from(users);
    return (data || []).map(u => ({
      callsign: u.callsign,
      discordId: u.discordId != null ? String(u.discordId) : null
    }));
  } catch (e) {
    console.error('Error fetching users from DB in getDummyData:', e);
    return [];
  }
}

let cachedStaff = null;

export async function getStaff() {
  if (cachedStaff) {
    return cachedStaff;
  }
  try {
    const data = await redis.json.get('staff');
    cachedStaff = data;
    return data;
  } catch (error) {
    console.error('Error fetching staff from Redis:', error);
    return null;
  }
}
