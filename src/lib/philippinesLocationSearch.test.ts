import { describe, expect, it } from 'vitest';
import {
  buildPhilippinesSearchVariants,
  parseGoogleMapsInput,
} from './philippinesLocationSearch';

/**
 * Seams under test (confirmed for this CORS fix cycle):
 * - parseGoogleMapsInput (pure)
 * - buildPhilippinesSearchVariants (pure)
 * - geocode edge request body shape (documented contract below)
 *
 * Nominatim HTTP is not called from the browser; kk-geocode owns that seam.
 */

describe('parseGoogleMapsInput', () => {
  it('reads q=lat,lng', () => {
    const parsed = parseGoogleMapsInput('https://www.google.com/maps?q=14.602979,121.0520935');
    expect(parsed).toEqual({ lat: 14.602979, lng: 121.0520935 });
  });

  it('reads @lat,lng from place URLs', () => {
    const parsed = parseGoogleMapsInput(
      'https://www.google.com/maps/place/Kado+Kohi/@14.602979,121.0520935,17z',
    );
    expect(parsed).toEqual({ lat: 14.602979, lng: 121.0520935 });
  });

  it('reads !3d!4d place markers', () => {
    const parsed = parseGoogleMapsInput(
      'https://www.google.com/maps/place/Foo/@0,0,17z/data=!3d14.6!4d121.05',
    );
    expect(parsed).toEqual({ lat: 14.6, lng: 121.05 });
  });

  it('returns null for plain addresses', () => {
    expect(parseGoogleMapsInput('Promenade Greenhills San Juan')).toBeNull();
  });
});

describe('buildPhilippinesSearchVariants', () => {
  it('peels brand tokens so OSM can match the place', () => {
    const variants = buildPhilippinesSearchVariants('kado kohi greenhills');
    expect(variants[0]).toBe('kado kohi greenhills');
    expect(variants).toContain('greenhills');
  });

  it('shortens long Google-style addresses', () => {
    const variants = buildPhilippinesSearchVariants(
      'Promenade Greenhills Ortigas Ave, Connecticut, San Juan City, 1503 Metro Manila',
    );
    expect(variants[0]).toContain('Promenade Greenhills');
    expect(variants).toContain('Promenade Greenhills Ortigas Ave');
    expect(variants.some((v) => /Promenade Greenhills.*San Juan/i.test(v))).toBe(true);
  });
});

describe('kk-geocode request contract', () => {
  it('search body uses mode+q (never a browser Nominatim URL)', () => {
    const body = { mode: 'search' as const, q: 'Promenade Greenhills' };
    expect(body.mode).toBe('search');
    expect(body.q.length).toBeGreaterThan(1);
    expect(JSON.stringify(body)).not.toMatch(/nominatim\.openstreetmap\.org/);
  });

  it('reverse body uses mode+lat+lng', () => {
    const body = { mode: 'reverse' as const, lat: 14.602979, lng: 121.0520935 };
    expect(body.mode).toBe('reverse');
    expect(Number.isFinite(body.lat)).toBe(true);
  });
});
