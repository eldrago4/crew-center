import { Redis } from '@upstash/redis';

const GUILD_ID       = '1246895842581938276';
const SUPPORTER_ROLE = '1502237694271557632';

/**
 * Idempotently records a confirmed payment in Redis and grants Discord role.
 * Safe to call from both the client-side verify route and the server-side webhook.
 */
export async function processConfirmedPayment({ paymentId, goalId, amountPaise, ifcName, discordId }) {
  const redis = Redis.fromEnv();

  // Idempotency key — NX means only set if not exists; returns null if already set
  const isNew = await redis.set(
    `chanda:processed:${paymentId}`,
    '1',
    { nx: true, ex: 60 * 60 * 24 * 30 } // 30-day TTL
  );
  if (!isNew) return; // already processed, skip

  const amountRupees = Math.round(amountPaise / 100);

  await Promise.all([
    redis.incrbyfloat(`chanda:goal:${goalId}:raised`, amountRupees),
    redis.incr('chanda:total:contributors'),
    redis.lpush('chanda:contributions', JSON.stringify({
      ifcName: ifcName || 'Anonymous Pilot',
      goalId,
      amount:  amountRupees,
      time:    Date.now(),
    })),
  ]);
  await redis.ltrim('chanda:contributions', 0, 49);

  // Grant Discord Supporter role — non-fatal
  if (discordId) {
    fetch(
      `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}/roles/${SUPPORTER_ROLE}`,
      {
        method:  'PUT',
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    ).catch(() => {});
  }
}
