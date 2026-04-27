import db from '@/db/client.js';
import { crewcenter } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request) {
  try {
    const result = await db
      .select()
      .from(crewcenter)
      .where(eq(crewcenter.module, 'events'));

    if (result.length === 0) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const events = result[0].value || [];
    return new Response(JSON.stringify(events), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
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
    const events = await request.json();

    console.log('Saving events:', events);

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
