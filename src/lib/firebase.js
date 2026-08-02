import admin from 'firebase-admin';

let firestore = null;

function createNoopFirestore() {
  // Minimal Firestore-like stub that returns empty results instead of throwing.
  const emptySnapshot = { docs: [], empty: true, size: 0, forEach: () => {} };
  const noopDoc = () => ({
    get: async () => ({ exists: false, data: () => null }),
    set: async () => {},
    update: async () => {},
    delete: async () => {},
  });

  const collection = () => ({
    doc: (_id) => noopDoc(),
    where: () => ({ get: async () => emptySnapshot }),
    get: async () => emptySnapshot,
    add: async () => ({ id: 'noop' }),
    orderBy: () => ({ limit: () => ({ get: async () => emptySnapshot }) }),
    limit: () => ({ get: async () => emptySnapshot }),
  });

  return {
    collection,
    collectionGroup: () => ({ get: async () => emptySnapshot }),
    runTransaction: async (fn) => {
      // Provide a minimal transaction object
      const tx = {
        get: async () => ({ exists: false, data: () => null }),
        set: async () => {},
        update: async () => {},
      };
      return fn(tx);
    },
    batch: () => ({ set: () => {}, commit: async () => {} }),
  };
}

function getFirestore() {
  if (firestore) return firestore;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    // Do not throw — return a noop stub so the application can degrade gracefully
    console.warn('Firebase is not configured; using noop Firestore stub.');
    firestore = createNoopFirestore();
    return firestore;
  }

  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          type: 'service_account',
          project_id: projectId,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: privateKey,
          client_email: clientEmail,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: 'https://accounts.google.com/o/oauth2/auth',
          token_uri: 'https://oauth2.googleapis.com/token',
          auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(clientEmail)}`,
          universe_domain: 'googleapis.com',
        }),
      });
    }
    firestore = admin.firestore();
  } catch (err) {
    console.error('Firebase initialization failed; using noop stub:', err?.message || err);
    firestore = createNoopFirestore();
  }

  return firestore;
}

// initializeApp() validates the service account the moment it runs, so doing it
// at module scope made every import of this file require production Firebase
// credentials — including Next's build-time page-data collection, which imports
// each route module. Initializing on first property access keeps builds
// credential-free and defers the cost to the first request that hits Firestore.
const db = new Proxy({}, {
  get(_target, prop) {
    const instance = getFirestore();
    const value = instance[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

export { db };
