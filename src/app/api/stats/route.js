import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import db from '@/db/client'
import { db as fireDb } from '@/lib/firebase'
import admin from 'firebase-admin'

// ── Helpers ─────────────────────────────────────────────────
function pad(label, width = 30) {
    return label.padEnd(width)
}

function fmt(n) {
    return Number(n).toLocaleString('en-IN')
}

function fmtHours(mins) {
    const h = Math.floor(mins / 60)
    const m = Math.round(mins % 60)
    return `${fmt(h)}h ${m}m`
}

function parseMonth(monthParam) {
    let year, month
    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
        [year, month] = monthParam.split('-').map(Number)
    } else {
        const now = new Date()
        const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        year = prev.getFullYear()
        month = prev.getMonth() + 1
    }
    return { year, month }
}

// ── Crew Center Statistics (Neon DB) ────────────────────────
async function getCrewCenterStats(year, month) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = month === 12
        ? `${year + 1}-01-01`
        : `${year}-${String(month + 1).padStart(2, '0')}-01`

    const result = await db.execute(sql`
        SELECT
            COUNT(*)::int                                     AS total_pireps,
            COALESCE(SUM(EXTRACT(EPOCH FROM "flightTime")), 0)  AS total_seconds,
            COUNT(DISTINCT "userId")::int                     AS active_pilots
        FROM pireps
        WHERE date >= ${startDate}
          AND date < ${endDate}
    `)

    const topPilots = await db.execute(sql`
        SELECT p."userId", u."ifcName", COUNT(*)::int AS cnt
        FROM pireps p
        JOIN users u ON u.id = p."userId"
        WHERE p.date >= ${startDate}
          AND p.date < ${endDate}
        GROUP BY p."userId", u."ifcName"
        ORDER BY cnt DESC
        LIMIT 5
    `)

    const topAircraft = await db.execute(sql`
        SELECT aircraft, COUNT(*)::int AS cnt
        FROM pireps
        WHERE date >= ${startDate}
          AND date < ${endDate}
        GROUP BY aircraft
        ORDER BY cnt DESC
        LIMIT 1
    `)

    const topRoute = await db.execute(sql`
        SELECT "departureIcao", "arrivalIcao", COUNT(*)::int AS cnt
        FROM pireps
        WHERE date >= ${startDate}
          AND date < ${endDate}
        GROUP BY "departureIcao", "arrivalIcao"
        ORDER BY cnt DESC
        LIMIT 1
    `)

    const busiestDay = await db.execute(sql`
        SELECT date, COUNT(*)::int AS cnt
        FROM pireps
        WHERE date >= ${startDate}
          AND date < ${endDate}
        GROUP BY date
        ORDER BY cnt DESC
        LIMIT 1
    `)

    const row = result.rows[0]
    const totalPireps = row.total_pireps
    const totalMinutes = Number(row.total_seconds) / 60
    const activePilots = row.active_pilots

    const daysInMonth = new Date(year, month, 0).getDate()
    const weeks = daysInMonth / 7
    const avgWeeklyPireps = totalPireps > 0 ? (totalPireps / weeks).toFixed(1) : '0'

    return {
        totalPireps, totalMinutes, activePilots, avgWeeklyPireps,
        topPilots: topPilots.rows,
        topAircraft: topAircraft.rows[0] || null,
        topRoute: topRoute.rows[0] || null,
        busiestDay: busiestDay.rows[0] || null,
    }
}

// ── Career Mode Statistics (Firebase) ───────────────────────
async function getCareerModeStats(monthStart, monthEnd) {
    const tsStart = admin.firestore.Timestamp.fromDate(monthStart)
    const tsEnd = admin.firestore.Timestamp.fromDate(monthEnd)

    const flightsSnap = await fireDb.collection('flights')
        .where('approvedAt', '>=', tsStart)
        .where('approvedAt', '<', tsEnd)
        .get()

    let totalFlights = 0
    let totalHours = 0
    let totalPassengers = 0
    let totalCargo = 0
    let totalEarnings = 0
    let totalFuelUsed = 0
    const pilotIds = new Set()
    const pilotEarnings = {}
    const aircraftCount = {}

    flightsSnap.forEach(doc => {
        const d = doc.data()
        totalFlights++
        totalHours += (d.flightTime || 0)
        totalPassengers += (d.passengers || 0)
        totalCargo += (d.cargo || 0)
        totalEarnings += (d.calculatedEarnings || 0)
        totalFuelUsed += (d.fuelUsed || 0)
        if (d.pilotId) {
            pilotIds.add(d.pilotId)
            if (!pilotEarnings[d.pilotId]) {
                pilotEarnings[d.pilotId] = { name: d.pilotName || d.pilotId, earnings: 0 }
            }
            pilotEarnings[d.pilotId].earnings += (d.calculatedEarnings || 0)
        }
        if (d.aircraft) {
            aircraftCount[d.aircraft] = (aircraftCount[d.aircraft] || 0) + 1
        }
    })

    const topEarners = Object.values(pilotEarnings)
        .sort((a, b) => b.earnings - a.earnings)
        .slice(0, 5)

    const mostFlownAircraft = Object.entries(aircraftCount)
        .sort((a, b) => b[1] - a[1])[0] || null

    const plansSnap = await fireDb.collection('flightplans')
        .where('completedAt', '>=', tsStart)
        .where('completedAt', '<', tsEnd)
        .get()

    let totalFuelExtra = 0
    let totalDistance = 0
    plansSnap.forEach(doc => {
        const d = doc.data()
        totalFuelExtra += (d.fuelExtra || 0)
        totalDistance += (d.distance || 0)
    })

    const avgFuelEfficiency = totalHours > 0 ? Math.round(totalFuelUsed / totalHours) : 0

    const aircraftSnap = await fireDb.collection('aircraft').get()
    const totalAircraft = aircraftSnap.size
    let activeAircraft = 0
    aircraftSnap.forEach(doc => {
        const d = doc.data()
        if (d.lastFlightDate) {
            const lastFlight = d.lastFlightDate.toDate ? d.lastFlightDate.toDate() : new Date(d.lastFlightDate)
            if (lastFlight >= monthStart && lastFlight < monthEnd) {
                activeAircraft++
            }
        }
    })
    const fleetUtil = totalAircraft > 0 ? ((activeAircraft / totalAircraft) * 100).toFixed(1) : '0'

    const sectorsSnap = await fireDb.collection('sectors')
        .where('status', '==', 'completed')
        .where('completedAt', '>=', tsStart)
        .where('completedAt', '<', tsEnd)
        .get()
    const completedSectors = sectorsSnap.size

    return {
        totalFlights, totalHours, activePilots: pilotIds.size,
        totalPassengers, totalCargo, totalEarnings,
        totalFuelUsed, totalFuelExtra,
        topEarners,
        mostFlownAircraft: mostFlownAircraft ? { name: mostFlownAircraft[0], count: mostFlownAircraft[1] } : null,
        totalDistance, avgFuelEfficiency,
        fleetUtil, activeAircraft, totalAircraft,
        completedSectors,
    }
}

// ── Format output ───────────────────────────────────────────
function formatOutput(monthLabel, cc, cm) {
    const lines = []
    const l = (s) => lines.push(s)

    l(`  Monthly Statistics — ${monthLabel}`)
    l('  ' + '═'.repeat(50))

    l(``)
    l(`  ┌─── Crew Center Statistics ───────────────────┐`)
    l(`  │  ${pad('PIREPs Filed')}${fmt(cc.totalPireps).padStart(14)}  │`)
    l(`  │  ${pad('Total Flight Hours')}${fmtHours(cc.totalMinutes).padStart(14)}  │`)
    l(`  │  ${pad('Avg Weekly PIREPs')}${cc.avgWeeklyPireps.padStart(14)}  │`)
    l(`  │  ${pad('Active Pilots')}${fmt(cc.activePilots).padStart(14)}  │`)
    l(`  │${''.padEnd(48)}│`)
    if (cc.topPilots.length > 0) {
        l(`  │  Top Pilots:${''.padEnd(36)}│`)
        cc.topPilots.forEach((p, i) => {
            const label = `    ${i + 1}. ${p.ifcName}`
            l(`  │  ${pad(label)}${(fmt(p.cnt) + ' pireps').padStart(14)}  │`)
        })
    }
    if (cc.topAircraft) {
        l(`  │  ${pad('Most Popular Aircraft')}${(cc.topAircraft.aircraft + ' (' + fmt(cc.topAircraft.cnt) + ')').padStart(8)}  │`)
    }
    if (cc.topRoute) {
        const route = `${cc.topRoute.departureIcao}→${cc.topRoute.arrivalIcao}`
        l(`  │  ${pad('Most Popular Route')}${(route + ' (' + fmt(cc.topRoute.cnt) + ')').padStart(14)}  │`)
    }
    if (cc.busiestDay) {
        const d = new Date(cc.busiestDay.date + 'T00:00:00Z')
        const dayLabel = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', timeZone: 'UTC' })
        l(`  │  ${pad('Busiest Day')}${(dayLabel + ' (' + fmt(cc.busiestDay.cnt) + ')').padStart(14)}  │`)
    }
    l(`  └────────────────────────────────────────────────┘`)

    l(``)
    l(`  ┌─── Career Mode Statistics ────────────────────┐`)
    l(`  │  ${pad('Flights')}${fmt(cm.totalFlights).padStart(14)}  │`)
    l(`  │  ${pad('Total Flight Hours')}${(fmt(cm.totalHours) + 'h').padStart(14)}  │`)
    l(`  │  ${pad('Active Pilots')}${fmt(cm.activePilots).padStart(14)}  │`)
    l(`  │  ${pad('Passengers Travelled')}${fmt(cm.totalPassengers).padStart(14)}  │`)
    l(`  │  ${pad('Cargo Dispatched')}${(fmt(cm.totalCargo) + ' kg').padStart(14)}  │`)
    l(`  │  ${pad('Human Resource Payout')}${('₹' + fmt(cm.totalEarnings)).padStart(14)}  │`)
    l(`  │  ${pad('Fuel Burnt')}${(fmt(cm.totalFuelUsed) + ' kg').padStart(14)}  │`)
    l(`  │  ${pad('Carry Over Fuel')}${(fmt(cm.totalFuelExtra) + ' kg').padStart(14)}  │`)
    l(`  │  ${pad('Total Distance Flown')}${(fmt(cm.totalDistance) + ' NM').padStart(14)}  │`)
    l(`  │  ${pad('Avg Fuel Efficiency')}${(fmt(cm.avgFuelEfficiency) + ' kg/h').padStart(14)}  │`)
    l(`  │  ${pad('Fleet Utilization')}${(cm.fleetUtil + '%').padStart(14)}  │`)
    l(`  │  ${pad('  (Active / Total)')}${(cm.activeAircraft + ' / ' + cm.totalAircraft).padStart(14)}  │`)
    l(`  │  ${pad('Completed Sectors')}${fmt(cm.completedSectors).padStart(14)}  │`)
    if (cm.mostFlownAircraft) {
        l(`  │  ${pad('Most Flown Aircraft')}${(cm.mostFlownAircraft.name + ' (' + fmt(cm.mostFlownAircraft.count) + ')').padStart(14)}  │`)
    }
    l(`  │${''.padEnd(48)}│`)
    if (cm.topEarners.length > 0) {
        l(`  │  Top Earners:${''.padEnd(35)}│`)
        cm.topEarners.forEach((e, i) => {
            const label = `    ${i + 1}. ${e.name}`
            l(`  │  ${pad(label)}${('₹' + fmt(e.earnings)).padStart(14)}  │`)
        })
    }
    l(`  └────────────────────────────────────────────────┘`)

    return lines.join('\n')
}

// ── In-memory cache ──────────────────────────────────────────
const statsCache = new Map() // key: 'YYYY-MM', value: { text, expiresAt }
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

// ── GET /api/stats?month=2026-01 ────────────────────────────
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const monthParam = searchParams.get('month')

        const { year, month } = parseMonth(monthParam)
        const cacheKey = `${year}-${String(month).padStart(2, '0')}`

        const cached = statsCache.get(cacheKey)
        if (cached && Date.now() < cached.expiresAt) {
            const format = searchParams.get('format')
            if (format === 'json') return NextResponse.json(cached.json)
            return new Response(cached.text, {
                headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            })
        }

        const monthStart = new Date(Date.UTC(year, month - 1, 1))
        const monthEnd = new Date(Date.UTC(year, month, 1))
        const monthLabel = monthStart.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })

        const [cc, cm] = await Promise.all([
            getCrewCenterStats(year, month),
            getCareerModeStats(monthStart, monthEnd),
        ])

        const text = formatOutput(monthLabel, cc, cm)
        const json = {
            month: monthLabel,
            // flat fields kept for backward-compat (home page)
            activePilots: cc.activePilots,
            totalPireps: cc.totalPireps,
            avgWeeklyPireps: Number(cc.avgWeeklyPireps),
            hoursFlown: Math.round(cc.totalMinutes / 60),
            // rich structured data for /stats page
            crewCenter: {
                totalPireps: cc.totalPireps,
                totalHours: Math.round(cc.totalMinutes / 60),
                activePilots: cc.activePilots,
                avgWeeklyPireps: Number(cc.avgWeeklyPireps),
                topPilots: cc.topPilots,
                topAircraft: cc.topAircraft,
                topRoute: cc.topRoute,
                busiestDay: cc.busiestDay,
            },
            careerMode: {
                totalFlights: cm.totalFlights,
                totalHours: cm.totalHours,
                activePilots: cm.activePilots,
                totalPassengers: cm.totalPassengers,
                totalCargo: cm.totalCargo,
                totalEarnings: cm.totalEarnings,
                totalFuelUsed: cm.totalFuelUsed,
                totalFuelExtra: cm.totalFuelExtra,
                totalDistance: Math.round(cm.totalDistance),
                avgFuelEfficiency: cm.avgFuelEfficiency,
                fleetUtil: cm.fleetUtil,
                activeAircraft: cm.activeAircraft,
                totalAircraft: cm.totalAircraft,
                completedSectors: cm.completedSectors,
                mostFlownAircraft: cm.mostFlownAircraft,
                topEarners: cm.topEarners,
            },
        }

        statsCache.set(cacheKey, { text, json, expiresAt: Date.now() + CACHE_TTL_MS })

        const format = searchParams.get('format')
        if (format === 'json') {
            return NextResponse.json(json)
        }
        return new Response(text, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
    } catch (error) {
        console.error('Stats API error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
