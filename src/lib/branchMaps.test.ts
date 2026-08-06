import { describe, expect, it } from 'vitest';
import { branchDirectionsUrl } from './branchMaps';

describe('branchDirectionsUrl', () => {
  it('builds Google Maps directions to the street address', () => {
    const url = branchDirectionsUrl({
      name: 'Kado Kohi — Greenhills Mall',
      address: 'Promenade Greenhills Ortigas Ave, Connecticut',
      city: 'San Juan City, 1503 Metro Manila',
      lat: 14.6,
      lng: 121.05,
    });
    expect(url).toContain('https://www.google.com/maps/dir/?api=1&destination=');
    expect(decodeURIComponent(url)).toContain('Promenade Greenhills Ortigas Ave, Connecticut');
    expect(decodeURIComponent(url)).toContain('San Juan City, 1503 Metro Manila');
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
