import { isPasswordStrong } from './passwordStrength';
import { clampText, isValidEmail, requireNonEmpty, requirePhilippinePhone } from './validation';

export type SignupFields = {
  name: string;
  email: string;
  phoneLocal: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
};

export type SignupFieldKey = keyof SignupFields;

const FIELD_ORDER: SignupFieldKey[] = [
  'name',
  'email',
  'phoneLocal',
  'password',
  'confirmPassword',
  'acceptedTerms',
];

export function signupFieldElementId(key: SignupFieldKey): string {
  if (key === 'phoneLocal') return 'signup-phone';
  if (key === 'confirmPassword') return 'signup-confirm';
  if (key === 'acceptedTerms') return 'signup-terms';
  return `signup-${key}`;
}

export function firstInvalidSignupField(errors: Partial<Record<SignupFieldKey, string>>): SignupFieldKey | null {
  return FIELD_ORDER.find((key) => errors[key]) ?? null;
}

export function validateSignupField(key: SignupFieldKey, values: SignupFields): string | null {
  switch (key) {
    case 'name': {
      const required = requireNonEmpty(values.name, 'Full name');
      if (required) return required;
      if (clampText(values.name, 80).length < 2) return 'Name must be at least 2 characters.';
      return null;
    }
    case 'email': {
      const required = requireNonEmpty(values.email, 'Email');
      if (required) return required;
      if (!isValidEmail(values.email)) return 'Enter a valid email address.';
      return null;
    }
    case 'phoneLocal':
      return requirePhilippinePhone(values.phoneLocal);
    case 'password': {
      const required = requireNonEmpty(values.password, 'Password');
      if (required) return required;
      if (!isPasswordStrong(values.password)) return 'Password must meet all requirements below.';
      return null;
    }
    case 'confirmPassword': {
      const required = requireNonEmpty(values.confirmPassword, 'Confirm password');
      if (required) return required;
      if (values.password !== values.confirmPassword) return 'Passwords do not match.';
      return null;
    }
    case 'acceptedTerms':
      return values.acceptedTerms
        ? null
        : 'Please read and accept the Terms of Service and Privacy Policy to create an account.';
    default:
      return null;
  }
}

export function validateSignupForm(values: SignupFields): Partial<Record<SignupFieldKey, string>> {
  const errors: Partial<Record<SignupFieldKey, string>> = {};
  for (const key of FIELD_ORDER) {
    const err = validateSignupField(key, values);
    if (err) errors[key] = err;
  }
  return errors;
}
