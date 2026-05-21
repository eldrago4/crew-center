import db from '@/db/client.js';
import { crewcenter } from '@/db/schema';
import { eq } from 'drizzle-orm';

import { updateModuleValue } from '@/app/(crew)/crew/pireps/file/fleetModule';
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const CACHE_TTL_SECONDS = 180;

function cacheKey(moduleName) {
  return `crewcenter:${moduleName}`;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const moduleName = searchParams.get('module') || searchParams.get('moduleName');

    if (!moduleName) {
      return new Response(
        JSON.stringify({ error: 'Module parameter is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
        }
      );
    }

    try {
      const cached = await redis.get(cacheKey(moduleName));
      if (cached !== null && cached !== undefined) {
        return new Response(JSON.stringify(cached), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=60, stale-while-revalidate=180'
          },
        });
      }
    } catch (error) {
      console.warn('Crewcenter Redis cache read failed:', error);
    }

    const result = await db
      .select()
      .from(crewcenter)
      .where(eq(crewcenter.module, moduleName));

    if (result.length === 0) {
      return new Response(
        JSON.stringify({ error: `Module '${moduleName}' not found` }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
        }
      );
    }

    try {
      await redis.set(cacheKey(moduleName), result[ 0 ].value, { ex: CACHE_TTL_SECONDS });
    } catch (error) {
      console.warn('Crewcenter Redis cache write failed:', error);
    }

    return new Response(JSON.stringify(result[ 0 ].value), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=180'
      },
    });
  } catch (error) {
    console.error('Error fetching crewcenter data:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      }
    );
  }
}

export async function POST(req) {
  try {
    const { moduleName, newValue } = await req.json();

    console.log('POST request received:', { moduleName, newValue });

    if (!moduleName || newValue === undefined) {
      return NextResponse.json({ error: 'Module name and new value are required.' }, { status: 400 });
    }

    await updateModuleValue(moduleName, newValue);
    try {
      await redis.del(cacheKey(moduleName));
    } catch (error) {
      console.warn('Crewcenter Redis cache invalidation failed:', error);
    }

    return NextResponse.json({ message: `Module '${moduleName}' updated successfully.` }, { status: 200 });
  } catch (error) {
    console.error('API Error updating fleet module:', error);
    return NextResponse.json({ error: 'Failed to update fleet module.' }, { status: 500 });
  }
}
