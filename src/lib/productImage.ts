import type { Product } from '../types/domain';

/** Category fallbacks — same sources as public /menu when admin image URL is empty. */
export const PRODUCT_IMAGE_BY_CATEGORY: Record<string, string> = {
  cat_classics:
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=600&auto=format&fit=crop',
  cat_signatures:
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?q=80&w=600&auto=format&fit=crop',
  cat_matcha:
    'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=600&auto=format&fit=crop',
  cat_yuzu:
    'https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=600&auto=format&fit=crop',
};

export const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=600&auto=format&fit=crop';

export function getProductImageUrl(product: Pick<Product, 'image' | 'categoryId'>): string {
  const trimmed = product.image?.trim();
  if (trimmed) return trimmed;
  return PRODUCT_IMAGE_BY_CATEGORY[product.categoryId] ?? DEFAULT_PRODUCT_IMAGE;
}

export function getProductDescription(product: Product): string {
  if (product.description?.trim()) return product.description.trim();
  if (product.temperature === 'iced') return 'Served iced — crisp and refreshing.';
  if (product.temperature === 'both') return 'Available hot or iced.';
  return 'Crafted in-house with care.';
}
