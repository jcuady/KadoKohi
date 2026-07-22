import { describe, expect, it } from 'vitest';
import { guestOrderMainPadding } from './guestOrderLayout';

describe('guestOrderMainPadding', () => {
  it('gives empty cart a short safe-area pad', () => {
    const pad = guestOrderMainPadding(false, false);
    expect(pad).toContain('pb-[max(5rem');
  });

  it('pads collapsed cart for name field footer', () => {
    const pad = guestOrderMainPadding(false, true);
    expect(pad).toContain('pb-[max(9.5rem');
  });

  it('pads expanded cart taller for checkout sheet', () => {
    const pad = guestOrderMainPadding(true, true);
    expect(pad).toContain('pb-[min(58dvh,460px)]');
  });
});
