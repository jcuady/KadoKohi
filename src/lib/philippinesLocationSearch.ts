/** OpenStreetMap Nominatim — Philippines-only geocoding for admin branch pins. */

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
  state?: string;
  postcode?: string;
};

type NominatimHit = {
  lat: string;
  lon: string;
  display_name: string;
  type?: string;
  class?: string;
  address?: NominatimAddress;
};

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const PH_VIEWBOX = '116.0,4.5,127.0,21.5'; // lng/lat bounds — mainland PH + major islands

let lastRequestAt = 0;

async function nominatimFetch(path: string): Promise<unknown> {
  const now = Date.now();
  const wait = Math.max(0, 1100 - (now - lastRequestAt));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();

  const res = await fetch(`${NOMINATIM}${path}`, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en',
    },
  });
  if (!res.ok) throw new Error('Location search is temporarily unavailable.');
  return res.json();
}

function searchTokens(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function rankHit(query: string, hit: NominatimHit): number {
  const tokens = searchTokens(query);
  if (!tokens.length) return 0;
  const haystack = hit.display_name.toLowerCase();
  const q = query.trim().toLowerCase();
  // Require every token for precision inside PH search.
  if (!tokens.every((t) => haystack.includes(t))) return -1;

  let score = tokens.length * 12;
  if (haystack.startsWith(q)) score += 40;
  else if (haystack.includes(q)) score += 18;
  if (hit.class === 'amenity' || hit.type === 'cafe' || hit.type === 'restaurant' || hit.type === 'mall') {
    score += 10;
  }
  if (hit.class === 'shop' || hit.class === 'tourism') score += 6;
  if (hit.address?.city || hit.address?.municipality || hit.address?.town) score += 4;
  if (haystack.includes('philippines')) score += 2;
  return score;
}

function parseCity(address?: NominatimAddress): string | undefined {
  if (!address) return undefined;
  return (
    address.city ??
    address.municipality ??
    address.town ??
    address.village ??
    address.suburb ??
    undefined
  );
}

function parseStreet(address?: NominatimAddress): string | undefined {
  if (!address) return undefined;
  const parts = [address.house_number, address.road, address.neighbourhood].filter(Boolean);
  return parts.length ? parts.join(' ') : undefined;
}

function toResult(hit: NominatimHit): PhilippinesLocationResult {
  return {
    lat: Number(hit.lat),
    lng: Number(hit.lon),
    label: hit.display_name,
    addressLine: parseStreet(hit.address),
    city: parseCity(hit.address),
  };
}

export async function searchPhilippinesLocations(query: string): Promise<PhilippinesLocationResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const params = new URLSearchParams({
    q,
    format: 'json',
    addressdetails: '1',
    countrycodes: 'ph',
    limit: '12',
    viewbox: PH_VIEWBOX,
    bounded: '0',
  });

  const data = (await nominatimFetch(`/search?${params}`)) as NominatimHit[];
  if (!Array.isArray(data)) return [];

  const ranked = data
    .map((hit) => ({ hit, score: rankHit(q, hit) }))
    .filter((row) => row.score >= 0)
    .sort((a, b) => b.score - a.score);

  // Dedupe near-identical pins (same place, slightly different labels).
  const seen = new Set<string>();
  const unique: NominatimHit[] = [];
  for (const row of ranked) {
    const key = `${Number(row.hit.lat).toFixed(4)},${Number(row.hit.lon).toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(row.hit);
    if (unique.length >= 8) break;
  }
  return unique.map(toResult);
}

export async function reversePhilippinesLocation(
  lat: number,
  lng: number,
): Promise<PhilippinesLocationResult | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: 'json',
    addressdetails: '1',
    zoom: '18',
  });

  const data = (await nominatimFetch(`/reverse?${params}`)) as NominatimHit | { error?: string };
  if (!data || typeof data !== 'object' || !('lat' in data)) return null;
  return toResult(data as NominatimHit);
}
