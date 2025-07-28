import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function getDummyData() {
  try {
    let apiPath = '/api/users/login';
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
      apiPath = 'http://localhost:3000/api/users/login';
    }
    const res = await fetch(apiPath, {
      headers: {
        ...(typeof window === 'undefined' ? { Cookie: process.env.COOKIE || '' } : {})
      },
      cache: 'no-store',
    });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data)) {
        return json.data.map(u => ({
          callsign: u.callsign,
          discordId: u.discordId != null ? String(u.discordId) : null
        }));
      } else {
        console.warn('API response "data" is not an array in getDummyData:', json);
        return [];
      }
    } else {
      console.error(`API request to /api/users/login failed: ${res.status} - ${res.statusText}`);
    }
  } catch (e) {
    console.error('Error fetching users from DB in getDummyData:', e);
  }
  return [];
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
