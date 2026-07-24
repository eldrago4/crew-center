import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { requireUser } from '@/lib/apiAuth';
import { rateLimit } from '@/lib/rateLimit';

// Server-side endpoint for the AI.g chat assistant. It authenticates the pilot,
// rate-limits per callsign, then calls the Cloudflare AI Search chat API
// (chatCompletions — the OpenAI-compatible, multi-turn chat endpoint) through
// the Workers AI binding. Reranking, hybrid search and the AI.g system prompt
// are configured on the instance itself, so they apply automatically — we only
// forward the conversation and the generation model.

const AI_SEARCH_INSTANCE = 'soft-dew-c29d';
const AI_SEARCH_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const MAX_MESSAGE_LEN = 1000;
const MAX_HISTORY = 10; // most recent turns forwarded as context

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

// AI Search returns retrieved chunks in `data`; turn them into a small, de-duped
// list of {label, url} the UI can show as citations. Web-crawler items carry the
// page URL in metadata.folder + filename; built-in uploads just have a filename.
function buildSources(data) {
  const sources = [];
  const seen = new Set();
  for (const item of Array.isArray(data) ? data : []) {
    const md = item?.metadata || {};
    const filename = typeof md.filename === 'string' ? md.filename : '';
    const folder = typeof md.folder === 'string' ? md.folder : '';
    let url = null;
    let label = md.title || filename || 'Source';
    if (folder.startsWith('http')) {
      url = folder.endsWith('/') ? folder + filename : `${folder}/${filename}`;
    } else if (filename.startsWith('http')) {
      url = filename;
    }
    const dedupeKey = url || label;
    if (!dedupeKey || seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    sources.push({ label, url });
    if (sources.length >= 4) break;
  }
  return sources;
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
    const result = await env.AI.autorag(AI_SEARCH_INSTANCE).chatCompletions({
      messages,
      model: AI_SEARCH_MODEL,
    });

    const answer =
      (result?.choices?.[0]?.message?.content || result?.response || '').trim() ||
      "I couldn't find anything on that in the manuals or guides. Try rephrasing?";

    // chatCompletions may attach retrieved chunks (e.g. result.data); surface
    // them as citations when present, otherwise just return the answer.
    return NextResponse.json({ answer, sources: buildSources(result?.data) });
  } catch (err) {
    console.error('[aig/chat] chatCompletions failed:', err);
    return NextResponse.json(
      { error: 'AI.g had trouble answering that. Please try again in a moment.' },
      { status: 502 },
    );
  }
}
