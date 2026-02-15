import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { pgTable, char, varchar, bigint, interval, integer, text, date, boolean, numeric, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import admin from 'firebase-admin'

// ── ENV checks ──────────────────────────────────────────────
const required = ['DATABASE_URL', 'FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_CLIENT_ID']
for (const key of required) {
    if (!process.env[key]) {
        console.error(`Missing env var: ${key}`)
        process.exit(1)
    }
}

// ── Parse month arg (YYYY-MM) ───────────────────────────────
const monthArg = process.argv[2]
let year, month
if (monthArg && /^\d{4}-\d{2}$/.test(monthArg)) {
    [year, month] = monthArg.split('-').map(Number)
} else {
    const now = new Date()
    year = now.getFullYear()
    month = now.getMonth() + 1
}

const monthStart = new Date(Date.UTC(year, month - 1, 1))
const monthEnd = new Date(Date.UTC(year, month, 1))
const monthLabel = monthStart.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })

// ── Neon DB setup ───────────────────────────────────────────
const rankenum = pgEnum('rankenum', ['Yuvraj', 'Rajkumar', 'Rajvanshi', 'Rajdhiraj', 'Maharaja', 'Samrat', 'Chhatrapati'])

const users = pgTable('users', {
    id: char({ length: 7 }).primaryKey().notNull(),
    ifcName: varchar({ length: 20 }).notNull(),
    discordId: bigint({ mode: 'bigint' }),
    flightTime: interval({ precision: 0 }),
    rank: rankenum(),
})

const pireps = pgTable('pireps', {
    pirepId: integer().primaryKey(),
    flightNumber: text().notNull(),
    date: date().notNull(),
    flightTime: interval({ precision: 0 }).notNull(),
    departureIcao: text().notNull(),
    arrivalIcao: text().notNull(),
    operator: text().default('Indian Virtual').notNull(),
    aircraft: text().notNull(),
    multiplier: numeric(),
    comments: text(),
    userId: text().notNull(),
    valid: boolean(),
    updatedAt: timestamp({ mode: 'string' }),
    adminComments: text(),
})

const neonSql = neon(process.env.DATABASE_URL)
const db = drizzle(neonSql)

// ── Firebase setup ──────────────────────────────────────────
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            type: 'service_account',
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            client_id: process.env.FIREBASE_CLIENT_ID,
            auth_uri: 'https://accounts.google.com/o/oauth2/auth',
            token_uri: 'https://oauth2.googleapis.com/token',
            auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
            client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}`,
            universe_domain: 'googleapis.com',
        }),
    })
}
const fireDb = admin.firestore()

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

// ── Crew Center Statistics (Neon DB) ────────────────────────
async function getCrewCenterStats() {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = month === 12
        ? `${year + 1}-01-01`
        : `${year}-${String(month + 1).padStart(2, '0')}-01`

    // Core stats
    const result = await db.execute(sql`
        SELECT
            COUNT(*)::int                                     AS total_pireps,
            COALESCE(SUM(EXTRACT(EPOCH FROM "flightTime")), 0)  AS total_seconds,
            COUNT(DISTINCT "userId")::int                     AS active_pilots
        FROM pireps
        WHERE date >= ${startDate}
          AND date < ${endDate}
    `)

    // Top 3 pilots by pirep count
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

    // Most popular aircraft
    const topAircraft = await db.execute(sql`
        SELECT aircraft, COUNT(*)::int AS cnt
        FROM pireps
        WHERE date >= ${startDate}
          AND date < ${endDate}
        GROUP BY aircraft
        ORDER BY cnt DESC
        LIMIT 1
    `)

    // Most popular route
    const topRoute = await db.execute(sql`
        SELECT "departureIcao", "arrivalIcao", COUNT(*)::int AS cnt
        FROM pireps
        WHERE date >= ${startDate}
          AND date < ${endDate}
        GROUP BY "departureIcao", "arrivalIcao"
        ORDER BY cnt DESC
        LIMIT 1
    `)

    // Busiest day
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
async function getCareerModeStats() {
    const tsStart = admin.firestore.Timestamp.fromDate(monthStart)
    const tsEnd = admin.firestore.Timestamp.fromDate(monthEnd)

    // Flights
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
    const pilotEarnings = {} // pilotId -> { name, earnings }
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

    // Top 5 earners
    const topEarners = Object.values(pilotEarnings)
        .sort((a, b) => b.earnings - a.earnings)
        .slice(0, 5)

    // Most flown aircraft
    const mostFlownAircraft = Object.entries(aircraftCount)
        .sort((a, b) => b[1] - a[1])[0] || null

    // Flightplans — distance + fuelExtra
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

    // Avg fuel efficiency (kg/h)
    const avgFuelEfficiency = totalHours > 0 ? Math.round(totalFuelUsed / totalHours) : 0

    // Fleet utilization — aircraft that flew this month vs total aircraft
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

    // Completed sectors
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

// ── Main ────────────────────────────────────────────────────
async function main() {
    console.log(`\n  Monthly Statistics — ${monthLabel}`)
    console.log('  ' + '═'.repeat(50))

    const [cc, cm] = await Promise.all([
        getCrewCenterStats(),
        getCareerModeStats(),
    ])

    // ── Crew Center ──
    console.log(`\n  ┌─── Crew Center Statistics ───────────────────┐`)
    console.log(`  │  ${pad('PIREPs Filed')}${fmt(cc.totalPireps).padStart(14)}  │`)
    console.log(`  │  ${pad('Total Flight Hours')}${fmtHours(cc.totalMinutes).padStart(14)}  │`)
    console.log(`  │  ${pad('Avg Weekly PIREPs')}${cc.avgWeeklyPireps.padStart(14)}  │`)
    console.log(`  │  ${pad('Active Pilots')}${fmt(cc.activePilots).padStart(14)}  │`)
    console.log(`  │${''.padEnd(48)}│`)
    if (cc.topPilots.length > 0) {
        console.log(`  │  Top Pilots:${''.padEnd(36)}│`)
        cc.topPilots.forEach((p, i) => {
            const label = `    ${i + 1}. ${p.ifcName}`
            console.log(`  │  ${pad(label)}${(fmt(p.cnt) + ' pireps').padStart(14)}  │`)
        })
    }
    if (cc.topAircraft) {
        console.log(`  │  ${pad('Most Popular Aircraft')}${(cc.topAircraft.aircraft + ' (' + fmt(cc.topAircraft.cnt) + ')').padStart(14)}  │`)
    }
    if (cc.topRoute) {
        const route = `${cc.topRoute.departureIcao}→${cc.topRoute.arrivalIcao}`
        console.log(`  │  ${pad('Most Popular Route')}${(route + ' (' + fmt(cc.topRoute.cnt) + ')').padStart(14)}  │`)
    }
    if (cc.busiestDay) {
        const d = new Date(cc.busiestDay.date + 'T00:00:00Z')
        const dayLabel = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', timeZone: 'UTC' })
        console.log(`  │  ${pad('Busiest Day')}${(dayLabel + ' (' + fmt(cc.busiestDay.cnt) + ')').padStart(14)}  │`)
    }
    console.log(`  └────────────────────────────────────────────────┘`)

    // ── Career Mode ──
    console.log(`\n  ┌─── Career Mode Statistics ────────────────────┐`)
    console.log(`  │  ${pad('Flights')}${fmt(cm.totalFlights).padStart(14)}  │`)
    console.log(`  │  ${pad('Total Flight Hours')}${(fmt(cm.totalHours) + 'h').padStart(14)}  │`)
    console.log(`  │  ${pad('Active Pilots')}${fmt(cm.activePilots).padStart(14)}  │`)
    console.log(`  │  ${pad('Passengers Travelled')}${fmt(cm.totalPassengers).padStart(14)}  │`)
    console.log(`  │  ${pad('Cargo Dispatched')}${(fmt(cm.totalCargo) + ' kg').padStart(14)}  │`)
    console.log(`  │  ${pad('Human Resource Payout')}${('₹' + fmt(cm.totalEarnings)).padStart(14)}  │`)
    console.log(`  │  ${pad('Fuel Burnt')}${(fmt(cm.totalFuelUsed) + ' kg').padStart(14)}  │`)
    console.log(`  │  ${pad('Carry Over Fuel')}${(fmt(cm.totalFuelExtra) + ' kg').padStart(14)}  │`)
    console.log(`  │  ${pad('Total Distance Flown')}${(fmt(cm.totalDistance) + ' NM').padStart(14)}  │`)
    console.log(`  │  ${pad('Avg Fuel Efficiency')}${(fmt(cm.avgFuelEfficiency) + ' kg/h').padStart(14)}  │`)
    console.log(`  │  ${pad('Fleet Utilization')}${(cm.fleetUtil + '%').padStart(14)}  │`)
    console.log(`  │  ${pad('  (Active / Total)')}${(cm.activeAircraft + ' / ' + cm.totalAircraft).padStart(14)}  │`)
    console.log(`  │  ${pad('Completed Sectors')}${fmt(cm.completedSectors).padStart(14)}  │`)
    if (cm.mostFlownAircraft) {
        console.log(`  │  ${pad('Most Flown Aircraft')}${(cm.mostFlownAircraft.name + ' (' + fmt(cm.mostFlownAircraft.count) + ')').padStart(14)}  │`)
    }
    console.log(`  │${''.padEnd(48)}│`)
    if (cm.topEarners.length > 0) {
        console.log(`  │  Top Earners:${''.padEnd(35)}│`)
        cm.topEarners.forEach((e, i) => {
            const label = `    ${i + 1}. ${e.name}`
            console.log(`  │  ${pad(label)}${('₹' + fmt(e.earnings)).padStart(14)}  │`)
        })
    }
    console.log(`  └────────────────────────────────────────────────┘\n`)
}

main().catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
})
