import admin from 'firebase-admin';

let firestore = null;

function getFirestore() {
    if (firestore) return firestore;

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
        throw new Error(
            'Firebase is not configured: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY must be set.'
        );
    }

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({
                type: "service_account",
                project_id: projectId,
                private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
                private_key: privateKey,
                client_email: clientEmail,
                client_id: process.env.FIREBASE_CLIENT_ID,
                auth_uri: "https://accounts.google.com/o/oauth2/auth",
                token_uri: "https://oauth2.googleapis.com/token",
                auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
                client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(clientEmail)}`,
                universe_domain: "googleapis.com"
            }),
        });
    }

    firestore = admin.firestore();
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
