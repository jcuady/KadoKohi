function trimEnv(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().replace(/^['"]|['"]$/g, '');
  return trimmed || undefined;
}

export const CLERK_PUBLISHABLE_KEY = trimEnv(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

export const isClerkConfigured = Boolean(
  CLERK_PUBLISHABLE_KEY && !CLERK_PUBLISHABLE_KEY.includes('xxxxxxxx'),
);
