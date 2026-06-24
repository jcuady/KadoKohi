import { describe, expect, it } from 'vitest';
import { isPasswordStrong, passwordStrengthScore } from './passwordStrength';

describe('passwordStrength', () => {
  it('scores zero for empty input', () => {
    expect(passwordStrengthScore('')).toBe(0);
    expect(isPasswordStrong('')).toBe(false);
  });

  it('requires length, number, lower, and upper case', () => {
    expect(isPasswordStrong('short1A')).toBe(false);
    expect(isPasswordStrong('longpass1')).toBe(false);
    expect(isPasswordStrong('LONGPASS1')).toBe(false);
    expect(isPasswordStrong('LongPass')).toBe(false);
    expect(isPasswordStrong('LongPass1')).toBe(true);
  });
});
