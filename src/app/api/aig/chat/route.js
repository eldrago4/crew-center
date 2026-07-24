import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/apiAuth';
import { rateLimit } from '@/lib/rateLimit';

// Server-side endpoint for the AI.g chat assistant. It authenticates the pilot,
// rate-limits per callsign, then calls the Cloudflare AI Search REST API's
// OpenAI-compatible chat/completions endpoint (multi-turn — the whole trimmed
// conversation is forwarded). On Vercel there's no Workers AI binding, so this
// goes over HTTPS with a Service token. Reranking, hybrid search and the AI.g
// system prompt are configured on the instance itself, so they apply
// automatically.
//
// Requires two env vars (set in the Vercel project):
//   CF_ACCOUNT_ID        — Cloudflare account id that owns the AI Search instance
//   AI_SEARCH_API_TOKEN  — Service token with "AI Search - Run" permission

const AI_SEARCH_INSTANCE = 'soft-dew-c29d';
const AI_SEARCH_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const MAX_MESSAGE_LEN = 1000;
const MAX_HISTORY = 10; // most recent turns forwarded as context

// Per-pilot budget. Generous enough for a real conversation, tight enough to
// stop a runaway loop from burning inference quota.
const RATE_LIMIT = { limit: 12, windowSeconds: 60 };

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

  const accountId = process.env.CF_ACCOUNT_ID;
  const token = process.env.AI_SEARCH_API_TOKEN;
  if (!accountId || !token) {
    console.error('[aig/chat] CF_ACCOUNT_ID or AI_SEARCH_API_TOKEN is not configured');
    return NextResponse.json({ error: 'AI.g is not available right now.' }, { status: 503 });
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai-search/instances/${AI_SEARCH_INSTANCE}/chat/completions`;

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages, model: AI_SEARCH_MODEL }),
      cache: 'no-store',
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      console.error('[aig/chat] AI Search REST error', upstream.status, data?.errors || data?.error);
      return NextResponse.json(
        { error: 'AI.g had trouble answering that. Please try again in a moment.' },
        { status: 502 },
      );
    }

    const answer =
      (data?.choices?.[0]?.message?.content || '').trim() ||
      "I couldn't find anything on that in the manuals or guides. Try rephrasing?";

    return NextResponse.json({ answer });
  } catch (err) {
    console.error('[aig/chat] AI Search REST fetch failed:', err);
    return NextResponse.json(
      { error: 'AI.g had trouble answering that. Please try again in a moment.' },
      { status: 502 },
    );
  }
}
