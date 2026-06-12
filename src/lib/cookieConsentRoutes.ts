/** Customer-facing routes that show the cookie consent banner (not staff portals). */
export function shouldShowCookieConsent(pathname: string): boolean {
  if (pathname.startsWith('/admin')) return false;
  if (pathname.startsWith('/barista')) return false;
  if (pathname.startsWith('/staff')) return false;
  if (pathname.startsWith('/internal')) return false;
  return true;
}
