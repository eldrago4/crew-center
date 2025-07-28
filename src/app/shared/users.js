import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// Efficient async getter for dummyData
export async function getDummyData() {
  try {
    let baseUrl;

    if (process.env.VERCEL_ENV === 'production') {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    } else if (process.env.VERCEL_BRANCH_URL) {
      baseUrl = `https://${process.env.VERCEL_BRANCH_URL}`;
    } else {
      baseUrl = 'http://localhost:3000';
    }

    const res = await fetch(`${baseUrl}/api/users/login`);
    if (res.ok) {
      const json = await res.json();
      // Ensure json.data is an array and convert discordId to string
      if (Array.isArray(json.data)) {
        return json.data.map(u => ({
          callsign: u.callsign,
          // Convert discordId to string, handling potential null/undefined
          discordId: u.discordId != null ? String(u.discordId) : null
        }));
      } else {
        console.warn('API response "data" is not an array in getDummyData:', json);
        return [];
      }
    } else {
      console.error(`API request to /api/users/login failed: ${res.status} - ${res.statusText}`);
      // Optionally log response body for more details:
      // const errorBody = await res.text();
      // console.error('Error response body:', errorBody);
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
