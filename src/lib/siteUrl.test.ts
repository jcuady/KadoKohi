import { describe, expect, it } from 'vitest';
import { normalizeQrScanOrigin, PRODUCTION_SITE_URL } from './siteUrl';

describe('normalizeQrScanOrigin', () => {
  it('canonicalizes kadokohi production hosts to www', () => {
    expect(normalizeQrScanOrigin('https://kadokohi.com')).toBe(PRODUCTION_SITE_URL);
    expect(normalizeQrScanOrigin('https://www.kadokohi.com/')).toBe(PRODUCTION_SITE_URL);
    expect(normalizeQrScanOrigin('https://kado-kohi.vercel.app')).toBe(PRODUCTION_SITE_URL);
  });

  it('preserves non-production origins', () => {
    expect(normalizeQrScanOrigin('http://127.0.0.1:5174')).toBe('http://127.0.0.1:5174');
    expect(normalizeQrScanOrigin('https://preview.example.com/')).toBe('https://preview.example.com');
  });

  it('falls back safely on garbage input', () => {
    expect(normalizeQrScanOrigin('not-a-url')).toBe('not-a-url');
  });
});
