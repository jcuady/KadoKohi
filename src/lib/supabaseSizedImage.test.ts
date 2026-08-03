import { afterEach, describe, expect, it, vi } from 'vitest';
import { displaySizedImage, supabaseSizedImage } from './supabaseSizedImage';

const OBJECT =
  'https://idwtlujcdfnnndxmlaco.supabase.co/storage/v1/object/public/kado-cms-images/foo/bar.jpg?v=1';

describe('supabaseSizedImage', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('passes through object URLs when Image Transformation is off (prod default)', () => {
    vi.stubEnv('VITE_SUPABASE_IMAGE_TRANSFORM', '');
    const out = supabaseSizedImage(OBJECT, { width: 800, quality: 70 });
    expect(out).toBe(OBJECT);
    expect(out).not.toContain('/render/image/');
  });

  it('rewrites to render endpoint when VITE_SUPABASE_IMAGE_TRANSFORM=true', () => {
    vi.stubEnv('VITE_SUPABASE_IMAGE_TRANSFORM', 'true');
    const out = supabaseSizedImage(OBJECT, { width: 800, quality: 70 });
    expect(out).toContain('/storage/v1/render/image/public/kado-cms-images/foo/bar.jpg');
    expect(out).toContain('width=800');
    expect(out).toContain('quality=70');
  });

  it('leaves local paths untouched', () => {
    expect(displaySizedImage('/featuredmarikina/kadom1.webp', 800)).toBe('/featuredmarikina/kadom1.webp');
  });
});
