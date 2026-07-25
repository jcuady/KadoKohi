import { describe, expect, it } from 'vitest';
import { resolveFeaturedDrinkImage } from './featuredDrinkImage';
import type { Product } from '../types/domain';

const drink = {
  id: 'prod_matcha_oat',
  name: 'Matcha Oat Latte',
  image: 'https://cdn.example/menu-large.jpg',
} as Product;

describe('resolveFeaturedDrinkImage', () => {
  it('prefers CMS override over local cutout and menu image', () => {
    expect(resolveFeaturedDrinkImage(drink, 'https://cms.example/custom.webp')).toBe(
      'https://cms.example/custom.webp',
    );
  });

  it('falls back to local cutout when override empty', () => {
    expect(resolveFeaturedDrinkImage(drink, '  ')).toBe('/featured/matcha-oat.webp');
  });
});
