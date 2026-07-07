import { newId } from './id';
import { orderingRepo } from './supabase/repositories/ordering';

const SAFE_EXT = ['png', 'jpg', 'jpeg', 'webp', 'heic', 'heif'] as const;

function safeImageExt(file: File): string {
  const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  return SAFE_EXT.includes(ext as (typeof SAFE_EXT)[number]) ? ext : 'jpg';
}

/** Build a unique storage path under a CMS prefix (e.g. landing/hero). */
export function cmsImagePath(prefix: string, file: File): string {
  const clean = prefix.replace(/^\/+|\/+$/g, '');
  return `${clean}/${newId()}.${safeImageExt(file)}`;
}

export async function uploadCmsImageFile(file: File, prefix: string): Promise<string> {
  return orderingRepo.uploadCmsImage(file, cmsImagePath(prefix, file));
}

/** Map inline-edit field ids to storage prefixes for landing preview uploads. */
export function cmsImagePrefixForField(fieldId: string): string {
  const [section, ...rest] = fieldId.split('.');
  if (section === 'hero') {
    if (rest[0] === 'slide') return `landing/hero/slides/${rest[1] ?? 'slide'}`;
    if (rest[0] === 'card') return `landing/hero/cards/${rest[1] ?? '0'}-${rest[2] ?? '0'}`;
    return 'landing/hero';
  }
  if (section === 'story' && rest[0] === 'pillar') return `landing/story/pillars/${rest[1] ?? '0'}`;
  if (section === 'menu-seo' && rest[0] === 'pillar') return `landing/menu-seo/pillars/${rest[1] ?? '0'}`;
  if (section === 'events') return 'landing/events/cover';
  if (section === 'featured' && rest[0] === 'card') return `landing/featured/cards/${rest[1] ?? '0'}`;
  if (section === 'testimonials' && rest[0] === 'item') return `landing/testimonials/items/${rest[1] ?? '0'}`;
  if (section === 'testimonials' && rest[0] === 'trustedBrand') return `landing/testimonials/brands/${rest[1] ?? '0'}`;
  return `landing/misc/${fieldId.replace(/\./g, '-')}`;
}
