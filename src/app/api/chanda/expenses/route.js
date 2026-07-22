import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { requireStaff } from '@/lib/apiAuth';
import { DEFAULT_GOALS, GOALS_REDIS_KEY } from '../_defaultGoals';

// Append-only expense ledger, mirroring the shape of chanda:contributions but for
// money going OUT of a goal instead of in. Each withdrawal directly decrements
// chanda:goal:${id}:raised (incrbyfloat with a negative delta) — the same counter
// the public /crew/chanda progress bars read — so "available balance" is always
// just `raised`, with no second number to keep in sync.
const EXPENSES_KEY = 'chanda:expenses';

async function fetchGoals(redis) {
  const raw = await redis.get(GOALS_REDIS_KEY);
  return raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : DEFAULT_GOALS;
}

// GET: staff-only ledger read (the public stats route intentionally omits expenses —
// withdrawal notes/payees aren't meant for the public contributions page).
export async function GET() {
  const { error } = await requireStaff();
  if (error) return error;

  try {
    const redis = Redis.fromEnv();
    const raw = await redis.lrange(EXPENSES_KEY, 0, -1);
    const expenses = (raw || []).map(item => {
      try { return typeof item === 'string' ? JSON.parse(item) : item; }
      catch { return null; }
    }).filter(Boolean);
    return NextResponse.json({ expenses });
  } catch (err) {
    console.error('[chanda/expenses GET]', err);
    return NextResponse.json({ expenses: [] });
  }
}

// POST: record a withdrawal against a goal and deduct it from that goal's raised
// total. Overdraft (amount > current balance) is rejected — a goal's balance
// should never read negative in a ledger meant to be shown to pilots.
export async function POST(req) {
  const { session, error } = await requireStaff();
  if (error) return error;

  try {
    const { goalId, amountRupees, purpose, payee, notes } = await req.json();

    if (!goalId || !amountRupees || Number(amountRupees) < 1 || !purpose?.trim()) {
      return NextResponse.json({ error: 'Goal, amount and purpose are required.' }, { status: 400 });
    }

    const redis = Redis.fromEnv();
    const goals = await fetchGoals(redis);
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return NextResponse.json({ error: 'Unknown goal.' }, { status: 400 });

    const amount = Math.round(Number(amountRupees));
    const currentRaised = parseFloat((await redis.get(`chanda:goal:${goalId}:raised`)) || 0);

    if (amount > currentRaised) {
      return NextResponse.json(
        { error: `Insufficient balance — ${goal.label} holds ₹${currentRaised.toLocaleString('en-IN')}.` },
        { status: 400 },
      );
    }

    const expenseId = `exp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const record = {
      expenseId,
      goalId,
      amount,
      purpose: purpose.trim(),
      payee: payee?.trim() || null,
      notes: notes?.trim() || null,
      addedBy: session.user.ifcName || session.user.callsign,
      time: Date.now(),
    };

    await Promise.all([
      redis.incrbyfloat(`chanda:goal:${goalId}:raised`, -amount),
      redis.lpush(EXPENSES_KEY, JSON.stringify(record)),
    ]);

    return NextResponse.json({ ok: true, expense: record });
  } catch (err) {
    console.error('[chanda/expenses POST]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// DELETE: reverse a recorded withdrawal — restores the amount to the goal's balance
// and removes it from the ledger. Mirrors /api/chanda/reverse for contributions.
export async function DELETE(req) {
  const { error } = await requireStaff();
  if (error) return error;

  try {
    const { expenseId } = await req.json();
    if (!expenseId) return NextResponse.json({ error: 'Missing expenseId' }, { status: 400 });

    const redis = Redis.fromEnv();
    const list = await redis.lrange(EXPENSES_KEY, 0, -1);
    if (!list || list.length === 0) return NextResponse.json({ error: 'No expenses found' }, { status: 404 });

    let matchedRaw = null;
    let parsed = null;
    for (const item of list) {
      try {
        const obj = typeof item === 'string' ? JSON.parse(item) : item;
        if (obj && obj.expenseId === expenseId) { matchedRaw = item; parsed = obj; break; }
      } catch (e) { continue; }
    }
    if (!matchedRaw) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });

    await Promise.all([
      redis.lrem(EXPENSES_KEY, 0, matchedRaw),
      redis.incrbyfloat(`chanda:goal:${parsed.goalId}:raised`, parsed.amount || 0),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[chanda/expenses DELETE]', err);
    return NextResponse.json({ error: 'Reverse failed' }, { status: 500 });
  }
}
