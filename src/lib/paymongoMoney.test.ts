import { describe, expect, it } from 'vitest';
import { phpToCentavos } from './paymongoMoney';

describe('phpToCentavos', () => {
  it('converts pesos to centavos', () => {
    expect(phpToCentavos(100)).toBe(10000);
    expect(phpToCentavos(150.5)).toBe(15050);
    expect(phpToCentavos(99.99)).toBe(9999);
  });

  it('guards invalid amounts', () => {
    expect(phpToCentavos(-1)).toBe(0);
    expect(phpToCentavos(Number.NaN)).toBe(0);
  });
});
