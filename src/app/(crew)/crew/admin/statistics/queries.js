import 'server-only';
import { unstable_cache } from 'next/cache';
import db from '@/db/client';
// firebase-admin can't run on Workers, so this branch's @/lib/firebase is a
// Firestore REST client. Timestamp is its stand-in for admin.firestore.Timestamp
// (fromDate just passes the Date through — the REST layer encodes it). Same swap
// this branch already made in src/app/api/stats/route.js.
import { db as fireDb, Timestamp } from '@/lib/firebase';
import { sql } from 'drizzle-orm';
import { AKASHARATHA_HOURS } from './constants';

// Raw flight time, deliberately NOT flightTime × multiplier. The multiplier is what
// api/users/pireps/route.js credits to users.flightTime, but these panels report time
// actually flown, and career flights carry no equivalent multiplier — mixing the two
// would make the crew-centre half of every total silently larger than the career half.
// The existing /api/stats route sums raw seconds for the same reason.
const RAW_SECONDS = sql`COALESCE(SUM(EXTRACT(EPOCH FROM p."flightTime")), 0)`;

// Stats change only when a PIREP or career flight is approved, so they are cached
// rather than recomputed per request. Firestore bills per document read, which makes
// the cache a cost control here and not just a latency one.
const CACHE = { revalidate: 600, tags: ['pireps'] };

// A pilot can fly both crew-centre and career, and career-mode users are created with
// callsign = the crew-centre users.id (see api/career-accept), so the callsign is the
// join key between the two systems.
const normaliseCallsign = (v) => String(v ?? '').trim().toUpperCase();

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

function round1(n) {
    return Math.round(n * 10) / 10;
}

// ── Crew centre (Neon) ───────────────────────────────────────────────────────

// Returns the pilot ids rather than a count: "pilots flying" has to be deduplicated
// against the career-mode set, and two COUNT(DISTINCT)s can't be added together
// without double-counting anyone who flew on both.
export const getNeonWeek = unstable_cache(
    async (start, end) => {
        const totals = await db.execute(sql`
            SELECT COUNT(*)::int AS "flights", ${RAW_SECONDS}::float8 AS "seconds"
            FROM pireps p
            WHERE p.valid = true AND p.date >= ${start} AND p.date <= ${end}
        `);
        const pilots = await db.execute(sql`
            SELECT DISTINCT p."userId" AS "callsign"
            FROM pireps p
            WHERE p.valid = true AND p.date >= ${start} AND p.date <= ${end}
        `);
        const t = (totals.rows ?? totals)[ 0 ] ?? {};
        return {
            flights: Number(t.flights) || 0,
            hours: round1((Number(t.seconds) || 0) / 3600),
            callsigns: (pilots.rows ?? pilots).map((r) => normaliseCallsign(r.callsign)),
        };
    },
    ['admin-stats-neon-week'],
    CACHE,
);

export const getNeonWeekPilots = unstable_cache(
    async (start, end) => {
        const rows = await db.execute(sql`
            SELECT u."ifcName" AS "ifcName",
                   u.id AS "callsign",
                   COUNT(*)::int AS "flights",
                   ${RAW_SECONDS}::float8 AS "seconds"
            FROM pireps p
            JOIN users u ON u.id = p."userId"
            WHERE p.valid = true AND p.date >= ${start} AND p.date <= ${end}
            GROUP BY u.id, u."ifcName"
        `);
        return (rows.rows ?? rows).map((r) => ({
            callsign: normaliseCallsign(r.callsign),
            ifcName: r.ifcName ?? null,
            flights: Number(r.flights) || 0,
            hours: round1((Number(r.seconds) || 0) / 3600),
        }));
    },
    ['admin-stats-neon-week-pilots'],
    CACHE,
);

// Buckets by day, so the same rows can be folded into weeks or months without a
// second trip to the database.
export const getNeonDaily = unstable_cache(
    async (fromDate) => {
        const rows = await db.execute(sql`
            SELECT p.date::text AS "day",
                   COUNT(*)::int AS "flights",
                   ${RAW_SECONDS}::float8 AS "seconds"
            FROM pireps p
            WHERE p.valid = true AND p.date >= ${fromDate}
            GROUP BY p.date
            ORDER BY p.date
        `);
        return (rows.rows ?? rows).map((r) => ({
            day: String(r.day).slice(0, 10),
            flights: Number(r.flights) || 0,
            hours: round1((Number(r.seconds) || 0) / 3600),
        }));
    },
    ['admin-stats-neon-daily'],
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
        return (rows.rows ?? rows).map((r) => ({
            ifcName: r.ifcName ?? '—',
            callsign: normaliseCallsign(r.callsign),
            hours: round1((Number(r.seconds) || 0) / 3600),
        }));
    },
    ['admin-stats-akasharatha-club'],
    CACHE,
);

// ── Career mode (Firestore) ──────────────────────────────────────────────────

// One fetch covering the longest window any panel needs, folded into weeks, months
// and per-pilot totals in memory. Firestore charges per document read, so querying
// once per cache window and reusing the rows costs a fraction of a query per panel.
// `flights` (not `pireps`) is the approved-flight collection — the same one
// /api/stats reads — and flightTime there is already a number of hours.
export const getCareerFlights = unstable_cache(
    async (fromDate) => {
        // No .select() projection: the REST client this branch uses has no such
        // method (it fetches full documents, as api/stats/route.js does). The
        // fields read below arrive in .data() regardless.
        const snap = await fireDb
            .collection('flights')
            .where('approvedAt', '>=', Timestamp.fromDate(new Date(`${fromDate}T00:00:00Z`)))
            .get();

        const out = [];
        snap.forEach((doc) => {
            const d = doc.data();
            // The REST client decodes a Firestore timestamp to a plain Date, which
            // has no .toDate(); admin.firestore.Timestamp did. Guard for both, the
            // idiom this branch already uses (api/stats/route.js). Without it every
            // flight fails the `!at` check below and the stats come back empty.
            const raw = d.approvedAt;
            const at = raw ? (raw.toDate ? raw.toDate() : new Date(raw)) : null;
            if (!at) return;
            out.push({
                day: toDateOnly(at),
                callsign: normaliseCallsign(d.pilotCallsign),
                name: d.pilotName || null,
                hours: Number(d.flightTime) || 0,
            });
        });
        return out;
    },
    ['admin-stats-career-flights'],
    CACHE,
);

// ── Folding ──────────────────────────────────────────────────────────────────

export function mondayOf(dateOnly) {
    const d = new Date(`${dateOnly}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    return toDateOnly(d);
}

export function firstOfMonth(dateOnly) {
    return `${dateOnly.slice(0, 7)}-01`;
}

function withinWeek(day, week) {
    return day >= week.start && day <= week.end;
}

// Crew-centre and career totals for one week, with pilots counted once across both.
export function combineWeek(neon, careerFlights, week) {
    const mine = careerFlights.filter((f) => withinWeek(f.day, week));
    const callsigns = new Set(neon.callsigns);
    let flights = 0;
    let hours = 0;
    for (const f of mine) {
        flights++;
        hours += f.hours;
        if (f.callsign) callsigns.add(f.callsign);
    }
    return {
        flights: neon.flights + flights,
        hours: round1(neon.hours + hours),
        pilots: callsigns.size,
        career: { flights, hours: round1(hours) },
        crew: { flights: neon.flights, hours: neon.hours },
    };
}

// One row per pilot, merging a pilot who flew on both. IFC name comes from the crew
// centre where it exists; a career-only pilot falls back to the name Firestore holds.
export function combineTopPilots(neonPilots, careerFlights, week, limit = 5) {
    const byCallsign = new Map();

    for (const p of neonPilots) {
        byCallsign.set(p.callsign, {
            callsign: p.callsign,
            ifcName: p.ifcName || p.callsign,
            flights: p.flights,
            hours: p.hours,
            career: { flights: 0, hours: 0 },
        });
    }

    for (const f of careerFlights) {
        if (!withinWeek(f.day, week)) continue;
        const key = f.callsign || `name:${f.name ?? 'unknown'}`;
        const hit = byCallsign.get(key) ?? {
            callsign: f.callsign || '',
            ifcName: f.name || f.callsign || 'Unknown pilot',
            flights: 0,
            hours: 0,
            career: { flights: 0, hours: 0 },
        };
        hit.flights += 1;
        hit.hours = round1(hit.hours + f.hours);
        hit.career.flights += 1;
        hit.career.hours = round1(hit.career.hours + f.hours);
        byCallsign.set(key, hit);
    }

    return [...byCallsign.values()]
        .sort((a, b) => b.hours - a.hours || b.flights - a.flights)
        .slice(0, limit);
}

// Five Monday-aligned buckets ending with the stats week, gaps filled — an empty week
// must read as zero activity, not as a week the line quietly skips.
export function buildWeeklySeries(neonDaily, careerFlights, weekStart) {
    const buckets = new Map();
    const cursor = new Date(`${weekStart}T00:00:00Z`);
    cursor.setUTCDate(cursor.getUTCDate() - 7 * 4);

    const keys = [];
    for (let i = 0; i < 5; i++) {
        const key = toDateOnly(cursor);
        keys.push(key);
        buckets.set(key, { flights: 0, hours: 0 });
        cursor.setUTCDate(cursor.getUTCDate() + 7);
    }

    const add = (day, flights, hours) => {
        const b = buckets.get(mondayOf(day));
        if (!b) return;
        b.flights += flights;
        b.hours += hours;
    };
    for (const r of neonDaily) add(r.day, r.flights, r.hours);
    for (const f of careerFlights) add(f.day, 1, f.hours);

    return keys.map((key) => ({
        label: formatWeekLabel(key),
        flights: buckets.get(key).flights,
        hours: round1(buckets.get(key).hours),
    }));
}

export function buildMonthlySeries(neonDaily, careerFlights, now = new Date()) {
    const buckets = new Map();
    const keys = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
        const key = toDateOnly(d);
        keys.push({ key, label: d.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' }) });
        buckets.set(key, { flights: 0, hours: 0 });
    }

    const add = (day, flights, hours) => {
        const b = buckets.get(firstOfMonth(day));
        if (!b) return;
        b.flights += flights;
        b.hours += hours;
    };
    for (const r of neonDaily) add(r.day, r.flights, r.hours);
    for (const f of careerFlights) add(f.day, 1, f.hours);

    return keys.map(({ key, label }) => ({
        label,
        flights: buckets.get(key).flights,
        hours: round1(buckets.get(key).hours),
    }));
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

export function sixMonthsBefore(now = new Date()) {
    return toDateOnly(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1)));
}

export function previousWeek(week) {
    const start = new Date(`${week.start}T00:00:00Z`);
    start.setUTCDate(start.getUTCDate() - 7);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);
    return { start: toDateOnly(start), end: toDateOnly(end) };
}

// The earliest date any panel needs, so Neon and Firestore are each read once.
export function earliestNeeded(week, now = new Date()) {
    const a = fiveWeeksBefore(week.start);
    const b = sixMonthsBefore(now);
    return a < b ? a : b;
}
