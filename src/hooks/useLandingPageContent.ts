import { useSearchParams } from 'react-router-dom';
import {
  useLandingContentStore,
  normalizeLandingContent,
  type LandingContentState,
} from '../store/landingContentStore';
import { readLandingPreviewDraftRaw } from '../lib/landingPreviewSession';

/**
 * Content shown on the public home page.
 * Preview: in-memory draft (same tab) or sessionStorage draft (`?preview=1`).
 */
export function useLandingPageContent(): LandingContentState {
  const published = useLandingContentStore((s) => s.published);
  const draft = useLandingContentStore((s) => s.draft);
  const isPreviewMode = useLandingContentStore((s) => s.isPreviewMode);
  const [searchParams] = useSearchParams();
  const urlPreview = searchParams.get('preview') === '1';

  if (urlPreview) {
    const fromSession = readLandingPreviewDraftRaw();
    if (fromSession) return normalizeLandingContent(fromSession);
  }

  if (isPreviewMode && draft) {
    return draft;
  }

  return published;
}
