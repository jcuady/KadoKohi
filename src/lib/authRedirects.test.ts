import { describe, expect, it } from 'vitest';
import { forgotPasswordPath, passwordResetRedirectUrl } from './authRedirects';

describe('authRedirects', () => {
  it('builds production recovery redirect', () => {
    expect(passwordResetRedirectUrl()).toBe('https://www.kadokohi.com/auth/reset-password');
  });

  it('builds forgot-password paths with optional email prefill', () => {
    expect(forgotPasswordPath('customer')).toBe('/auth/forgot-password');
    expect(forgotPasswordPath('internal')).toBe('/management-portal/forgot-password');
    expect(forgotPasswordPath('customer', '  Me@KadoKohi.com ')).toBe(
      '/auth/forgot-password?email=me%40kadokohi.com',
    );
  });
});
