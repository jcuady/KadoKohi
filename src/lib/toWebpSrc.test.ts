import { describe, expect, it } from 'vitest';
import { toWebpSrc } from './toWebpSrc';

describe('toWebpSrc', () => {
  it('maps local raster paths to webp', () => {
    expect(toWebpSrc('/social/cafe-latte.png')).toBe('/social/cafe-latte.webp');
    expect(toWebpSrc('/featuredmarikina/kadom1.jpg')).toBe('/featuredmarikina/kadom1.webp');
  });

  it('leaves remote and data URLs alone', () => {
    expect(toWebpSrc('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png');
    expect(toWebpSrc('data:image/png;base64,xx')).toBe('data:image/png;base64,xx');
  });
});
