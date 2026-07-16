import 'server-only';
import { unstable_cache } from 'next/cache';
import db from '@/db/client';
import { sql } from 'drizzle-orm';
import { AKASHARATHA_HOURS } from './constants';

// Credited hours are flightTime × multiplier — the same rule the PIREP approval
// route applies when it adds to users.flightTime (see api/users/pireps/route.js).
// Summing raw flightTime here would quietly disagree with every all-time total on
// the site. Only approved (valid) PIREPs count, matching what approval credits.
const CREDITED_SECONDS = sql`SUM(EXTRACT(EPOCH FROM p."flightTime") * COALESCE(p.multiplier, 1))`;

// Stats are read by a handful of staff and change only when a PIREP is approved,
// so they are cached rather than recomputed per request. Tagged so approval can
// revalidateTag('pireps') later without waiting out the window.
const CACHE = { revalidate: 600, tags: ['pireps'] };



// Weeks run Monday–Sunday. On a Monday the current week is only hours old and the
// board would read as empty, so the week that just closed is shown instead.
export function getStatsWeek(now = new Date()) {
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const dayOfWeek = today.getUTCDay(); // 0 Sun … 6 Sat
    const daysSinceMonday = (dayOfWeek + 6) % 7;

    const start = new Date(today);
    start.setUTCDate(today.getUTCDate() - daysSinceMonday);
    if (dayOfWeek === 1) start.setUTCDate(start.getUTCDate() - 7);

    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);

    return { start: toDateOnly(start), end: toDateOnly(end), isPreviousWeek: dayOfWeek === 1 };
}

function toDateOnly(d) {
    return d.toISOString().slice(0, 10);
}

export const getWeeklyTopPilots = unstable_cache(
    async (start, end) => {
        const rows = await db.execute(sql`
            SELECT u."ifcName" AS "ifcName",
                   u.id AS "callsign",
                   COUNT(*)::int AS "pireps",
                   ${CREDITED_SECONDS}::float8 AS "seconds"
            FROM pireps p
            JOIN users u ON u.id = p."userId"
            WHERE p.valid = true AND p.date >= ${start} AND p.date <= ${end}
            GROUP BY u.id, u."ifcName"
            ORDER BY "seconds" DESC NULLS LAST
            LIMIT 5
        `);
        return (rows.rows ?? rows).map(normalisePilot);
    },
    ['admin-stats-weekly-top-pilots'],
    CACHE,
);

export const getAkasharathaClub = unstable_cache(
    async () => {
        const rows = await db.execute(sql`
            SELECT u."ifcName" AS "ifcName",
                   u.id AS "callsign",
                   EXTRACT(EPOCH FROM u."flightTime")::float8 AS "seconds"
            FROM users u
            WHERE u."flightTime" > ${`${AKASHARATHA_HOURS} hours`}::interval
            ORDER BY u."flightTime" DESC
        `);
        return (rows.rows ?? rows).map(normalisePilot);
    },
    ['admin-stats-akasharatha-club'],
    CACHE,
);

// Headline totals for a single week. Separate from the top-5 query because that one
// is LIMITed — counting pilots or flights from five rows would undercount everyone
// outside the podium.
export const getWeekSummary = unstable_cache(
    async (start, end) => {
        const rows = await db.execute(sql`
            SELECT COUNT(*)::int AS "flights",
                   COUNT(DISTINCT p."userId")::int AS "pilots",
                   ${CREDITED_SECONDS}::float8 AS "seconds"
            FROM pireps p
            WHERE p.valid = true AND p.date >= ${start} AND p.date <= ${end}
        `);
        const r = (rows.rows ?? rows)[ 0 ] ?? {};
        return {
            flights: Number(r.flights) || 0,
            pilots: Number(r.pilots) || 0,
            hours: round1((Number(r.seconds) || 0) / 3600),
        };
    },
    ['admin-stats-week-summary'],
    CACHE,
);

export const getMonthlyActivity = unstable_cache(
    async (fromDate) => {
        const rows = await db.execute(sql`
            SELECT date_trunc('month', p.date)::date AS "monthStart",
                   COUNT(*)::int AS "flights",
                   ${CREDITED_SECONDS}::float8 AS "seconds"
            FROM pireps p
            WHERE p.valid = true AND p.date >= ${fromDate}
            GROUP BY 1
            ORDER BY 1
        `);
        return (rows.rows ?? rows).map((r) => ({
            monthStart: String(r.monthStart).slice(0, 10),
            flights: Number(r.flights) || 0,
            hours: round1((Number(r.seconds) || 0) / 3600),
        }));
    },
    ['admin-stats-monthly-activity'],
    CACHE,
);

// date_trunc('week') is Monday-based in Postgres, so these buckets line up with
// getStatsWeek above.
export const getWeeklyActivity = unstable_cache(
    async (fromDate) => {
        const rows = await db.execute(sql`
            SELECT date_trunc('week', p.date)::date AS "weekStart",
                   COUNT(*)::int AS "flights",
                   ${CREDITED_SECONDS}::float8 AS "seconds"
            FROM pireps p
            WHERE p.valid = true AND p.date >= ${fromDate}
            GROUP BY 1
            ORDER BY 1
        `);
        return (rows.rows ?? rows).map((r) => ({
            weekStart: String(r.weekStart).slice(0, 10),
            flights: Number(r.flights) || 0,
            hours: round1((Number(r.seconds) || 0) / 3600),
        }));
    },
    ['admin-stats-weekly-activity'],
    CACHE,
);

function normalisePilot(r) {
    return {
        ifcName: r.ifcName ?? '—',
        callsign: (r.callsign ?? '').trim(),
        pireps: r.pireps === undefined ? undefined : Number(r.pireps) || 0,
        hours: round1((Number(r.seconds) || 0) / 3600),
    };
}

function round1(n) {
    return Math.round(n * 10) / 10;
}

// Five Monday-aligned buckets ending with the stats week, with empty weeks filled
// in — a gap in the data must read as zero activity, not as a missing week that
// the line silently skips over.
export function buildActivitySeries(rows, weekEndingStart) {
    const byWeek = new Map(rows.map((r) => [r.weekStart, r]));
    const out = [];
    const cursor = new Date(`${weekEndingStart}T00:00:00Z`);
    cursor.setUTCDate(cursor.getUTCDate() - 7 * 4);

    for (let i = 0; i < 5; i++) {
        const key = toDateOnly(cursor);
        const hit = byWeek.get(key);
        out.push({
            weekStart: key,
            label: formatWeekLabel(key),
            flights: hit?.flights ?? 0,
            hours: hit?.hours ?? 0,
        });
        cursor.setUTCDate(cursor.getUTCDate() + 7);
    }
    return out;
}

export function formatWeekLabel(dateOnly) {
    const d = new Date(`${dateOnly}T00:00:00Z`);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

export function fiveWeeksBefore(weekStart) {
    const d = new Date(`${weekStart}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 7 * 4);
    return toDateOnly(d);
}

export function previousWeek(week) {
    const start = new Date(`${week.start}T00:00:00Z`);
    start.setUTCDate(start.getUTCDate() - 7);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);
    return { start: toDateOnly(start), end: toDateOnly(end) };
}

export function sixMonthsBefore(now = new Date()) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
    return toDateOnly(d);
}

// Six month buckets ending with the current month, gaps filled — same reasoning as
// the weekly series: a month with no flights must plot as zero, not vanish.
export function buildMonthlySeries(rows, now = new Date()) {
    const byMonth = new Map(rows.map((r) => [r.monthStart, r]));
    const out = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
        const key = toDateOnly(d);
        const hit = byMonth.get(key);
        out.push({
            monthStart: key,
            label: d.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' }),
            flights: hit?.flights ?? 0,
            hours: hit?.hours ?? 0,
        });
    }
    return out;
}
