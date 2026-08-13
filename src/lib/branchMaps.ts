import type { Branch } from '../types/domain';

/** Official Google Maps place for Promenade Greenhills. */
export const GREENHILLS_MAPS_URL = 'https://maps.app.goo.gl/uxnZNSRxFmSg84Kz7';
export const GREENHILLS_PHONE = '09605779641';

export function isGreenhillsBranch(branch: { id?: string; slug?: string }): boolean {
  const slug = branch.slug?.toLowerCase() ?? '';
  const id = branch.id?.toLowerCase() ?? '';
  return slug.includes('greenhills') || id.includes('greenhills');
}

export function branchGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function branchOsmEmbedUrl(lat: number, lng: number): string {
  const d = 0.005;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d},${lat - d},${lng + d},${lat + d}&layer=mapnik&marker=${lat},${lng}`;
}

/** Google Maps link: stored share URL, then Greenhills canonical, then address search. */
export function branchDirectionsUrl(
  branch: Pick<Branch, 'lat' | 'lng' | 'name' | 'address' | 'city'> & {
    id?: string;
    slug?: string;
    mapsUrl?: string;
  },
): string {
  if (branch.mapsUrl?.trim()) return branch.mapsUrl.trim();
  if (isGreenhillsBranch(branch)) return GREENHILLS_MAPS_URL;
  const destination = [branch.address, branch.city, 'Philippines']
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ');
  if (destination) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
  }
  if (branch.lat != null && branch.lng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${branch.lat},${branch.lng}`;
  }
  const q = encodeURIComponent([branch.name, 'Philippines'].filter(Boolean).join(', '));
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export function resolveBranchPhone(
  branch: Pick<Branch, 'phone'> & { id?: string; slug?: string },
): string | undefined {
  if (branch.phone?.trim()) return branch.phone.trim();
  if (isGreenhillsBranch(branch)) return GREENHILLS_PHONE;
  return undefined;
}

export function formatBranchPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('09')) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return phone;
}

export function branchTelHref(phone: string): string {
  return `tel:${phone.replace(/\D/g, '')}`;
}

const BRANCH_IMAGE_FALLBACKS: Record<string, string> = {
  marikina: '/featuredmarikina/kadom1.jpg',
  greenhills: '/featuredmarikina/kadom2.jpg',
};

export function branchHeroImageUrl(branch: Pick<Branch, 'slug' | 'heroImage'>): string {
  if (branch.heroImage?.trim()) return branch.heroImage.trim();
  const slug = branch.slug.toLowerCase();
  for (const [key, url] of Object.entries(BRANCH_IMAGE_FALLBACKS)) {
    if (slug.includes(key)) return url;
  }
  return '/featuredmarikina/kadom1.jpg';
}
