import { Redis } from '@upstash/redis';
import airportCities from '@/data/airport-cities.json';

// Backdrop photos for the gallery view of /crew/routes: each card shows the
// place it flies TO. https://www.pexels.com/api/documentation/#photos-search
//
// The routes table stores ICAO codes and nothing else, so the place name first
// comes from src/data/airport-cities.json — "ICAO": "City|Region|Country", from
// the OurAirports dataset (public domain) for every airport the network serves
// plus every large airport worldwide. If a newly-added airport is missing from
// that bundled map, the server falls back to the live OurAirports CSV dumps and
// caches the resolved city/region/country separately.
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
const OURAIRPORTS_BASE = 'https://davidmegginson.github.io/ourairports-data';

// The rendered card is ~400x320 CSS px, so 800x520 is a 2x-ish crop —
// src.landscape (1200x627) would be ~3x the bytes for no visible gain.
const SIZE_PARAMS = 'auto=compress&cs=tinysrgb&fit=crop&w=800&h=520';

// Bump the version segment to abandon every stored entry at once — necessary
// whenever the stored shape or the search strategy changes materially.
const REDIS_PREFIX = 'route-backdrop:v3:';
const HIT_TTL_SECONDS = 60 * 60 * 24 * 90;  // a city's photo needn't churn
const MISS_TTL_SECONDS = 60 * 60 * 6;       // a miss may be a blip; retry sooner
const MAX_PHOTOS_PER_AIRPORT = 6;
const PLACE_PREFIX = 'route-backdrop-place:v1:';
const PLACE_TTL_SECONDS = 60 * 60 * 24 * 30;

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

let _ourAirportsDataPromise;

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[ i ];
    const next = text[ i + 1 ];

    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function rowsByHeader(text) {
  const [ header = [], ...rows ] = parseCsv(text);
  return rows.map((row) => Object.fromEntries(header.map((key, i) => [ key, row[ i ] || '' ])));
}

async function fetchOurAirportsCsv(name) {
  const res = await fetch(`${OURAIRPORTS_BASE}/${name}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`OurAirports ${name} fetch failed (${res.status})`);
  return res.text();
}

async function getOurAirportsData() {
  if (!_ourAirportsDataPromise) {
    _ourAirportsDataPromise = (async () => {
      const [ airportsText, countriesText, regionsText ] = await Promise.all([
        fetchOurAirportsCsv('airports.csv'),
        fetchOurAirportsCsv('countries.csv'),
        fetchOurAirportsCsv('regions.csv'),
      ]);

      return {
        airports: rowsByHeader(airportsText),
        countries: new Map(rowsByHeader(countriesText).map((country) => [ country.code, country.name ])),
        regions: new Map(rowsByHeader(regionsText).map((region) => [ region.code, region.name ])),
      };
    })();
  }
  try {
    return await _ourAirportsDataPromise;
  } catch (error) {
    _ourAirportsDataPromise = null;
    throw error;
  }
}

// Callers pass an already-cleaned code. ~20 rows in the routes table store a
// routing note rather than a bare ICAO ("EBBR VIA GBYD", "DIAP (VIA DGAA)"), but
// that's normalised before it ever reaches here — by cleanIcao() in
// RoutesClient, which is the single definition feeding the display, the filters,
// the SimBrief deep links and this lookup, and again by the backdrops route,
// which can't assume the client did it. Deliberately not repeated here: a third
// copy of the rule is a third chance for the three to disagree.
export function airportPlace(icao) {
  const entry = airportCities[ icao ];
  if (!entry) return null;
  const [ city, region, country ] = entry.split('|');
  return { city, region: region || '', country: country || '' };
}

async function fetchOurAirportsPlace(icao) {
  const { airports, countries, regions } = await getOurAirportsData();
  const airport = airports.find((row) => (
    row.ident === icao || row.gps_code === icao || row.local_code === icao
  ));
  if (!airport) return null;

  const city = airport.municipality || airport.name?.replace(/\s+Airport$/i, '') || '';
  const region = regions.get(airport.iso_region) || '';
  const country = countries.get(airport.iso_country) || airport.iso_country || '';

  if (!city && !region && !country) return null;
  return { city, region, country };
}

async function resolveAirportPlace(icao) {
  const bundled = airportPlace(icao);
  if (bundled) return bundled;

  const redis = getRedis();
  if (redis) {
    try {
      const cached = await redis.get(`${PLACE_PREFIX}${icao}`);
      if (cached === 'none') return null;
      if (cached?.city || cached?.region || cached?.country) return cached;
    } catch (error) {
      console.error(`OurAirports place cache read failed for ${icao}:`, error.message);
    }
  }

  let place = null;
  try {
    place = await fetchOurAirportsPlace(icao);
  } catch (error) {
    console.error(`OurAirports place lookup failed for ${icao}:`, error.message);
    return null;
  }

  if (redis) {
    try {
      await redis.set(`${PLACE_PREFIX}${icao}`, place ?? 'none', { ex: PLACE_TTL_SECONDS });
    } catch (error) {
      console.error(`OurAirports place cache write failed for ${icao}:`, error.message);
    }
  }

  return place;
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
function seedIndex(seed, length) {
  if (!length) return 0;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % length;
}

function pickPhoto(photos, seed) {
  if (!photos.length) return null;
  return photos[ seedIndex(seed, photos.length) ];
}

function pickPhotoSet(photos, seed, limit) {
  if (!photos.length) return [];
  const cappedLimit = Math.max(1, Math.min(MAX_PHOTOS_PER_AIRPORT, limit || 1, photos.length));
  const start = seedIndex(seed, photos.length);
  return Array.from({ length: cappedLimit }, (_, i) => photos[ (start + i) % photos.length ]);
}

function normalizeStoredBackdrop(entry, desiredCount) {
  if (entry === 'none' || entry === null || entry === undefined) {
    return { value: entry === 'none' ? null : undefined, needsRefresh: entry !== 'none' };
  }

  const photos = Array.isArray(entry?.photos)
    ? entry.photos.filter((photo) => photo?.url)
    : (entry?.url ? [ entry ] : []);

  if (!photos.length) {
    return { value: null, needsRefresh: false };
  }

  return {
    value: { photos },
    needsRefresh: photos.length < Math.min(desiredCount, MAX_PHOTOS_PER_AIRPORT),
  };
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
export async function fetchAirportBackdrop(icao, photoLimit = 1) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) throw new Error('PEXELS_API_KEY is not set');

  const place = await resolveAirportPlace(icao);
  if (!place) return null;

  for (const tier of searchTiers(place)) {
    const { photos } = await searchPexels(tier.query, apiKey, tier.orientation);
    const picked = pickPhotoSet(photos, icao, photoLimit);
    if (picked.length) return { photos: picked };
  }
  return null;
}

// Resolve a batch, reading Redis first. One MGET covers the whole page, so a
// fully warm page costs a single round trip rather than one call per airport.
export async function resolveBackdrops(icaoRequests) {
  const redis = getRedis();
  const resolved = {};
  const desiredCounts = {};

  for (const icao of icaoRequests) {
    desiredCounts[ icao ] = Math.min(MAX_PHOTOS_PER_AIRPORT, (desiredCounts[ icao ] || 0) + 1);
  }

  const icaos = Object.keys(desiredCounts);
  let unknown = [ ...icaos ];

  if (redis) {
    try {
      const stored = await redis.mget(...icaos.map((icao) => `${REDIS_PREFIX}${icao}`));
      unknown = [];
      icaos.forEach((icao, i) => {
        const { value, needsRefresh } = normalizeStoredBackdrop(stored?.[ i ], desiredCounts[ icao ]);
        if (needsRefresh) {
          if (value !== undefined) resolved[ icao ] = value;
          unknown.push(icao);
        } else {
          // A stored miss is the string 'none' — distinguishable from "not
          // looked up yet", so a genuinely photo-less airport isn't re-searched
          // on every page view.
          resolved[ icao ] = value;
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
    const settled = await Promise.allSettled(
      batch.map((icao) => fetchAirportBackdrop(icao, desiredCounts[ icao ]))
    );

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

// Uncached diagnostic behind the staff-only debug flag on
// /api/routes/backdrops: reports how many results each tier actually returns for
// an airport, plus what is currently stored for it and the remaining quota — so
// a card that renders a bare gradient can be explained from production instead
// of guessed at.
export async function probeAirportBackdrop(icao) {
  const apiKey = process.env.PEXELS_API_KEY;
  const place = await resolveAirportPlace(icao);
  if (!place) return { icao, place: null, error: 'ICAO not in airport-cities.json or OurAirports' };
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
      tiers.push({
        ...tier,
        results: result.photos.length,
        picked: pickPhoto(result.photos, icao),
        pickedSet: pickPhotoSet(result.photos, icao, MAX_PHOTOS_PER_AIRPORT),
      });
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
    resolved: tiers.find((t) => t.pickedSet?.length)?.pickedSet || null,
  };
}
