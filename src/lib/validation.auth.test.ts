import { describe, expect, it } from 'vitest';
import { clampText, isValidEmail, requirePhilippinePhone } from './validation';

describe('isValidEmail', () => {
  it('accepts standard addresses', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('  user@kadokohi.com  ')).toBe(true);
  });

  it('rejects malformed or empty addresses', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('   ')).toBe(false);
    expect(isValidEmail('user@domain')).toBe(false);
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
  });

  it('rejects addresses over 254 characters', () => {
    const longLocal = 'a'.repeat(250);
    expect(isValidEmail(`${longLocal}@example.com`)).toBe(false);
  });
});

describe('requirePhilippinePhone', () => {
  it('requires a value', () => {
    expect(requirePhilippinePhone('')).toBe('Phone number is required.');
    expect(requirePhilippinePhone('   ')).toBe('Phone number is required.');
  });

  it('accepts common local formats', () => {
    expect(requirePhilippinePhone('9171234567')).toBeNull();
    expect(requirePhilippinePhone('09171234567')).toBeNull();
    expect(requirePhilippinePhone('+639171234567')).toBeNull();
  });

  it('rejects invalid numbers', () => {
    expect(requirePhilippinePhone('12345')).toMatch(/valid Philippine mobile/i);
    expect(requirePhilippinePhone('8123456789')).toMatch(/valid Philippine mobile/i);
  });
});

describe('clampText (signup name)', () => {
  it('trims and caps length for profile names', () => {
    expect(clampText('  Ana  ', 80)).toBe('Ana');
    expect(clampText('A'.repeat(100), 80).length).toBe(80);
  });
});
