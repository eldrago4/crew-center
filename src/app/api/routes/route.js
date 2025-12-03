import { NextResponse } from 'next/server';
import db from '@/db/client';
import { routes } from '@/db/schema';
import { sql, inArray } from 'drizzle-orm';

const routesCache = new Map();

// GET all routes
export async function GET() {
    try {
        // Check if all routes are cached
        const allFlightNumbers = await db.select({ flightNumber: routes.flightNumber }).from(routes);
        const flightNumbers = allFlightNumbers.map(r => r.flightNumber);
        const cachedRoutes = [];
        const missingFlightNumbers = [];

        for (const fn of flightNumbers) {
            if (routesCache.has(fn)) {
                cachedRoutes.push(routesCache.get(fn));
            } else {
                missingFlightNumbers.push(fn);
            }
        }

        // Fetch missing routes from DB in batches to avoid PostgreSQL IN limit
        if (missingFlightNumbers.length > 0) {
            const batchSize = 1000;
            for (let i = 0; i < missingFlightNumbers.length; i += batchSize) {
                const batch = missingFlightNumbers.slice(i, i + batchSize);
                const missingRoutes = await db.select().from(routes).where(inArray(routes.flightNumber, batch));
                for (const route of missingRoutes) {
                    routesCache.set(route.flightNumber, route);
                    cachedRoutes.push(route);
                }
            }
        }

        return NextResponse.json(cachedRoutes);
    } catch (error) {
        console.error('Error fetching routes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch routes' },
            { status: 500 }
        );
    }
}

// POST new routes
export async function POST(request) {
    try {
        const body = await request.json();
        const routesToAdd = Array.isArray(body) ? body : [ body ];

        // Validate required fields
        for (const route of routesToAdd) {
            if (!route.flightNumber || !route.departureIcao || !route.arrivalIcao || !route.aircraft) {
                return NextResponse.json(
                    { error: 'Missing required fields' },
                    { status: 400 }
                );
            }
        }

        // Insert routes
        const insertedRoutes = await db
            .insert(routes)
            .values(routesToAdd)
            .returning();

        // Update cache with new routes
        for (const route of insertedRoutes) {
            routesCache.set(route.flightNumber, route);
        }

        return NextResponse.json(insertedRoutes, { status: 201 });
    } catch (error) {
        console.error('Error adding routes:', error);

        let errorMessage = 'Failed to add routes';
        const actualError = error.cause || error;

        if (actualError.code === '23505') {
            errorMessage = 'Flight number already exists';
        } else if (actualError.code === '23502') {
            errorMessage = 'Missing required fields';
        } else if (actualError.code === '23514') {
            errorMessage = 'Invalid data provided';
        } else if (actualError.code === '23503') {
            errorMessage = 'Invalid reference data';
        } else if (actualError.message && !actualError.message.includes('insert into')) {
            errorMessage = actualError.message;
        }

        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

// DELETE route(s)
export async function DELETE(request) {
    try {
        const body = await request.json().catch(() => ({}));
        const flightNumbers = body.flightNumbers;

        if (flightNumbers && Array.isArray(flightNumbers) && flightNumbers.length > 0) {
            // Bulk delete
            const result = await db
                .delete(routes)
                .where(inArray(routes.flightNumber, flightNumbers))
                .returning();

            if (result.length === 0) {
                return NextResponse.json(
                    { error: 'No routes found to delete' },
                    { status: 404 }
                );
            }

            // Remove from cache
            flightNumbers.forEach(fn => routesCache.delete(fn));

            return NextResponse.json({ message: `${result.length} routes deleted successfully` });
        } else {
            // Single delete (existing logic)
            const { searchParams } = new URL(request.url);
            const flightNumber = searchParams.get('flightNumber');

            if (!flightNumber) {
                return NextResponse.json(
                    { error: 'Flight number is required' },
                    { status: 400 }
                );
            }

            const result = await db
                .delete(routes)
                .where(sql`${routes.flightNumber} = ${flightNumber}`)
                .returning();

            if (result.length === 0) {
                return NextResponse.json(
                    { error: 'Route not found' },
                    { status: 404 }
                );
            }

            // Remove from cache
            routesCache.delete(flightNumber);

            return NextResponse.json({ message: 'Route deleted successfully' });
        }
    } catch (error) {
        console.error('Error deleting route:', error);
        let errorMessage = 'Failed to delete route';
        const actualError = error.cause || error;
        if (actualError.code === '23503') {
            errorMessage = 'Cannot delete route as it is referenced by other data';
        } else if (actualError.message && !actualError.message.includes('delete from')) {
            errorMessage = actualError.message;
        }
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

// PATCH route (edit route by flightNumber)
export async function PATCH(request) {
    try {
        const body = await request.json();
        const { flightNumber, departureIcao, arrivalIcao, flightTime, aircraft } = body;
        if (!flightNumber) {
            return NextResponse.json(
                { error: 'Flight number is required for update' },
                { status: 400 }
            );
        }
        // Only update provided fields
        const updateData = {};
        if (departureIcao !== undefined) updateData.departureIcao = departureIcao;
        if (arrivalIcao !== undefined) updateData.arrivalIcao = arrivalIcao;
        if (flightTime !== undefined) updateData.flightTime = flightTime;
        if (aircraft !== undefined) updateData.aircraft = aircraft;
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: 'No fields to update' },
                { status: 400 }
            );
        }
        const result = await db
            .update(routes)
            .set(updateData)
            .where(sql`${routes.flightNumber} = ${flightNumber}`)
            .returning();
        if (result.length === 0) {
            return NextResponse.json(
                { error: 'Route not found' },
                { status: 404 }
            );
        }

        // Update cache with the updated route
        routesCache.set(flightNumber, result[ 0 ]);

        return NextResponse.json(result[ 0 ]);
    } catch (error) {
        console.error('Error updating route:', error);
        let errorMessage = 'Failed to update route';
        const actualError = error.cause || error;
        if (actualError.code === '23505') {
            errorMessage = 'Flight number already exists';
        } else if (actualError.code === '23502') {
            errorMessage = 'Missing required fields';
        } else if (actualError.code === '23514') {
            errorMessage = 'Invalid data provided';
        } else if (actualError.code === '23503') {
            errorMessage = 'Invalid reference data';
        } else if (actualError.message && !actualError.message.includes('update')) {
            errorMessage = actualError.message;
        }
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
