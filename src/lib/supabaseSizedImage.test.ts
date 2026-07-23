import { describe, expect, it } from 'vitest';
import { displaySizedImage, supabaseSizedImage } from './supabaseSizedImage';

describe('supabaseSizedImage', () => {
  it('rewrites public object URLs to the render endpoint', () => {
    const src =
      'https://idwtlujcdfnnndxmlaco.supabase.co/storage/v1/object/public/kado-cms-images/foo/bar.jpg?v=1';
    const out = supabaseSizedImage(src, { width: 800, quality: 70 });
    expect(out).toContain('/storage/v1/render/image/public/kado-cms-images/foo/bar.jpg');
    expect(out).toContain('width=800');
    expect(out).toContain('quality=70');
  });

  it('leaves local paths untouched', () => {
    expect(displaySizedImage('/featuredmarikina/kadom1.webp', 800)).toBe('/featuredmarikina/kadom1.webp');
  });
});
