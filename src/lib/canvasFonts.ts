import { FONT_BODY, FONT_HEADLINE } from './brandTokens';

let fontsReady: Promise<void> | null = null;

/** Ensure web fonts are loaded before canvas text rendering. */
export function ensureBrandFontsLoaded(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  if (!fontsReady) {
    fontsReady = (async () => {
      const samples = [
        `800 64px ${FONT_HEADLINE}`,
        `700 40px ${FONT_HEADLINE}`,
        `700 28px ${FONT_BODY}`,
        `600 24px ${FONT_BODY}`,
        `500 18px ${FONT_BODY}`,
      ];
      await Promise.all(samples.map((spec) => document.fonts.load(spec).catch(() => undefined)));
      await document.fonts.ready;
    })();
  }
  return fontsReady;
}
