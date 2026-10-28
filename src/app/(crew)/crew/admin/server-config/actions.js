'use server'

import { revalidateTag } from 'next/cache'
import { neon } from '@neondatabase/serverless'
import { auth } from '@/auth'
import { DB_MODE_KEY, backupConfigured, backupQuery, enterFailover } from '@/db/failover'
import { MAINTENANCE_KEY, QUOTA_FLAG_KEY, forgetSiteFlags, getRedis } from '@/lib/maintenance-flag'
import { CACHE_GROUPS } from './cache-groups'

// Server actions are reachable by anyone who can POST to the page, not just by
// the buttons that render for CEOs, so every one checks for itself.
async function requireCeo() {
    const session = await auth()
    if (!session?.user?.permissions?.includes('ceo')) throw new Error('Forbidden')
    return session.user.callsign
}

function fail(error) {
    return { ok: false, error: error?.message === 'Forbidden' ? 'Forbidden' : 'Something went wrong. Check the logs.' }
}

/** Everything the console shows, from Redis only — never touches a database. */
export async function getConsoleState() {
    await requireCeo()
    const redis = getRedis()
    if (!redis) {
        return { redis: false, maintenance: null, maintenanceTtl: -2, quota: false, quotaTtl: -2, dbMode: null }
    }
    const [maintenance, maintenanceTtl, quota, quotaTtl, dbMode] = await redis.pipeline()
        .get(MAINTENANCE_KEY)
        .ttl(MAINTENANCE_KEY)
        .exists(QUOTA_FLAG_KEY)
        .ttl(QUOTA_FLAG_KEY)
        .get(DB_MODE_KEY)
        .exec()
    return {
        redis: true,
        maintenance: maintenance ?? null,
        maintenanceTtl,
        quota: quota === 1,
        quotaTtl,
        dbMode: dbMode ?? null,
    }
}

const DURATIONS = new Set([0, 30, 60, 120, 360])

export async function startMaintenance({ message = '', minutes = 0 } = {}) {
    try {
        const by = await requireCeo()
        const duration = Number(minutes)
        if (!DURATIONS.has(duration)) return { ok: false, error: 'Pick one of the listed durations.' }
        const text = String(message).trim().slice(0, 300)
        const now = Date.now()
        const value = {
            message: text || null,
            until: duration ? new Date(now + duration * 60_000).toISOString() : null,
            by,
            at: new Date(now).toISOString(),
        }
        await getRedis().set(MAINTENANCE_KEY, value, duration ? { ex: duration * 60 } : undefined)
        forgetSiteFlags()
        return { ok: true }
    } catch (error) {
        console.error('[server-config] startMaintenance:', error)
        return fail(error)
    }
}

export async function endMaintenance() {
    try {
        await requireCeo()
        await getRedis().del(MAINTENANCE_KEY)
        forgetSiteFlags()
        return { ok: true }
    } catch (error) {
        console.error('[server-config] endMaintenance:', error)
        return fail(error)
    }
}

/** Lift the automatic Neon-quota maintenance before its 5-minute flag runs out. */
export async function clearQuotaFlag() {
    try {
        await requireCeo()
        await getRedis().del(QUOTA_FLAG_KEY)
        forgetSiteFlags()
        return { ok: true }
    } catch (error) {
        console.error('[server-config] clearQuotaFlag:', error)
        return fail(error)
    }
}

export async function refreshCaches(groupIds) {
    try {
        await requireCeo()
        const groups = CACHE_GROUPS.filter((g) => groupIds.includes(g.id))
        if (!groups.length) return { ok: false, error: 'Nothing selected.' }
        // 'max' marks the data stale rather than dropping it: visitors keep being
        // served while it reloads in the background, one request at a time.
        for (const tag of groups.flatMap((g) => g.tags)) revalidateTag(tag, 'max')
        return { ok: true }
    } catch (error) {
        console.error('[server-config] refreshCaches:', error)
        return fail(error)
    }
}

/**
 * Move the app onto the Supabase standby now. Coming back is the failback job's
 * call (scripts/db-failover), since writes made on Supabase have to be merged into
 * Neon first; it does that on its next run once Neon is healthy.
 */
export async function switchToStandby() {
    try {
        const by = await requireCeo()
        if (!backupConfigured) return { ok: false, error: 'No Supabase standby is configured.' }
        await enterFailover({ message: `Switched manually by ${by}` })
        return { ok: true }
    } catch (error) {
        console.error('[server-config] switchToStandby:', error)
        return fail(error)
    }
}

const HEALTH_TIMEOUT_MS = 8_000

async function timed(fn) {
    const started = performance.now()
    try {
        const detail = await Promise.race([
            fn(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timed out')), HEALTH_TIMEOUT_MS)),
        ])
        return { ok: true, ms: Math.round(performance.now() - started), detail: detail ?? null }
    } catch (error) {
        return { ok: false, ms: Math.round(performance.now() - started), error: String(error?.message ?? error).slice(0, 200) }
    }
}

/**
 * Ping each backing service directly, bypassing the failover routing so Neon is
 * checked even while the app is on Supabase. On demand only: pinging Neon wakes
 * its compute.
 */
export async function checkHealth() {
    try {
        await requireCeo()
        const [neonResult, redisResult, standby] = await Promise.all([
            timed(async () => {
                await neon(process.env.DATABASE_URL)`select 1`
            }),
            timed(async () => {
                await getRedis().ping()
            }),
            backupConfigured
                ? timed(async () => {
                    const [row] = await backupQuery(`
                        select (select value #>> '{}' from failover.meta where key = 'last_sync') as last_sync,
                               (select count(*)::int from failover.changelog) as unmerged`)
                    return row
                })
                : null,
        ])
        return { ok: true, checkedAt: new Date().toISOString(), neon: neonResult, redis: redisResult, standby }
    } catch (error) {
        console.error('[server-config] checkHealth:', error)
        return fail(error)
    }
}
