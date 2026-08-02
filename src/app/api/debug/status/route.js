import { NextResponse } from 'next/server';

// Lightweight, safe diagnostics for runtime env/connectivity.
// Returns booleans about whether required env vars are present and
// attempts non-destructive checks (Upstash PING, Firebase init check).
// Does NOT return secrets.

export async function GET() {
  const pexelsKeyPresent = !!process.env.PEXELS_API_KEY;
  const upstashUrlPresent = !!process.env.UPSTASH_REDIS_REST_URL;
  const upstashTokenPresent = !!process.env.UPSTASH_REDIS_REST_TOKEN;
  const firebaseProjectIdPresent = !!process.env.FIREBASE_PROJECT_ID;
  const firebaseClientEmailPresent = !!process.env.FIREBASE_CLIENT_EMAIL;
  const firebasePrivateKeyPresent = !!process.env.FIREBASE_PRIVATE_KEY;

  let redisReachable = false;
  let redisError = null;
  if (upstashUrlPresent && upstashTokenPresent) {
    try {
      const { Redis } = await import('@upstash/redis');
      // Use a fresh client and call ping. Don't log tokens.
      const r = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
      const pong = await r.ping();
      redisReachable = pong === 'PONG' || !!pong;
    } catch (err) {
      redisError = String(err.message || err);
      console.error('[debug/status] Upstash ping failed:', err.message || err);
    }
  }

  let firestoreConfigured = false;
  let firestoreInitError = null;
  let firestoreReachable = false;
  if (firebaseProjectIdPresent && firebaseClientEmailPresent && firebasePrivateKeyPresent) {
    firestoreConfigured = true;
    try {
      // Dynamic import to avoid initializing Firebase unless it's configured
      const admin = await import('firebase-admin');
      if (!admin.apps?.length) {
        // initialize with minimal cert fields; this will validate keys but not
        // attempt network requests during init.
        admin.initializeApp({
          credential: admin.credential.cert({
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
          }),
        });
      }
      // Lightweight check: ensure firestore() is callable
      const db = admin.firestore();
      if (db) firestoreReachable = true;
    } catch (err) {
      firestoreInitError = String(err.message || err);
      console.error('[debug/status] Firebase init failed:', err.message || err);
    }
  }

  return NextResponse.json({
    ok: true,
    env: {
      pexelsKeyPresent,
      upstashUrlPresent,
      upstashTokenPresent,
      firebaseProjectIdPresent,
      firebaseClientEmailPresent,
      firebasePrivateKeyPresent,
    },
    checks: {
      redisReachable,
      redisError,
      firestoreConfigured,
      firestoreReachable,
      firestoreInitError,
    },
  }, { headers: { 'Cache-Control': 'no-store' } });
}
