import { Box } from '@chakra-ui/react';
import StatisticsClient from './StatisticsClient';
import { connection } from 'next/server';
import {
    getStatsWeek,
    getNeonWeek,
    getNeonWeekPilots,
    getNeonDaily,
    getAkasharathaClub,
    getCareerFlights,
    combineWeek,
    combineTopPilots,
    buildWeeklySeries,
    buildMonthlySeries,
    previousWeek,
    earliestNeeded,
    formatWeekLabel,
} from './queries';

export const metadata = {
    title: 'Statistics — Indian Virtual',
    robots: { index: false, follow: false },
};

const EMPTY_NEON_WEEK = { flights: 0, hours: 0, callsigns: [] };

export default async function StatisticsPage() {
    // Staff-only access is already enforced by the admin layout.
    // connection(): the page starts from new Date() (forbidden before request data
    // under Cache Components) and reads only cached queries, which would otherwise
    // run at build time. Request-time is what this page has always been.
    await connection();
    const week = getStatsWeek();
    const prior = previousWeek(week);
    const from = earliestNeeded(week);

    let neonWeek = EMPTY_NEON_WEEK;
    let neonPrior = EMPTY_NEON_WEEK;
    let neonPilots = [];
    let neonDaily = [];
    let club = [];
    let careerFlights = [];
    let failed = false;
    let careerFailed = false;

    // Firestore is settled separately from Neon: career mode being unreachable (or
    // simply unconfigured in an environment) should cost the career half of the
    // numbers, not the whole page.
    const [ neonResult, careerResult ] = await Promise.allSettled([
        Promise.all([
            getNeonWeek(week.start, week.end),
            getNeonWeek(prior.start, prior.end),
            getNeonWeekPilots(week.start, week.end),
            getNeonDaily(from),
            getAkasharathaClub(),
        ]),
        getCareerFlights(from),
    ]);

    if (neonResult.status === 'fulfilled') {
        [ neonWeek, neonPrior, neonPilots, neonDaily, club ] = neonResult.value;
    } else {
        console.error('[ADMIN STATS] Crew centre stats failed:', neonResult.reason);
        failed = true;
    }

    if (careerResult.status === 'fulfilled') {
        careerFlights = careerResult.value;
    } else {
        console.error('[ADMIN STATS] Career mode stats failed:', careerResult.reason);
        careerFailed = true;
    }

    const summary = combineWeek(neonWeek, careerFlights, week);
    const priorSummary = combineWeek(neonPrior, careerFlights, prior);

    return (
        <Box p={{ base: '4', md: '6' }}>
            <StatisticsClient
                week={{
                    label: `${formatWeekLabel(week.start)} – ${formatWeekLabel(week.end)}`,
                    isPreviousWeek: week.isPreviousWeek,
                }}
                summary={summary}
                delta={{
                    flights: summary.flights - priorSummary.flights,
                    hours: Math.round((summary.hours - priorSummary.hours) * 10) / 10,
                    pilots: summary.pilots - priorSummary.pilots,
                }}
                topPilots={combineTopPilots(neonPilots, careerFlights, week)}
                club={club}
                weekly={buildWeeklySeries(neonDaily, careerFlights, week.start)}
                monthly={buildMonthlySeries(neonDaily, careerFlights)}
                failed={failed}
                careerFailed={careerFailed}
            />
        </Box>
    );
}
