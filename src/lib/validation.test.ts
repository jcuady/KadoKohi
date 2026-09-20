import { describe, expect, it } from 'vitest';
import { formatOrderError } from './validation';

describe('formatOrderError', () => {
  it('maps empty Kuki Box RPC fill errors to flavor-first copy', () => {
    expect(formatOrderError(new Error('Kuki Box kuki_box_10 requires exactly 10 cookies (got 0)'))).toMatch(
      /10 cookie flavors/i,
    );
    expect(formatOrderError(new Error('Kuki Box cookie selection is missing optionId'))).toMatch(
      /tap \+/i,
    );
  });
});
