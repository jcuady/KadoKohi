function trimEnv(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().replace(/^['"]|['"]$/g, '');
  return trimmed || undefined;
}

/** Origins Clerk may redirect back to (local dev, production site, current host). */
export function clerkAllowedRedirectOrigins(): string[] {
  const origins = new Set<string>([
    'http://127.0.0.1:5174',
    'http://localhost:5174',
    'https://www.kadokohi.com',
    'https://kadokohi.com',
  ]);
  const siteUrl = trimEnv(import.meta.env.VITE_SITE_URL);
  if (siteUrl) {
    try {
      origins.add(new URL(siteUrl).origin);
    } catch {
      // ignore invalid VITE_SITE_URL
    }
  }
  if (typeof window !== 'undefined') {
    origins.add(window.location.origin);
  }
  return [...origins];
}
