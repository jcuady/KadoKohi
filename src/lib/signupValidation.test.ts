import { describe, expect, it } from 'vitest';
import { validateSignupField, validateSignupForm } from './signupValidation';

const base = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  phoneLocal: '9171234567',
  password: 'TestPass1',
  confirmPassword: 'TestPass1',
  acceptedTerms: true,
};

describe('signupValidation', () => {
  it('accepts valid values', () => {
    expect(validateSignupForm(base)).toEqual({});
  });

  it('rejects short name', () => {
    expect(validateSignupField('name', { ...base, name: 'A' })).toMatch(/at least 2/i);
  });

  it('rejects invalid email', () => {
    expect(validateSignupField('email', { ...base, email: 'bad' })).toMatch(/valid email/i);
  });

  it('rejects invalid phone', () => {
    expect(validateSignupField('phoneLocal', { ...base, phoneLocal: '123' })).toMatch(/Philippine/i);
  });

  it('rejects weak password', () => {
    expect(validateSignupField('password', { ...base, password: 'short' })).toMatch(/requirements/i);
  });

  it('rejects password mismatch', () => {
    expect(
      validateSignupField('confirmPassword', { ...base, confirmPassword: 'OtherPass1' }),
    ).toMatch(/do not match/i);
  });

  it('rejects unchecked terms', () => {
    expect(validateSignupField('acceptedTerms', { ...base, acceptedTerms: false })).toMatch(/accept/i);
  });
});
