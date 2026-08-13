import { describe, expect, it } from 'vitest';
import {
  GREENHILLS_MAPS_URL,
  GREENHILLS_PHONE,
  branchDirectionsUrl,
  resolveBranchPhone,
} from './branchMaps';

describe('branchDirectionsUrl', () => {
  it('uses the official Greenhills Maps short link', () => {
    const url = branchDirectionsUrl({
      id: 'branch_greenhills',
      slug: 'greenhills',
      name: 'Kado Kohi — Greenhills Mall',
      address: 'Promenade Greenhills Ortigas Ave, Connecticut',
      city: 'San Juan City, 1503 Metro Manila',
      lat: 14.6,
      lng: 121.05,
    });
    expect(url).toBe(GREENHILLS_MAPS_URL);
  });

  it('prefers a stored mapsUrl when present', () => {
    const url = branchDirectionsUrl({
      slug: 'greenhills',
      name: 'Kado Kohi — Greenhills Mall',
      address: 'Promenade Greenhills',
      city: 'San Juan',
      mapsUrl: 'https://maps.app.goo.gl/uxnZNSRxFmSg84Kz7',
    });
    expect(url).toBe('https://maps.app.goo.gl/uxnZNSRxFmSg84Kz7');
  });

  it('builds directions for Marikina Mt Everest corner', () => {
    const url = branchDirectionsUrl({
      name: 'Kado Kohi — Marikina',
      address: 'Corner Mt Everest',
      city: 'Marikina, 1801 Metro Manila',
    });
    expect(decodeURIComponent(url)).toContain('Corner Mt Everest');
    expect(decodeURIComponent(url)).toContain('Marikina, 1801 Metro Manila');
  });
});

describe('resolveBranchPhone', () => {
  it('returns the Greenhills shop number', () => {
    expect(resolveBranchPhone({ id: 'branch_greenhills', slug: 'greenhills' })).toBe(GREENHILLS_PHONE);
  });

  it('prefers an explicit phone over the Greenhills default', () => {
    expect(resolveBranchPhone({ slug: 'greenhills', phone: '09171234567' })).toBe('09171234567');
  });
});
