/** Philippines geocoding for admin branch pins — via kk-geocode Edge Function (Nominatim proxy). */

import { supabase } from './supabase/client';

export type PhilippinesLocationResult = {
  lat: number;
  lng: number;
  label: string;
  addressLine?: string;
  city?: string;
};

type NominatimAddress = {
  road?: string;
  house_number?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  municipality?: string;
  town?: string;
  village?: string;
  city_district?: string;
  state?: string;
  postcode?: string;
  amenity?: string;
  building?: string;
  shop?: string;
  tourism?: string;
  leisure?: string;
};

type NominatimHit = {
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  type?: string;
  class?: string;
  address?: NominatimAddress;
};

/** Tokens that rarely exist in OSM (brand names) — peel them when search returns empty. */
const BRANDISH_STOP = new Set([
  'kado',
  'kohi',
  'cafe',
  'coffee',
  'shop',
  'the',
  'and',
  'branch',
  'store',
]);

let lastRequestAt = 0;

type GeocodeSearchResponse = { ok?: boolean; results?: NominatimHit[]; message?: string };
type GeocodeReverseResponse = {
  ok?: boolean;
  result?: NominatimHit | { error?: string };
  message?: string;
};

/** Browser-safe geocode — Nominatim is proxied by Edge Function kk-geocode (CORS). */
async function invokeGeocode(
  body: { mode: 'search'; q: string } | { mode: 'reverse'; lat: number; lng: number },
): Promise<unknown> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const now = Date.now();
  const wait = Math.max(0, 1100 - (now - lastRequestAt));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();

  const { data, error } = await supabase.functions.invoke('kk-geocode', { body });

  if (error) {
    const ctx = (error as { context?: Response }).context;
    if (ctx) {
      try {
        const payload = (await ctx.clone().json()) as { message?: string };
        if (payload?.message) throw new Error(payload.message);
      } catch (inner) {
        if (inner instanceof Error && inner.message && !/json/i.test(inner.message)) throw inner;
      }
    }
    throw new Error(error.message || 'Location search is temporarily unavailable.');
  }

  return data;
}

async function nominatimSearchRaw(q: string): Promise<NominatimHit[]> {
  const data = (await invokeGeocode({ mode: 'search', q })) as GeocodeSearchResponse;
  if (data && data.ok === false) {
    throw new Error(data.message || 'Location search is temporarily unavailable.');
  }
  return Array.isArray(data?.results) ? data.results : [];
}

function searchTokens(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/[\s,]+/)
    .filter((t) => t.length > 1);
}

function rankHit(query: string, hit: NominatimHit): number {
  const tokens = searchTokens(query);
  if (!tokens.length) return 0;
  const haystack = `${hit.name ?? ''} ${hit.display_name}`.toLowerCase();
  const matched = tokens.filter((t) => haystack.includes(t)).length;
  if (matched === 0) return -1;

  const coverage = matched / tokens.length;
  let score = matched * 14 + coverage * 30;
  const q = query.trim().toLowerCase();
  if (haystack.includes(q)) score += 24;
  if (hit.class === 'amenity' || hit.type === 'cafe' || hit.type === 'restaurant' || hit.type === 'mall') {
    score += 12;
  }
  if (hit.class === 'building' || hit.class === 'shop' || hit.class === 'tourism') score += 8;
  if (hit.address?.city || hit.address?.municipality || hit.address?.town) score += 4;
  return score;
}

function parseCity(address?: NominatimAddress): string | undefined {
  if (!address) return undefined;
  return (
    address.city ??
    address.municipality ??
    address.town ??
    address.village ??
    address.city_district ??
    address.suburb ??
    undefined
  );
}

/** Prefer a customer-facing street line; fall back to leading display_name parts. */
function parseAddressLine(hit: NominatimHit): string | undefined {
  const a = hit.address;
  if (a) {
    const named =
      a.amenity ?? a.building ?? a.shop ?? a.tourism ?? a.leisure ?? hit.name ?? undefined;
    const roadBits = [a.house_number, a.road].filter(Boolean).join(' ');
    const area = a.neighbourhood ?? a.suburb;
    const parts = [named, roadBits || undefined, area].filter(Boolean) as string[];
    if (parts.length) return parts.join(', ');
  }
  const chunks = hit.display_name
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !/philippines|metro manila|eastern manila|district/i.test(s));
  if (!chunks.length) return undefined;
  return chunks.slice(0, 3).join(', ');
}

function toResult(hit: NominatimHit): PhilippinesLocationResult {
  return {
    lat: Number(hit.lat),
    lng: Number(hit.lon),
    label: hit.display_name,
    addressLine: parseAddressLine(hit),
    city: parseCity(hit.address),
  };
}

function dedupeHits(hits: NominatimHit[], limit = 8): NominatimHit[] {
  const seen = new Set<string>();
  const unique: NominatimHit[] = [];
  for (const hit of hits) {
    const key = `${Number(hit.lat).toFixed(4)},${Number(hit.lon).toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(hit);
    if (unique.length >= limit) break;
  }
  return unique;
}

/**
 * Parse a pasted Google Maps URL into coordinates or a search query.
 * Returns null if the string is not a Maps link.
 */
export function parseGoogleMapsInput(
  input: string,
): { lat: number; lng: number } | { query: string } | null {
  const t = input.trim();
  if (!t) return null;
  const looksLikeMaps =
    /google\.[^/\s]+\/maps/i.test(t) ||
    /maps\.google\./i.test(t) ||
    /maps\.app\.goo\.gl/i.test(t) ||
    /goo\.gl\/maps/i.test(t);
  if (!looksLikeMaps) return null;

  const qCoord = t.match(/[?&]q=(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/i);
  if (qCoord) return { lat: Number(qCoord[1]), lng: Number(qCoord[2]) };

  const ll = t.match(/[?&]ll=(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/i);
  if (ll) return { lat: Number(ll[1]), lng: Number(ll[2]) };

  const at = t.match(/@(-?\d+\.?\d+)\s*,\s*(-?\d+\.?\d+)/);
  if (at) return { lat: Number(at[1]), lng: Number(at[2]) };

  const d3 = t.match(/!3d(-?\d+\.?\d+)!4d(-?\d+\.?\d+)/);
  if (d3) return { lat: Number(d3[1]), lng: Number(d3[2]) };

  const queryParam = t.match(/[?&](?:q|query)=([^&]+)/i);
  if (queryParam) {
    const decoded = decodeURIComponent(queryParam[1].replace(/\+/g, ' ')).trim();
    if (/^-?\d+\.?\d+\s*,\s*-?\d+\.?\d+$/.test(decoded)) {
      const [lat, lng] = decoded.split(',').map((n) => Number(n.trim()));
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
    if (decoded && !/^-?\d+\.?\d+/.test(decoded)) return { query: decoded };
  }

  const place = t.match(/\/place\/([^/@]+)/i);
  if (place) {
    return { query: decodeURIComponent(place[1].replace(/\+/g, ' ')).replace(/-/g, ' ') };
  }

  return null;
}

/** Progressive query variants when brand POIs are missing from OSM. */
export function buildPhilippinesSearchVariants(query: string): string[] {
  const raw = query.trim().replace(/\s+/g, ' ');
  if (!raw) return [];

  const variants: string[] = [raw];
  const commaParts = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (commaParts.length > 1) {
    variants.push(commaParts[0]);
    variants.push(commaParts.slice(0, 2).join(', '));
    const firstWords = commaParts[0].split(/\s+/).filter(Boolean);
    if (firstWords.length >= 2) variants.push(firstWords.slice(0, 2).join(' '));
    if (firstWords.length >= 3) variants.push(firstWords.slice(0, 3).join(' '));
    // Drop postal / "Metro Manila" noise from the end.
    const trimmed = commaParts.filter(
      (p) => !/^\d{4}$/.test(p) && !/metro manila|philippines/i.test(p),
    );
    if (trimmed.length >= 2) variants.push(trimmed.slice(0, 2).join(', '));
    if (trimmed.length >= 3) variants.push(`${trimmed[0]} ${trimmed[trimmed.length - 1]}`);
  }

  const words = raw.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    variants.push(words.slice(-2).join(' '));
    variants.push(words.slice(-3).join(' '));
  }

  // Peel brandish leading tokens: "kado kohi greenhills" → "greenhills"
  const peeled = [...words];
  while (peeled.length > 1 && BRANDISH_STOP.has(peeled[0].toLowerCase())) {
    peeled.shift();
    variants.push(peeled.join(' '));
  }

  // Unique, keep order, drop ultra-short
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of variants) {
    const key = v.toLowerCase();
    if (key.length < 3 || seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

async function searchVariant(q: string): Promise<PhilippinesLocationResult[]> {
  const data = await nominatimSearchRaw(q);
  const ranked = data
    .map((hit) => ({ hit, score: rankHit(q, hit) }))
    .filter((row) => row.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map((row) => row.hit);
  return dedupeHits(ranked).map(toResult);
}

export async function searchPhilippinesLocations(query: string): Promise<PhilippinesLocationResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const maps = parseGoogleMapsInput(q);
  if (maps && 'lat' in maps) {
    const rev = await reversePhilippinesLocation(maps.lat, maps.lng);
    return [
      rev ?? {
        lat: maps.lat,
        lng: maps.lng,
        label: `${maps.lat.toFixed(6)}, ${maps.lng.toFixed(6)}`,
      },
    ];
  }

  const seed = maps && 'query' in maps ? maps.query : q;
  for (const variant of buildPhilippinesSearchVariants(seed)) {
    const hits = await searchVariant(variant);
    if (hits.length) return hits;
  }
  return [];
}

/** Geocode a pasted street address (may be long / Google-formatted). */
export async function geocodePhilippinesAddress(
  address: string,
  cityHint?: string,
): Promise<PhilippinesLocationResult | null> {
  const base = address.trim();
  if (base.length < 3) return null;

  const maps = parseGoogleMapsInput(base);
  if (maps && 'lat' in maps) {
    return (
      (await reversePhilippinesLocation(maps.lat, maps.lng)) ?? {
        lat: maps.lat,
        lng: maps.lng,
        label: `${maps.lat.toFixed(6)}, ${maps.lng.toFixed(6)}`,
        addressLine: base,
        city: cityHint,
      }
    );
  }

  const withCity =
    cityHint?.trim() && !base.toLowerCase().includes(cityHint.trim().toLowerCase())
      ? `${base}, ${cityHint.trim()}`
      : base;

  const hits = await searchPhilippinesLocations(withCity);
  return hits[0] ?? null;
}

export async function reversePhilippinesLocation(
  lat: number,
  lng: number,
): Promise<PhilippinesLocationResult | null> {
  const data = (await invokeGeocode({ mode: 'reverse', lat, lng })) as GeocodeReverseResponse;
  if (data && data.ok === false) {
    throw new Error(data.message || 'Location lookup is temporarily unavailable.');
  }
  const result = data?.result;
  if (!result || typeof result !== 'object' || !('lat' in result)) return null;
  return toResult(result as NominatimHit);
}
