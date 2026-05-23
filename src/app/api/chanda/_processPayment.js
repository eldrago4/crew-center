import { Redis } from '@upstash/redis';
import { DEFAULT_GOALS, GOALS_REDIS_KEY } from './_defaultGoals';

const GUILD_ID = '1246895842581938276';
const SUPPORTER_ROLE = '1502237694271557632';

async function fetchGoals(redis) {
  const raw = await redis.get(GOALS_REDIS_KEY);
  return raw
    ? (typeof raw === 'string' ? JSON.parse(raw) : raw)
    : DEFAULT_GOALS;
}

async function grantRole(discordId, roleId) {
  return fetch(
    `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}/roles/${roleId}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`, 'Content-Type': 'application/json' },
    }
  ).catch(() => { });
}

async function revokeRole(discordId, roleId) {
  return fetch(
    `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}/roles/${roleId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
    }
  ).catch(() => { });
}

async function fetchDiscordAvatarUrl(discordId) {
  try {
    const res = await fetch(`https://discord.com/api/v10/users/${discordId}`, {
      headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.avatar) return null;
    return `https://cdn.discordapp.com/avatars/${discordId}/${data.avatar}.webp?size=128`;
  } catch {
    return null;
  }
}

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
    { nx: true, ex: 60 * 60 * 24 * 30 }
  );
  if (!isNew) return;

  const amountRupees = Math.round(amountPaise / 100);
  const contributor = ifcName || 'Anonymous Pilot';

  if (goalId === 'all') {
    const goals = await fetchGoals(redis);
    const goalIds = goals.map(g => g.id);
    const raisedArr = await Promise.all(goalIds.map(id => redis.get(`chanda:goal:${id}:raised`)));

    // Skip goals that are fully funded
    let targets = goalIds.filter((id, i) => {
      const g = goals.find(x => x.id === id);
      return parseFloat(raisedArr[ i ] || '0') < (g?.target ?? Infinity);
    });
    if (targets.length === 0) targets = [ ...goalIds ]; // edge: all full

    const share = Math.floor(amountRupees / targets.length);
    const leftover = amountRupees - share * targets.length;

    await Promise.all([
      ...targets.map((id, idx) =>
        redis.incrbyfloat(`chanda:goal:${id}:raised`, share + (idx === 0 ? leftover : 0))
      ),
      redis.incr('chanda:total:contributors'),
      redis.lpush('chanda:contributions', JSON.stringify({
        paymentId, ifcName: contributor, goalId: 'all', amount: amountRupees, time: Date.now(), discordId: discordId || null,
      })),
    ]);
    await redis.ltrim('chanda:contributions', 0, 49);
  } else {
    await Promise.all([
      redis.incrbyfloat(`chanda:goal:${goalId}:raised`, amountRupees),
      redis.incr('chanda:total:contributors'),
      redis.lpush('chanda:contributions', JSON.stringify({
        paymentId, ifcName: contributor, goalId, amount: amountRupees, time: Date.now(), discordId: discordId || null,
      })),
    ]);
    await redis.ltrim('chanda:contributions', 0, 49);
  }

  // Notify staff channel about the new contribution (best-effort)
  try {
    const channelId = process.env.CHANDA_NOTIFY_CHANNEL_ID || '1288773676052779093';
    const content = `New contribution: ₹${amountRupees} to ${goalId} by ${contributor} (${discordId || 'anon'})\nPayment ID: ${paymentId}`;
    await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    }).catch(() => { });
  } catch (e) {
    // ignore notify errors
  }

  if (discordId) await grantRole(discordId, SUPPORTER_ROLE);
}

export { grantRole, revokeRole, fetchDiscordAvatarUrl, GUILD_ID, SUPPORTER_ROLE };
