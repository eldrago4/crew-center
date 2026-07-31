import { NextResponse, connection } from 'next/server';
import { revalidateTag, cacheLife, cacheTag } from 'next/cache';
import db from '@/db/client';
import { routes } from '@/db/schema';
import { sql, inArray } from 'drizzle-orm';
import { requireStaff } from '@/lib/apiAuth';

// One cached full-table read, tagged 'routes' ('use cache: remote' — the durable
// platform cache shared across instances, successor to the unstable_cache used
// before). 'days' ≈ revalidate 1d; busted instantly by the revalidateTag('routes')
// calls in the mutations below.
async function getAllRoutes() {
    'use cache: remote'
    cacheLife('days')
    cacheTag('routes')
    return db.select().from(routes)
}

// GET all routes
export async function GET() {
    // Everything this handler reads is cached, so under Cache Components it would
    // otherwise be prerendered at build time — baking build-DB state (or a baked 500
    // if the DB blips during a deploy) into the static output. connection() keeps it
    // request-time, exactly like today; Cloudflare's edge still absorbs the traffic
    // via the CDN-Cache-Control below.
    await connection();
    try {
        const allRoutes = await getAllRoutes();
        // Browser 10m; Cloudflare edge 12h + 1d serve-stale (CDN-Cache-Control passes
        // through Vercel) — the route DB changes only on staff edits.
        return NextResponse.json(allRoutes, {
            headers: {
                'Cache-Control': 'public, max-age=600',
                'CDN-Cache-Control': 'public, max-age=43200, stale-while-revalidate=86400',
            },
        });
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
        const { error } = await requireStaff();
        if (error) return error;

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

        // Bust the routes cache (GET + /crew/routes page) so the edit shows immediately
        revalidateTag('routes');

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
        const { error } = await requireStaff();
        if (error) return error;

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
            revalidateTag('routes');

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
            revalidateTag('routes');

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
        const { error } = await requireStaff();
        if (error) return error;

        const body = await request.json();
        const { flightNumber, newFlightNumber, departureIcao, arrivalIcao, flightTime, aircraft } = body;
        if (!flightNumber) {
            return NextResponse.json(
                { error: 'Flight number is required for update' },
                { status: 400 }
            );
        }

        // `flightNumber` identifies the row to update and is NEVER the new value.
        // Renaming goes through `newFlightNumber`, because flightNumber is the
        // primary key: when the client sent the edited number as the lookup key,
        // a rename either matched nothing (404, silently discarding every other
        // field edited in the same dialog) or — if that number already belonged
        // to another route — updated THAT route with this one's data.
        const updateData = {};
        if (departureIcao !== undefined) updateData.departureIcao = departureIcao;
        if (arrivalIcao !== undefined) updateData.arrivalIcao = arrivalIcao;
        if (flightTime !== undefined) updateData.flightTime = flightTime;
        if (aircraft !== undefined) updateData.aircraft = aircraft;

        if (newFlightNumber !== undefined && newFlightNumber !== flightNumber) {
            const trimmed = String(newFlightNumber).trim();
            if (!trimmed) {
                return NextResponse.json(
                    { error: 'Flight number cannot be empty' },
                    { status: 400 }
                );
            }
            // A collision raises 23505 on the primary key, which the catch below
            // reports as 'Flight number already exists' rather than clobbering
            // the other route.
            updateData.flightNumber = trimmed;
        }
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

        revalidateTag('routes');

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
