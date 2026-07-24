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
    // reranking and hybrid search all apply). We stream so the UI can render
    // tokens as they arrive.
    const upstream = await env.AI.autorag(AI_SEARCH_INSTANCE).aiSearch({
      query: lastMessage.content,
      model: AI_SEARCH_MODEL,
      rewrite_query: true,
      stream: true,
    });

    // AI Search streams SSE (`data: {json}` lines, terminated by `[DONE]`). The
    // token text lands in either `response` or an OpenAI-style
    // `choices[].delta.content` depending on the model, so we parse defensively
    // and re-emit clean UTF-8 text — the client just appends what it reads.
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let buffer = '';

    const parse = new TransformStream({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;
          try {
            const obj = JSON.parse(payload);
            const text = obj.response ?? obj.choices?.[0]?.delta?.content ?? '';
            if (text) controller.enqueue(encoder.encode(text));
          } catch {
            /* keepalive or partial JSON — ignore */
          }
        }
      },
    });

    return new Response(upstream.pipeThrough(parse), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    console.error('[aig/chat] aiSearch failed:', err);
    return NextResponse.json(
      { error: 'AI.g had trouble answering that. Please try again in a moment.' },
      { status: 502 },
    );
  }
}
