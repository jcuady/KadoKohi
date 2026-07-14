/** Shown on login after signup when email confirmation is required. */
export const SIGNUP_CHECK_EMAIL_NOTICE =
  'Account created! Please check your email to confirm your account — you\'ll be signed in automatically when you tap the link.';

export const SIGNUP_CHECK_EMAIL_QUERY = 'check-email';
export const SIGNUP_EMAIL_QUERY = 'email';

export const SIGNUP_PASSWORD_HINT =
  'At least 8 characters with uppercase, lowercase, and a number.';

export const SIGNUP_CONFIRM_RESENT_NOTICE = 'We sent another confirmation email. Check your inbox (and spam folder).';

export const SIGNUP_EMAIL_NEXT_STEPS = [
  {
    title: 'Open your inbox',
    body: 'Look for an email from Kado Kohi (notifications@kadokohi.com). Check spam if you do not see it within a few minutes.',
  },
  {
    title: 'Tap Confirm email',
    body: 'That link opens our site and signs you in automatically — no password needed on that screen.',
  },
  {
    title: 'Explore your account',
    body: 'Track orders, earn Kado Circle stamps, and save vouchers from your dashboard.',
  },
] as const;

export const PASSWORD_RESET_SENT_STEPS = [
  'Open the reset email from Kado Kohi (check spam if you do not see it)',
  'Choose a new password on the secure page',
  'Return here and sign in with your new password',
] as const;
