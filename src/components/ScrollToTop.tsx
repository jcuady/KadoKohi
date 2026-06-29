import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Resets the window and any `[data-scroll-top]` containers to the top.
 * Exported for a node-friendly unit check (no jsdom needed).
 */
export function resetScrollTops(
  win: Pick<Window, 'scrollTo'>,
  scrollEls: Iterable<{ scrollTop: number }>,
) {
  win.scrollTo(0, 0);
  for (const el of scrollEls) el.scrollTop = 0;
}

/**
 * Scrolls to the top on every route (pathname) change so a new page/tab always
 * starts at the top — for both window-scrolled layouts (public, account) and
 * dashboard layouts whose content scrolls inside a `[data-scroll-top]` element.
 *
 * ponytail: keyed on pathname only, so in-page tab/filter changes driven by query
 * params (e.g. /admin/menu?tab=pastries) intentionally keep their scroll position.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    resetScrollTops(window, document.querySelectorAll<HTMLElement>('[data-scroll-top]'));
  }, [pathname]);

  return null;
}
