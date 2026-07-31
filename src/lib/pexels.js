import { cacheLife, cacheTag } from 'next/cache';
import airportCities from '@/data/airport-cities.json';

// Backdrop photos for the gallery view of /crew/routes: each card shows the
// place it flies TO. https://www.pexels.com/api/documentation/#photos-search
//
// The routes table stores ICAO codes and nothing else, so the place name comes
// from src/data/airport-cities.json — "ICAO": "City|Country", generated from the
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
  const [ city, country ] = entry.split('|');
  return { city, country: country || '' };
}

async function searchPexels(query, apiKey) {
  const url = `${PEXELS_SEARCH}?query=${encodeURIComponent(query)}&per_page=8&orientation=landscape`;
  const res = await fetch(url, { headers: { Authorization: apiKey } });

  // 429 is the rate limit — throwing means it isn't cached, so the next request
  // for this airport retries instead of being pinned to "no photo" for a day.
  if (!res.ok) throw new Error(`Pexels search failed (${res.status}) for "${query}"`);

  const json = await res.json();
  const photo = (json.photos || []).find((p) => p?.src?.original);
  return photo ? `${photo.src.original}?${SIZE_PARAMS}` : null;
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

  // Widening tiers, tried only on a miss. "<city> skyline" is what gets a
  // cinematic wide shot for a big city; the smaller the place, the more likely
  // it falls through to a shot of the country instead of nothing at all.
  const queries = [
    `${place.city} skyline`,
    place.country ? `${place.city} ${place.country}` : place.city,
    place.country ? `${place.country} landscape` : null,
  ].filter(Boolean);

  for (const query of queries) {
    const url = await searchPexels(query, apiKey);
    if (url) return url;
  }
  return null;
}
