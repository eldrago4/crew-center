import { NextResponse } from 'next/server';
import { cacheLife, cacheTag } from 'next/cache';
import db from '@/db/client';
import { routes } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { requireUser } from '@/lib/apiAuth';

// Flight-number lookup for the PIREP filing form: given a departure/arrival pair
// and an aircraft, return every route the VA operates on that leg with that type.
//
// The dep/arr filter runs in SQL and is cached per pair ('use cache: remote', the
// durable platform cache — args are part of the cache key), tagged 'routes' so a
// staff edit through /api/routes busts every pair at once. The aircraft filter is
// deliberately NOT in SQL: routes.aircraft is a comma-separated list of fleet
// labels ("A333, Boeing 737-800") and a LIKE '%…%' would over-match the labels that
// are prefixes of others — DC-10 into DC-10F, MD-11 into MD-11F, Boeing 767-300
// into Boeing 767-300ER. Splitting on commas and comparing whole tokens is exact.
async function getRoutesForPair(departureIcao, arrivalIcao) {
    'use cache: remote'
    cacheLife('days')
    cacheTag('routes')

    return db
        .select({
            flightNumber: routes.flightNumber,
            aircraft: routes.aircraft,
            flightTime: routes.flightTime,
        })
        .from(routes)
        .where(and(eq(routes.departureIcao, departureIcao), eq(routes.arrivalIcao, arrivalIcao)));
}

function normalizeIcao(value) {
    return (value || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
}

export async function GET(request) {
    const { error } = await requireUser();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const departureIcao = normalizeIcao(searchParams.get('departureIcao'));
    const arrivalIcao = normalizeIcao(searchParams.get('arrivalIcao'));
    const aircraft = (searchParams.get('aircraft') || '').trim();

    if (departureIcao.length !== 4 || arrivalIcao.length !== 4 || !aircraft) {
        return NextResponse.json(
            { error: 'departureIcao, arrivalIcao and aircraft are required' },
            { status: 400 }
        );
    }

    try {
        const pairRoutes = await getRoutesForPair(departureIcao, arrivalIcao);
        const wanted = aircraft.toLowerCase();

        const matches = pairRoutes
            .filter(route => (route.aircraft || '')
                .split(',')
                .map(name => name.trim().toLowerCase())
                .includes(wanted))
            .map(route => ({
                flightNumber: route.flightNumber,
                aircraft: route.aircraft,
                // time (HH:MM:SS) → HH:MM for display next to the flight number
                flightTime: route.flightTime ? route.flightTime.slice(0, 5) : null,
            }))
            .sort((a, b) => a.flightNumber.localeCompare(b.flightNumber));

        return NextResponse.json({ routes: matches }, {
            // Same reasoning as /api/routes: the table only changes on staff edits.
            // Private — the response is behind the crew session check above.
            headers: { 'Cache-Control': 'private, max-age=600' },
        });
    } catch (err) {
        console.error('Error looking up routes:', err);
        return NextResponse.json({ error: 'Failed to look up routes' }, { status: 500 });
    }
}
