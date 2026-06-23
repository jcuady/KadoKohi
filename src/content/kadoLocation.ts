/**
 * Canonical Kado Kohi cafe address & map links (Marikina flagship).
 * Used by footer, contact page, SEO schema, FAQ, and app settings defaults.
 */
export const KADO_LOCATION = {
  businessName: 'Kado Kohi',
  /** How guests find us on Google Maps */
  mapsSearchName: 'Kado Coffee',
  streetAddress: 'J.P. Laurel St. corner Mt. Everest',
  locality: 'Marikina City',
  neighborhood: 'Sta. Elena',
  region: 'Metro Manila',
  country: 'Philippines',
  postalCode: '1807',
  /** Footer, contact cards */
  displayAddress: 'J.P. Laurel St. corner Mt. Everest, Marikina City, Philippines 1807',
  /** Schema / listings */
  fullAddress: 'J.P. Laurel St. corner Mt. Everest, Marikina City, Philippines 1807',
  /** Mountain View Village, San Roque — named query used for map pin accuracy */
  latitude: 14.6291,
  longitude: 121.1045,
} as const;

function mapsQuery(): string {
  return `${KADO_LOCATION.mapsSearchName}, ${KADO_LOCATION.displayAddress}`;
}

export function kadoMapsSearchUrl(): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery())}`;
}

export function kadoMapsDirectionsUrl(): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapsQuery())}`;
}

/** Google Maps iframe embed — resolves pin from business name + address (no API key). */
export function kadoMapsEmbedUrl(): string {
  const q = encodeURIComponent(mapsQuery());
  return `https://maps.google.com/maps?q=${q}&hl=en&z=18&iwloc=near&output=embed`;
}

/** Legacy placeholder embed shipped before real coordinates were wired. */
export function isStaleMapsEmbedUrl(url: string | undefined | null): boolean {
  const u = url?.trim() ?? '';
  if (!u) return true;
  return /0x0%3A0x0|4v1234567890|1d3860\.6!2d121\.1!3d14\.65/.test(u);
}
