import { Box } from '@chakra-ui/react';
import StatisticsClient from './StatisticsClient';
import {
    getStatsWeek,
    getWeekSummary,
    getWeeklyTopPilots,
    getAkasharathaClub,
    getWeeklyActivity,
    getMonthlyActivity,
    buildActivitySeries,
    buildMonthlySeries,
    fiveWeeksBefore,
    sixMonthsBefore,
    previousWeek,
    formatWeekLabel,
} from './queries';

export const metadata = {
    title: 'Statistics — Indian Virtual',
    robots: { index: false, follow: false },
};

const EMPTY_SUMMARY = { flights: 0, hours: 0, pilots: 0 };

export default async function StatisticsPage() {
    // Staff-only access is already enforced by the admin layout.
    const week = getStatsWeek();
    const prior = previousWeek(week);

    let summary = EMPTY_SUMMARY;
    let priorSummary = EMPTY_SUMMARY;
    let topPilots = [];
    let club = [];
    let weeklyRows = [];
    let monthlyRows = [];
    let failed = false;

    try {
        [ summary, priorSummary, topPilots, club, weeklyRows, monthlyRows ] = await Promise.all([
            getWeekSummary(week.start, week.end),
            getWeekSummary(prior.start, prior.end),
            getWeeklyTopPilots(week.start, week.end),
            getAkasharathaClub(),
            getWeeklyActivity(fiveWeeksBefore(week.start)),
            getMonthlyActivity(sixMonthsBefore()),
        ]);
    } catch (error) {
        // A cold Neon connection shouldn't take the whole admin page down; the
        // panels render their own empty states behind an error banner.
        console.error('[ADMIN STATS] Failed to load statistics:', error);
        failed = true;
    }

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
                topPilots={topPilots}
                club={club}
                weekly={buildActivitySeries(weeklyRows, week.start)}
                monthly={buildMonthlySeries(monthlyRows)}
                failed={failed}
            />
        </Box>
    );
}
