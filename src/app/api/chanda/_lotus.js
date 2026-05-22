import { Redis } from '@upstash/redis';
import { fetchDiscordAvatarUrl, grantRole, revokeRole, SUPPORTER_ROLE } from './_processPayment';

export const LOTUS_ROLE_ID = '1507426495163793680';
export const LOTUS_MEMBER_LIMIT = 4;
export const LOTUS_PRICE_RUPEES = 190;
export const LOTUS_MEMBERS_KEY = 'chanda:lotus:members';
export const LOTUS_SUBSCRIBERS_KEY = 'chanda:lotus:subscribers';

function istParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = type => parts.find(p => p.type === type)?.value;
  return {
    year: get('year'),
    month: get('month'),
    day: Number(get('day')),
  };
}

export function currentLotusMonth(date = new Date()) {
  const parts = istParts(date);
  return `${parts.year}-${parts.month}`;
}

export function lotusGraceActive(date = new Date()) {
  return istParts(date).day <= 7;
}

export function parseRedisJson(item) {
  try {
    return typeof item === 'string' ? JSON.parse(item) : item;
  } catch {
    return null;
  }
}

export async function getLotusMembers(redis = Redis.fromEnv()) {
  const rawMembers = await redis.lrange(LOTUS_MEMBERS_KEY, 0, 49);
  const byDiscordId = new Map();
  for (const item of rawMembers || []) {
    const member = parseRedisJson(item);
    if (!member?.discordId) continue;
    byDiscordId.set(String(member.discordId), {
      ...member,
      discordId: String(member.discordId),
      active: member.active !== false,
    });
  }
  return [...byDiscordId.values()];
}

export async function writeLotusMembers(redis, members) {
  const activeMembers = members.filter(m => m?.active !== false && m?.discordId);
  await redis.del(LOTUS_MEMBERS_KEY);
  if (activeMembers.length) {
    await redis.rpush(LOTUS_MEMBERS_KEY, ...activeMembers.map(m => JSON.stringify(m)));
  }
  await redis.set(LOTUS_SUBSCRIBERS_KEY, String(activeMembers.length));
  return activeMembers;
}

export async function reconcileLotusMembers(redis = Redis.fromEnv(), date = new Date()) {
  const members = await getLotusMembers(redis);
  const month = currentLotusMonth(date);
  const inGrace = lotusGraceActive(date);
  const active = [];
  const revoked = [];

  for (const member of members) {
    if (member.lastPaidMonth === month || inGrace) {
      active.push({ ...member, active: true });
      continue;
    }

    revoked.push(member);
    if (member.discordId) {
      await Promise.all([
        revokeRole(member.discordId, LOTUS_ROLE_ID),
        revokeRole(member.discordId, SUPPORTER_ROLE),
      ]);
    }
  }

  if (revoked.length) await writeLotusMembers(redis, active);
  return { members: active, revoked };
}

export async function activateLotusMember({ discordId, ifcName, paymentId }) {
  if (!discordId) throw new Error('Discord account is required');

  const redis = Redis.fromEnv();
  const month = currentLotusMonth();
  const idempotencyKey = `chanda:lotus:payment:${paymentId}`;
  const isNewPayment = await redis.set(idempotencyKey, '1', { nx: true, ex: 60 * 60 * 24 * 60 });
  if (!isNewPayment) return { ok: true, duplicate: true };

  const { members } = await reconcileLotusMembers(redis);
  const existingIndex = members.findIndex(m => String(m.discordId) === String(discordId));

  if (existingIndex === -1 && members.length >= LOTUS_MEMBER_LIMIT) {
    throw new Error('Lotus Privé is currently full');
  }

  const existing = existingIndex >= 0 ? members[existingIndex] : null;
  const avatarUrl = existing?.avatarUrl || await fetchDiscordAvatarUrl(discordId);
  const member = {
    ...(existing || {}),
    discordId: String(discordId),
    ifcName: ifcName || existing?.ifcName || 'Lotus Member',
    avatarUrl,
    joinedAt: existing?.joinedAt || Date.now(),
    lastPaidAt: Date.now(),
    lastPaidMonth: month,
    active: true,
  };

  if (existingIndex >= 0) members[existingIndex] = member;
  else members.push(member);

  await Promise.all([
    writeLotusMembers(redis, members),
    grantRole(discordId, SUPPORTER_ROLE),
    grantRole(discordId, LOTUS_ROLE_ID),
  ]);

  return { ok: true, member, slotsRemaining: Math.max(0, LOTUS_MEMBER_LIMIT - members.length) };
}

export async function getLotusStatus(discordId) {
  const redis = Redis.fromEnv();
  const { members } = await reconcileLotusMembers(redis);
  const member = members.find(m => String(m.discordId) === String(discordId));
  const month = currentLotusMonth();
  const needsPayment = !!member && member.lastPaidMonth !== month && lotusGraceActive();

  return {
    member: member || null,
    active: !!member,
    needsPayment,
    priceRupees: LOTUS_PRICE_RUPEES,
    month,
    slotsRemaining: Math.max(0, LOTUS_MEMBER_LIMIT - members.length),
  };
}
