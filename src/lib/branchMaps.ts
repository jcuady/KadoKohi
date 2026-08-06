import type { Branch } from '../types/domain';

export function branchGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function branchOsmEmbedUrl(lat: number, lng: number): string {
  const d = 0.005;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d},${lat - d},${lng + d},${lat + d}&layer=mapnik&marker=${lat},${lng}`;
}

/** Google Maps directions to the branch street address (preferred over coarse pins). */
export function branchDirectionsUrl(
  branch: Pick<Branch, 'lat' | 'lng' | 'name' | 'address' | 'city'>,
): string {
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
