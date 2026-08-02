import { Redis } from '@upstash/redis';
import airportCities from '@/data/airport-cities.json';

// Backdrop photos for the gallery view of /crew/routes: each card shows the
// place it flies TO. https://www.pexels.com/api/documentation/#photos-search
//
// The routes table stores ICAO codes and nothing else, so the place name comes
// from src/data/airport-cities.json — "ICAO": "City|Region|Country", from the
// OurAirports dataset (public domain) for every airport the network serves plus
// every large airport worldwide. It is indexed under both the current ICAO and
// the legacy ident, because the routes table still uses pre-renaming codes
// (UAFM, not UCFM).
//
// WHY REDIS AND NOT 'use cache'
// -----------------------------
// This used to be a per-ICAO `'use cache: remote'` function. Build ID is part of
// a use-cache key, so every deploy discarded all ~346 resolved photos at once —
// and re-warming the network costs at least one Pexels call per airport. The
// result was that after each deploy an arbitrary slice of airports 429'd and fell
// back to the gradient, including well-covered cities like Mumbai. A photo of a
// city is about as deploy-invariant as data gets, so it belongs in a store that
// outlives the build.
//
// On the quota: the plan allows 25,000 requests and x-ratelimit-remaining barely
// moves across a few hundred lookups, so the monthly ceiling is not the binding
// constraint. What Pexels actually enforces is a short-window BURST limit — a
// warm run at four-way concurrency drew 429s while the quota header sat at
// ~24,950 — which is what MAX_RESOLVE_PER_REQUEST below is really protecting
// against.

const PEXELS_SEARCH = 'https://api.pexels.com/v1/search';

// The rendered card is ~400x320 CSS px, so 800x520 is a 2x-ish crop —
// src.landscape (1200x627) would be ~3x the bytes for no visible gain.
const SIZE_PARAMS = 'auto=compress&cs=tinysrgb&fit=crop&w=800&h=520';

// Bump the version segment to abandon every stored entry at once — necessary
// whenever the stored shape or the search strategy changes materially.
const REDIS_PREFIX = 'route-backdrop:v2:';
const HIT_TTL_SECONDS = 60 * 60 * 24 * 90;  // a city's photo needn't churn
const MISS_TTL_SECONDS = 60 * 60 * 6;       // a miss may be a blip; retry sooner

// Ceilings for ONE request. Cloudflare Workers allows 50 subrequests per
// invocation and each unresolved airport can spend up to one per tier, so the
// budget is what keeps a page full of never-seen airports from blowing either
// that limit or Pexels' burst limit. Airports past the budget stay null and get
// resolved the next time someone lands on that page.
const MAX_RESOLVE_PER_REQUEST = 8;
const RESOLVE_CONCURRENCY = 4;

let _redis;
function getRedis() {
  if (_redis !== undefined) return _redis;
  try {
    _redis = Redis.fromEnv();
  } catch {
    _redis = null;
  }
  return _redis;
}

// routes.arrivalIcao is free text and ~20 rows carry a routing note rather than a
// bare code: "EBBR VIA GBYD", "DIAP (VIA DGAA)", "ZSPD (VIA VIDP, VTBS)", plus a
// few with stray whitespace or a trailing backtick. The destination is always the
// leading token, and the via-points are deliberate information a pilot entered, so
// they're read past here rather than scrubbed out of the table.
//
// Returns null when there's no 4-letter code to find, so a genuinely junk value
// falls through to the gradient instead of searching Pexels for nonsense.
export function normalizeIcao(value) {
  // Anchored, so only a genuine leading code counts. An unanchored match would
  // pick the first four letters found anywhere and happily turn "not-an-icao"
  // into "ICAO".
  const match = String(value ?? '').trim().toUpperCase().match(/^[A-Z]{4}/);
  return match ? match[ 0 ] : null;
}

export function airportPlace(icao) {
  const entry = airportCities[ normalizeIcao(icao) ];
  if (!entry) return null;
  const [ city, region, country ] = entry.split('|');
  return { city, region: region || '', country: country || '' };
}

async function searchPexels(query, apiKey, orientation) {
  const url = `${PEXELS_SEARCH}?query=${encodeURIComponent(query)}&per_page=15`
    + (orientation ? `&orientation=${orientation}` : '');
  const res = await fetch(url, { headers: { Authorization: apiKey } });

  // 429 is the rate limit. Throwing matters: a thrown error is never written to
  // Redis, so a throttled airport retries later instead of being stored as
  // "this place has no photos" for months.
  if (!res.ok) throw new Error(`Pexels search failed (${res.status}) for "${query}"`);

  const json = await res.json();
  const photos = (json.photos || [])
    .filter((photo) => photo?.src?.original)
    .map((photo) => ({
      url: `${photo.src.original}?${SIZE_PARAMS}`,
      // Documented as "useful for a placeholder while the image loads" — the
      // card paints this flat colour immediately and fades the photo in over it.
      color: photo.avg_color || null,
    }));

  return { photos, rateLimitRemaining: res.headers.get('X-Ratelimit-Remaining') };
}

// Which of the results to use. Taking photos[0] would be fine for a city query,
// where the query itself is unique — but the country fallback below is shared by
// every small airport in that country, so first-result would hand Tirupati,
// Tiruchirappalli and Porbandar the same photo. Hashing the ICAO spreads them
// across the result page while staying stable for a given airport.
function pickPhoto(photos, seed) {
  if (!photos.length) return null;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return photos[ hash % photos.length ];
}

// Widening tiers, tried in order and only on a miss. The ladder narrows the
// assumption at each step rather than special-casing any airport:
//
//  1. "<city> tourism" — what the place is photographed FOR. Beats "<city>
//     skyline", which presumes the city has one.
//  2. "<city> <country>" — drops the tourism qualifier and disambiguates the
//     name against the rest of the world. Also drops the orientation
//     constraint: Pexels' website searches every orientation, so a place can
//     look well covered there while `orientation=landscape` returns almost
//     nothing through the API. A portrait photo centre-cropped to 800x520 is
//     still a photo of that place.
//  3. "<region> <country>" — the state/province, so a small airport gets its
//     own region rather than falling all the way to a generic national photo.
//     91% of mapped airports carry a usable region.
//  4. "<country> landscape" — last resort, and the reason pickPhoto hashes.
export function searchTiers(place) {
  const tiers = [
    { query: `${place.city} tourism`, orientation: 'landscape' },
    { query: place.country ? `${place.city} ${place.country}` : place.city, orientation: null },
  ];
  if (place.region) {
    tiers.push({
      query: place.country ? `${place.region} ${place.country}` : place.region,
      orientation: null,
    });
  }
  if (place.country) {
    tiers.push({ query: `${place.country} landscape`, orientation: 'landscape' });
  }
  return tiers;
}

// Live lookup for one airport, no caching of any kind. Throws on a Pexels
// failure so the caller can tell "no photo exists" (null) from "we couldn't ask"
// (throw) — only the former is safe to store.
export async function fetchAirportBackdrop(icao) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) throw new Error('PEXELS_API_KEY is not set');

  const place = airportPlace(icao);
  if (!place) return null;

  for (const tier of searchTiers(place)) {
    const { photos } = await searchPexels(tier.query, apiKey, tier.orientation);
    const photo = pickPhoto(photos, icao);
    if (photo) return photo;
  }
  return null;
}

// Reads Redis first: one MGET covers the whole page, so a fully warm page costs a
// single round trip rather than one call per airport.
// Resolves a set of already-canonical ICAOs. Kept separate from the exported
// entry point so the cache is only ever keyed by a clean code.
async function resolveCanonical(icaos) {
  const redis = getRedis();
  const resolved = {};
  let unknown = [ ...icaos ];

  if (redis) {
    try {
      const stored = await redis.mget(...icaos.map((icao) => `${REDIS_PREFIX}${icao}`));
      unknown = [];
      icaos.forEach((icao, i) => {
        const entry = stored?.[ i ];
        if (entry === null || entry === undefined) {
          unknown.push(icao);
        } else {
          // A stored miss is the string 'none' — distinguishable from "not
          // looked up yet", so a genuinely photo-less airport isn't re-searched
          // on every page view.
          resolved[ icao ] = entry === 'none' ? null : entry;
        }
      });
    } catch (error) {
      console.error('Backdrop cache read failed, falling back to live lookup:', error.message);
    }
  }

  const toResolve = unknown.slice(0, MAX_RESOLVE_PER_REQUEST);
  for (const icao of unknown.slice(MAX_RESOLVE_PER_REQUEST)) {
    resolved[ icao ] = null;
  }

  for (let i = 0; i < toResolve.length; i += RESOLVE_CONCURRENCY) {
    const batch = toResolve.slice(i, i + RESOLVE_CONCURRENCY);
    const settled = await Promise.allSettled(batch.map((icao) => fetchAirportBackdrop(icao)));

    await Promise.all(settled.map(async (result, j) => {
      const icao = batch[ j ];
      if (result.status === 'rejected') {
        // Rate limited, or Pexels is down. Serve the gradient this once and
        // leave nothing in Redis, so the next view tries again.
        resolved[ icao ] = null;
        console.error(`Backdrop lookup failed for ${icao}:`, result.reason?.message);
        return;
      }
      resolved[ icao ] = result.value;
      if (!redis) return;
      try {
        await redis.set(
          `${REDIS_PREFIX}${icao}`,
          result.value ?? 'none',
          { ex: result.value ? HIT_TTL_SECONDS : MISS_TTL_SECONDS },
        );
      } catch (error) {
        console.error(`Backdrop cache write failed for ${icao}:`, error.message);
      }
    }));
  }

  return resolved;
}

// Resolve a batch as the caller asked for it. Each requested value is reduced to
// its canonical ICAO first, so a row like "EBBR VIA GBYD" shares one cache entry
// and one Pexels lookup with a plain "EBBR" — before this, those rows matched
// nothing in the city table and were permanently stuck on the gradient.
//
// Results come back keyed by exactly what was passed in, so the caller can look
// them up with the same strings it holds.
export async function resolveBackdrops(icaos) {
  const canonicalOf = new Map(icaos.map((raw) => [ raw, normalizeIcao(raw) ]));
  const unique = [ ...new Set([ ...canonicalOf.values() ].filter(Boolean)) ];

  const byCanonical = unique.length ? await resolveCanonical(unique) : {};

  const resolved = {};
  for (const raw of icaos) {
    const canonical = canonicalOf.get(raw);
    resolved[ raw ] = canonical ? (byCanonical[ canonical ] ?? null) : null;
  }
  return resolved;
}

// Uncached diagnostic behind the staff-only debug flag on
// /api/routes/backdrops: reports how many results each tier actually returns for
// an airport, plus what is currently stored for it and the remaining quota — so
// a card that renders a bare gradient can be explained from production instead
// of guessed at.
export async function probeAirportBackdrop(icao) {
  const apiKey = process.env.PEXELS_API_KEY;
  const place = airportPlace(icao);
  if (!place) return { icao, place: null, error: 'ICAO not in airport-cities.json' };
  if (!apiKey) return { icao, place, error: 'PEXELS_API_KEY is not set' };

  let cached;
  try {
    cached = (await getRedis()?.get(`${REDIS_PREFIX}${icao}`)) ?? null;
  } catch (error) {
    cached = `cache read failed: ${error.message}`;
  }

  const tiers = [];
  let rateLimitRemaining = null;
  for (const tier of searchTiers(place)) {
    try {
      const result = await searchPexels(tier.query, apiKey, tier.orientation);
      rateLimitRemaining = result.rateLimitRemaining ?? rateLimitRemaining;
      tiers.push({ ...tier, results: result.photos.length, picked: pickPhoto(result.photos, icao) });
    } catch (err) {
      tiers.push({ ...tier, error: err.message });
    }
  }

  return {
    icao,
    place,
    cached,
    tiers,
    rateLimitRemaining,
    resolved: tiers.find((t) => t.picked)?.picked || null,
  };
}
