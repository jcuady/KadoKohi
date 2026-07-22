import { describe, expect, it } from 'vitest';
import {
  formatAuthErrorMessage,
  isInvalidRefreshTokenError,
  isNetworkAuthError,
  isRateLimitAuthError,
} from './authSession';

describe('isInvalidRefreshTokenError', () => {
  it('matches refresh-token 400 errors', () => {
    expect(isInvalidRefreshTokenError({ status: 400, message: 'Invalid Refresh Token' })).toBe(true);
    expect(isInvalidRefreshTokenError({ status: 400, message: 'session not found' })).toBe(true);
  });

  it('rejects unrelated errors', () => {
    expect(isInvalidRefreshTokenError({ status: 401, message: 'Invalid Refresh Token' })).toBe(false);
    expect(isInvalidRefreshTokenError(null)).toBe(false);
    expect(isInvalidRefreshTokenError('oops')).toBe(false);
  });
});

describe('isNetworkAuthError', () => {
  it('detects fetch and network failures', () => {
    expect(isNetworkAuthError(new Error('Failed to fetch'))).toBe(true);
    expect(isNetworkAuthError('NetworkError when attempting to fetch resource.')).toBe(true);
  });

  it('rejects credential errors', () => {
    expect(isNetworkAuthError(new Error('Invalid login credentials'))).toBe(false);
  });
});

describe('isRateLimitAuthError', () => {
  it('detects HTTP 429 and rate-limit copy', () => {
    expect(isRateLimitAuthError({ status: 429, message: 'Too many requests' })).toBe(true);
    expect(isRateLimitAuthError({ status: 400, message: 'Email rate limit exceeded' })).toBe(true);
  });
});

describe('formatAuthErrorMessage', () => {
  const fallback = 'Something went wrong.';

  it('maps rate limits to friendly copy', () => {
    expect(formatAuthErrorMessage({ status: 429, message: 'rate limit' }, fallback)).toMatch(
      /wait about a minute/i,
    );
  });

  it('maps network errors', () => {
    expect(formatAuthErrorMessage(new Error('Failed to fetch'), fallback)).toMatch(/cannot reach/i);
  });

  it('maps refresh-token corruption', () => {
    expect(
      formatAuthErrorMessage({ status: 400, message: 'Invalid Refresh Token' }, fallback),
    ).toMatch(/session expired/i);
  });

  it('maps duplicate registration', () => {
    expect(formatAuthErrorMessage(new Error('User already registered'), fallback)).toMatch(
      /already registered/i,
    );
  });

  it('maps weak passwords', () => {
    expect(formatAuthErrorMessage(new Error('Password should be at least 8 characters'), fallback)).toMatch(
      /at least 8 characters/i,
    );
  });

  it('maps invalid email from API', () => {
    expect(formatAuthErrorMessage(new Error('Invalid email format'), fallback)).toMatch(/valid email/i);
  });

  it('maps disabled signups', () => {
    expect(formatAuthErrorMessage(new Error('Signups not allowed for this instance'), fallback)).toMatch(
      /temporarily disabled/i,
    );
  });

  it('maps unconfirmed email', () => {
    expect(formatAuthErrorMessage(new Error('Email not confirmed'), fallback)).toMatch(/confirm your email/i);
  });

  it('maps missing-account reset errors', () => {
    expect(
      formatAuthErrorMessage(new Error('No account found with that email. Check the address.'), fallback),
    ).toMatch(/no account found/i);
  });

  it('uses fallback for invalid credentials', () => {
    const fb = 'Invalid credentials. Please check your email and password.';
    expect(formatAuthErrorMessage(new Error('Invalid login credentials'), fb)).toBe(fb);
  });

  it('maps reauthentication errors to current-password guidance', () => {
    expect(
      formatAuthErrorMessage(new Error('Password update requires reauthentication'), fallback),
    ).toMatch(/current password/i);
  });

  it('maps current password failures', () => {
    expect(formatAuthErrorMessage(new Error('Incorrect current password'), fallback)).toMatch(
      /current password is incorrect/i,
    );
  });

  it('returns raw message when present', () => {
    expect(formatAuthErrorMessage(new Error('Custom server message'), fallback)).toBe('Custom server message');
  });

  it('returns fallback for empty errors', () => {
    expect(formatAuthErrorMessage(null, fallback)).toBe(fallback);
    expect(formatAuthErrorMessage({ message: '   ' }, fallback)).toBe(fallback);
  });
});
