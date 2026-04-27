import db from '@/db/client';
import { users, applicants } from '@/db/schema';
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

export async function getApplicantsData() {
  try {
    if (typeof window !== 'undefined') {
      throw new Error('function should only be called on the server');
    }
    const data = await db.select({ callsign: applicants.id, discordId: applicants.discordId }).from(applicants);
    return (data || []).map(a => ({
      callsign: a.callsign,
      discordId: a.discordId != null ? String(a.discordId) : null
    }));
  } catch (e) {
    console.error('Error fetching applicants from DB in getApplicantsData:', e);
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