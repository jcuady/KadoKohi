import { SEO_SIGNATURE_DRINKS } from '@/content/seo';
import type { MenuSeoPillarCategoryKey } from '@/store/landingContentStore';

export function drinksForMenuSeoPillar(key: MenuSeoPillarCategoryKey) {
  switch (key) {
    case 'matcha':
      return SEO_SIGNATURE_DRINKS.filter((d) => d.category === 'Matcha & Hojicha');
    case 'signatures':
      return SEO_SIGNATURE_DRINKS.filter((d) => d.category === 'Signatures');
    case 'classics-yuzu':
      return SEO_SIGNATURE_DRINKS.filter((d) => d.category === 'Classics' || d.category === 'Yuzu');
  }
}
