import { describe, expect, it } from 'vitest';
import { KADO_CIRCLE_SPONSORS } from '../components/ui/cta-with-text-marquee';
import { cmsTextPlain } from './cmsTypography';
import { SEED_CONTENT, normalizeLandingContent } from '../store/landingContentStore';

describe('Kado Circle friends', () => {
  it('seeds Blitzbar, Offgrid, and Anik PH', () => {
    const labels = SEED_CONTENT.kadoCircle.sponsors.map((s) => cmsTextPlain(s.label));
    expect(labels).toEqual(['Blitzbar', 'Offgrid', 'Anik PH']);
    expect(KADO_CIRCLE_SPONSORS.map((s) => cmsTextPlain(s.label))).toEqual([
      'Blitzbar',
      'Offgrid',
      'Anik PH',
    ]);
  });

  it('adopts new friends when hydrate sees legacy partner names', () => {
    const next = normalizeLandingContent({
      kadoCircle: {
        ...SEED_CONTENT.kadoCircle,
        sponsors: [
          { label: 'Anytime Fitness', imageUrl: '' },
          { label: 'foodpanda', imageUrl: '' },
        ],
      },
    });
    const labels = next.kadoCircle.sponsors.map((s) => cmsTextPlain(s.label));
    expect(labels).toEqual(['Blitzbar', 'Offgrid', 'Anik PH']);
  });
});
