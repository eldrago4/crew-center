import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export const dummyData = [ { callsign: "INVA011", discordId: "433143285847031838" }, { callsign: "INVA001", discordId: "10000000" } ];

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
    console.error(error);
    return null;
  }
}
