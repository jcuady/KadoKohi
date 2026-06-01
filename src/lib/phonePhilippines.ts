/** Normalize user input to E.164 +639XXXXXXXXX (Philippine mobile). */
export function normalizePhilippinePhone(input: string): string {
  let digits = input.replace(/\D/g, '');
  if (digits.startsWith('63')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return '+63' + digits.slice(0, 10);
}

export function isValidPhilippinePhone(input: string): boolean {
  return /^\+639\d{9}$/.test(normalizePhilippinePhone(input));
}

/** Display local part after +63 for the input field (9XX XXX XXXX). */
export function philippinePhoneLocalPart(input: string): string {
  const n = normalizePhilippinePhone(input);
  const local = n.replace(/^\+63/, '');
  return local === '+63' ? '' : local;
}
