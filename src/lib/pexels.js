import { cacheLife, cacheTag } from 'next/cache';
import airportCities from '@/data/airport-cities.json';

// Backdrop photos for the gallery view of /crew/routes: each card shows the
// place it flies TO. https://www.pexels.com/api/documentation/#photos-search
//
// The routes table stores ICAO codes and nothing else, so the place name comes
// from src/data/airport-cities.json — "ICAO": "City|Region|Country", from the
// OurAirports dataset (public domain) for every airport the network currently
// serves plus every large airport worldwide, so new routes resolve without a
// regeneration. It is indexed under both the current ICAO and the legacy ident,
// because the routes table still uses pre-renaming codes (UAFM, not UCFM).
//
// Photos are looked up ONE AIRPORT AT A TIME and cached per ICAO, which is what
// keeps this inside the Pexels rate limit: the network has ~363 arrival
// airports, so once each has been resolved the API is barely touched again.

const PEXELS_SEARCH = 'https://api.pexels.com/v1/search';

// The rendered card is ~400x320 CSS px, so 800x520 is a 2x-ish crop —
// src.landscape (1200x627) would be ~3x the bytes for no visible gain.
const SIZE_PARAMS = 'auto=compress&cs=tinysrgb&fit=crop&w=800&h=520';

export function airportPlace(icao) {
  const entry = airportCities[ icao ];
  if (!entry) return null;
  const [ city, region, country ] = entry.split('|');
  return { city, region: region || '', country: country || '' };
}

async function searchPexels(query, apiKey, orientation) {
  const url = `${PEXELS_SEARCH}?query=${encodeURIComponent(query)}&per_page=15`
    + (orientation ? `&orientation=${orientation}` : '');
  const res = await fetch(url, { headers: { Authorization: apiKey } });

  // 429 is the rate limit — throwing means it isn't cached, so the next request
  // for this airport retries instead of being pinned to "no photo" for a day.
  if (!res.ok) throw new Error(`Pexels search failed (${res.status}) for "${query}"`);

  const json = await res.json();
  const photos = (json.photos || [])
    .filter((photo) => photo?.src?.original)
    .map((photo) => ({
      url: `${photo.src.original}?${SIZE_PARAMS}`,
      // Documented as "useful for a placeholder while the image loads" — the
      // card paints this flat colour immediately and fades the photo in over it,
      // so a slow backdrop reads as the photo resolving rather than as a card
      // that changed its mind about what it looks like.
      color: photo.avg_color || null,
    }));

  return { photos, rateLimitRemaining: res.headers.get('X-Ratelimit-Remaining') };
}

// Which of the results to use. Taking photos[0] would be fine for a city query,
// where the query itself is unique — but the country fallback below is shared by
// every small airport in that country, so first-result would hand Tirupati,
// Tiruchirappalli and Porbandar the *same* photo. Hashing the ICAO spreads them
// across the result page while staying stable for a given airport.
function pickPhoto(photos, seed) {
  if (!photos.length) return null;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return photos[ hash % photos.length ];
}

// Cached in the durable platform cache: the photo for an airport is the same for
// every pilot and only needs to be fresh enough not to feel stale. A thrown
// error is never cached, so an outage or a rate-limit isn't pinned for a day.
export async function fetchAirportBackdrop(icao) {
  'use cache: remote'
  cacheLife('days')
  cacheTag('route-backdrops')

  const apiKey = process.env.PEXELS_API_KEY;
  const place = airportPlace(icao);
  if (!apiKey || !place) return null;

  for (const tier of searchTiers(place)) {
    const { photos } = await searchPexels(tier.query, apiKey, tier.orientation);
    const photo = pickPhoto(photos, icao);
    if (photo) return photo;
  }
  return null;
}

// Widening tiers, tried in order and only on a miss. The ladder narrows the
// assumption at each step rather than special-casing any airport:
//
//  1. "<city> tourism" — what the place is photographed FOR. Beats "<city>
//     skyline" in practice: skyline only exists for cities that have one, while
//     every place with any coverage at all has been shot by someone selling a
//     visit to it.
//  2. "<city> <country>" — drops the tourism qualifier and disambiguates the
//     name against the rest of the world. Also drops the orientation constraint:
//     Pexels' website searches every orientation, so a place can look well
//     covered there while `orientation=landscape` returns almost nothing through
//     the API (temple towns and hill stations are photographed mostly portrait).
//     A portrait photo centre-cropped to 800x520 is still a photo of that place.
//  3. "<region> <country>" — the state/province. This is the tier that stops a
//     small airport falling all the way to a generic national photo: Tirupati
//     gets Andhra Pradesh, not "India". 91% of mapped airports carry a usable
//     region (the rest are city-states, or regions whose name is only a compass
//     bearing, and they skip straight to 4).
//  4. "<country> landscape" — last resort, and the reason pickPhoto hashes: this
//     tier is shared by every airport in the country, so taking the first result
//     would give them all one identical photo.
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

// Uncached diagnostic behind the staff-only debug flag on
// /api/routes/backdrops: reports how many results each tier actually returns for
// an airport, so a card that renders a bare gradient can be explained from
// production instead of guessed at.
export async function probeAirportBackdrop(icao) {
  const apiKey = process.env.PEXELS_API_KEY;
  const place = airportPlace(icao);
  if (!place) return { icao, place: null, error: 'ICAO not in airport-cities.json' };
  if (!apiKey) return { icao, place, error: 'PEXELS_API_KEY is not set' };

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
    tiers,
    rateLimitRemaining,
    resolved: tiers.find((t) => t.picked)?.picked || null,
  };
}
