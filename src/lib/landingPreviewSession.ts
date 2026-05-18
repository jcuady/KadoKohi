import type { LandingContentState } from '../store/landingContentStore';

const SESSION_KEY = 'kado-landing-preview-draft';

/** Persists draft for `/?preview=1` in a separate tab (iframe / new window). */
export function writeLandingPreviewDraft(content: LandingContentState): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(content));
  } catch {
    /* sessionStorage full — preview tab may show published only */
  }
}

export function readLandingPreviewDraftRaw(): Partial<LandingContentState> | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<LandingContentState>;
  } catch {
    return null;
  }
}

export function clearLandingPreviewDraft(): void {
  sessionStorage.removeItem(SESSION_KEY);
}
