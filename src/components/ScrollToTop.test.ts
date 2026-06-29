import { describe, expect, it, vi } from 'vitest';
import { resetScrollTops } from './ScrollToTop';

describe('resetScrollTops', () => {
  it('scrolls the window to top and resets every scroll container', () => {
    const scrollTo = vi.fn();
    const els = [{ scrollTop: 400 }, { scrollTop: 120 }];

    resetScrollTops({ scrollTo } as unknown as Window, els);

    expect(scrollTo).toHaveBeenCalledWith(0, 0);
    expect(els.map((el) => el.scrollTop)).toEqual([0, 0]);
  });
});
