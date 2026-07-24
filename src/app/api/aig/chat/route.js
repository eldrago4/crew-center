import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireUser } from '@/lib/apiAuth';
import { rateLimit } from '@/lib/rateLimit';

// Server-side endpoint for the AI.g chat assistant. It authenticates the pilot,
// rate-limits per callsign, then queries the Cloudflare AI Search instance
// through the Workers AI binding's aiSearch() — which retrieves context and
// generates an answer in one call (the "chat" behaviour; search() would return
// raw chunks instead). Reranking, hybrid search and the AI.g system prompt are
// configured on the instance itself, so they apply automatically. The binding
// has no OpenAI-style chatCompletions() — that lives only on the REST API — so
// we answer from the latest user turn (the client still sends recent history).

const AI_SEARCH_INSTANCE = 'soft-dew-c29d';
const AI_SEARCH_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const MAX_MESSAGE_LEN = 1000;
const MAX_HISTORY = 10; // most recent turns accepted from the client

// Per-pilot budget. Generous enough for a real conversation, tight enough to
// stop a runaway loop from burning inference quota.
const RATE_LIMIT = { limit: 12, windowSeconds: 60 };

async function getEnv() {
  try {
    return getCloudflareContext().env;
  } catch {
    const ctx = await getCloudflareContext({ async: true });
    return ctx.env;
  }
}

export async function POST(request) {
  const { session, error } = await requireUser();
  if (error) return error;

  const callsign = session.user.callsign;

  const rl = await rateLimit(`aig:chat:${callsign}`, RATE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `You're chatting a little fast — give me ${rl.retryAfter}s and try again.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  // Accept an OpenAI-style conversation. Keep only user/assistant turns with
  // non-empty string content, trim overly long ones, and cap the history so a
  // client can't push an unbounded transcript into the model.
  const rawMessages = Array.isArray(body?.messages) ? body.messages : [];
  const messages = rawMessages
    .filter(
      (m) =>
        m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim(),
    )
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, MAX_MESSAGE_LEN) }))
    .slice(-MAX_HISTORY);

  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== 'user') {
    return NextResponse.json({ error: 'A user message is required.' }, { status: 400 });
  }

  const env = await getEnv();
  if (!env?.AI) {
    console.error('[aig/chat] AI binding is not available');
    return NextResponse.json({ error: 'AI.g is not available right now.' }, { status: 503 });
  }

  try {
    // aiSearch() is the Workers-binding "chat" method: it retrieves context and
    // generates an answer in one call (the instance's AI.g system prompt,
    // reranking and hybrid search all apply). We return the full answer as JSON
    // — returning a *streamed* body from a route handler hangs under OpenNext on
    // Workers (observed ~15s → 502), so the client renders it with a typewriter
    // reveal instead.
    const result = await env.AI.autorag(AI_SEARCH_INSTANCE).aiSearch({
      query: lastMessage.content,
      model: AI_SEARCH_MODEL,
      rewrite_query: true,
    });

    const answer =
      (result?.response || '').trim() ||
      "I couldn't find anything on that in the manuals or guides. Try rephrasing?";

    return NextResponse.json({ answer });
  } catch (err) {
    console.error('[aig/chat] aiSearch failed:', err);
    return NextResponse.json(
      { error: 'AI.g had trouble answering that. Please try again in a moment.' },
      { status: 502 },
    );
  }
}
