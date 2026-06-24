import { describe, expect, it } from 'vitest';
import { buildAuthEmailLink } from './authEmailLinks';

describe('buildAuthEmailLink', () => {
  it('builds cross-device confirm links with token_hash', () => {
    expect(
      buildAuthEmailLink({
        redirectTo: 'https://www.kadokohi.com/auth/confirm',
        tokenHash: 'abc123',
        type: 'signup',
      }),
    ).toBe('https://www.kadokohi.com/auth/confirm?token_hash=abc123&type=signup');
  });

  it('builds recovery links for password reset', () => {
    expect(
      buildAuthEmailLink({
        redirectTo: 'https://www.kadokohi.com/auth/reset-password',
        tokenHash: 'xyz',
        type: 'recovery',
      }),
    ).toBe('https://www.kadokohi.com/auth/reset-password?token_hash=xyz&type=recovery');
  });
});
