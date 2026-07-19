import db from '@/db/client.js';
import { crewcenter } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireStaff } from '@/lib/apiAuth';

export async function GET(request) {
  try {
    const result = await db
      .select()
      .from(crewcenter)
      .where(eq(crewcenter.module, 'events'));

    // Browser 5m; Cloudflare edge 3h + 6h serve-stale (CDN-Cache-Control passes
    // through Vercel) — the events module changes only on staff edits.
    const cacheHeaders = {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
      'CDN-Cache-Control': 'public, max-age=10800, stale-while-revalidate=21600',
    };

    if (result.length === 0) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: cacheHeaders,
      });
    }

    const events = result[0].value || [];
    return new Response(JSON.stringify(events), {
      status: 200,
      headers: cacheHeaders,
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function POST(request) {
  try {
    const { error } = await requireStaff();
    if (error) return error;

    const events = await request.json();

    await db.insert(crewcenter)
      .values({ module: 'events', value: events })
      .onConflictDoUpdate({
        target: crewcenter.module,
        set: { value: events }
      });

    console.log('Events saved successfully');
    return new Response(JSON.stringify({ message: 'Events saved successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error saving events:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to save events' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
