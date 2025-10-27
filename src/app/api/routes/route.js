import { NextResponse } from 'next/server';
import db from '@/db/client';
import { routes } from '@/db/schema';
import { sql } from 'drizzle-orm';

// GET all routes
export async function GET() {
    try {
        const allRoutes = await db.select().from(routes);
        return NextResponse.json(allRoutes);
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

// DELETE route
export async function DELETE(request) {
    try {
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

        return NextResponse.json({ message: 'Route deleted successfully' });
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
