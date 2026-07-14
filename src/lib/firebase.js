import { SignJWT, importPKCS8 } from 'jose';

// Firestore over the REST API instead of firebase-admin.
//
// firebase-admin pulls in google-gax/@google-cloud/grpc/protobufjs — ~10MB that
// blew past the Cloudflare Workers bundle limit, and it needs Node APIs Workers
// doesn't have. Everything below is plain fetch + a WebCrypto-signed JWT, which
// runs anywhere.
//
// This intentionally mirrors the small slice of the firebase-admin surface the
// app actually uses, so route code is unchanged:
//   db.collection(c).doc(id).get() / .set(data)
//   db.collection(c).where(f, op, v).limit(n).get()
//   db.collection(c).add(data)
//   snapshot.empty / .size / .docs / .forEach   doc.id / .exists / .data()

const FIRESTORE_SCOPE = 'https://www.googleapis.com/auth/datastore';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

const OPERATORS = {
    '==': 'EQUAL',
    '!=': 'NOT_EQUAL',
    '<': 'LESS_THAN',
    '<=': 'LESS_THAN_OR_EQUAL',
    '>': 'GREATER_THAN',
    '>=': 'GREATER_THAN_OR_EQUAL',
    'array-contains': 'ARRAY_CONTAINS',
    'in': 'IN',
};

function config() {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
        throw new Error(
            'Firebase is not configured: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY must be set.'
        );
    }
    return { projectId, clientEmail, privateKey };
}

// ── Auth: service-account JWT -> OAuth2 access token (cached until expiry) ────
let tokenCache = { token: null, expiresAt: 0 };

async function getAccessToken() {
    if (tokenCache.token && Date.now() < tokenCache.expiresAt) return tokenCache.token;

    const { clientEmail, privateKey } = config();
    const key = await importPKCS8(privateKey, 'RS256');
    const now = Math.floor(Date.now() / 1000);

    const assertion = await new SignJWT({ scope: FIRESTORE_SCOPE })
        .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
        .setIssuer(clientEmail)
        .setAudience(TOKEN_URL)
        .setIssuedAt(now)
        .setExpirationTime(now + 3600)
        .sign(key);

    const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion,
        }),
    });

    if (!res.ok) {
        throw new Error(`Firestore auth failed (${res.status}): ${await res.text()}`);
    }

    const { access_token, expires_in } = await res.json();
    // Refresh a minute early so a token can't expire mid-request.
    tokenCache = { token: access_token, expiresAt: Date.now() + (expires_in - 60) * 1000 };
    return access_token;
}

// ── Value encoding / decoding (Firestore REST "Value" union) ─────────────────
function encodeValue(value) {
    if (value === null || value === undefined) return { nullValue: null };
    if (value instanceof Date) return { timestampValue: value.toISOString() };
    if (typeof value === 'boolean') return { booleanValue: value };
    if (typeof value === 'number') {
        return Number.isInteger(value)
            ? { integerValue: String(value) }
            : { doubleValue: value };
    }
    if (typeof value === 'string') return { stringValue: value };
    if (Array.isArray(value)) {
        return { arrayValue: { values: value.map(encodeValue) } };
    }
    if (typeof value === 'object') return { mapValue: { fields: encodeFields(value) } };
    return { stringValue: String(value) };
}

function encodeFields(obj) {
    const fields = {};
    for (const [k, v] of Object.entries(obj)) fields[k] = encodeValue(v);
    return fields;
}

function decodeValue(value) {
    if (!value || typeof value !== 'object') return null;
    if ('nullValue' in value) return null;
    if ('booleanValue' in value) return value.booleanValue;
    if ('integerValue' in value) return Number(value.integerValue);
    if ('doubleValue' in value) return Number(value.doubleValue);
    if ('stringValue' in value) return value.stringValue;
    // Return a Date — callers guard with `x.toDate ? x.toDate() : new Date(x)`,
    // and `new Date(aDate)` is a no-op clone, so both branches stay correct.
    if ('timestampValue' in value) return new Date(value.timestampValue);
    if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeValue);
    if ('mapValue' in value) return decodeFields(value.mapValue.fields || {});
    if ('referenceValue' in value) return value.referenceValue;
    if ('geoPointValue' in value) return value.geoPointValue;
    if ('bytesValue' in value) return value.bytesValue;
    return null;
}

function decodeFields(fields) {
    const out = {};
    for (const [k, v] of Object.entries(fields || {})) out[k] = decodeValue(v);
    return out;
}

// ── Transport ────────────────────────────────────────────────────────────────
function baseUrl() {
    const { projectId } = config();
    return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
}

async function request(path, { method = 'GET', body, query } = {}) {
    const token = await getAccessToken();
    const url = new URL(`${baseUrl()}${path}`);
    for (const [k, v] of Object.entries(query || {})) url.searchParams.append(k, v);

    const res = await fetch(url, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 404) return null;
    if (!res.ok) {
        throw new Error(`Firestore ${method} ${path} failed (${res.status}): ${await res.text()}`);
    }
    return res.json();
}

function docIdFromName(name) {
    return String(name || '').split('/').pop();
}

function toDocSnapshot(doc) {
    return {
        id: docIdFromName(doc.name),
        exists: true,
        data: () => decodeFields(doc.fields),
    };
}

function toQuerySnapshot(docs) {
    const snapshots = docs.map(toDocSnapshot);
    return {
        empty: snapshots.length === 0,
        size: snapshots.length,
        docs: snapshots,
        forEach: (fn) => snapshots.forEach(fn),
    };
}

// ── Query builder ────────────────────────────────────────────────────────────
class Query {
    constructor(collectionId, filters = [], limitCount = null) {
        this._collectionId = collectionId;
        this._filters = filters;
        this._limit = limitCount;
    }

    where(field, op, value) {
        const operator = OPERATORS[op];
        if (!operator) throw new Error(`Unsupported Firestore operator: ${op}`);
        return new Query(
            this._collectionId,
            [...this._filters, { fieldFilter: { field: { fieldPath: field }, op: operator, value: encodeValue(value) } }],
            this._limit
        );
    }

    limit(n) {
        return new Query(this._collectionId, this._filters, n);
    }

    async get() {
        const structuredQuery = { from: [{ collectionId: this._collectionId }] };

        if (this._filters.length === 1) {
            structuredQuery.where = this._filters[0];
        } else if (this._filters.length > 1) {
            structuredQuery.where = {
                compositeFilter: { op: 'AND', filters: this._filters },
            };
        }
        if (this._limit != null) structuredQuery.limit = this._limit;

        const rows = await request(':runQuery', { method: 'POST', body: { structuredQuery } });
        const docs = (rows || []).filter((r) => r.document).map((r) => r.document);
        return toQuerySnapshot(docs);
    }
}

class DocumentReference {
    constructor(collectionId, id) {
        this._collectionId = collectionId;
        this.id = id;
    }

    async get() {
        const doc = await request(`/${this._collectionId}/${encodeURIComponent(this.id)}`);
        if (!doc) {
            return { id: this.id, exists: false, data: () => undefined };
        }
        return toDocSnapshot(doc);
    }

    async set(data) {
        // PATCH with no updateMask replaces the document, matching .set() semantics.
        await request(`/${this._collectionId}/${encodeURIComponent(this.id)}`, {
            method: 'PATCH',
            body: { fields: encodeFields(data) },
        });
        return { id: this.id };
    }

    async update(data) {
        const updateMask = Object.keys(data).map((f) => `updateMask.fieldPaths=${encodeURIComponent(f)}`);
        const token = await getAccessToken();
        const url = `${baseUrl()}/${this._collectionId}/${encodeURIComponent(this.id)}?${updateMask.join('&')}`;
        const res = await fetch(url, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields: encodeFields(data) }),
        });
        if (!res.ok) throw new Error(`Firestore update failed (${res.status}): ${await res.text()}`);
        return { id: this.id };
    }
}

class CollectionReference extends Query {
    constructor(collectionId) {
        super(collectionId);
        this._id = collectionId;
    }

    doc(id) {
        return new DocumentReference(this._id, id);
    }

    async add(data) {
        const doc = await request(`/${this._id}`, {
            method: 'POST',
            body: { fields: encodeFields(data) },
        });
        return new DocumentReference(this._id, docIdFromName(doc.name));
    }
}

const db = {
    collection: (collectionId) => new CollectionReference(collectionId),
};

// Stand-in for admin.firestore.Timestamp. Dates encode to timestampValue, so
// passing a Date straight through is all the REST layer needs.
const Timestamp = {
    fromDate: (date) => date,
    now: () => new Date(),
};

export { db, Timestamp };
