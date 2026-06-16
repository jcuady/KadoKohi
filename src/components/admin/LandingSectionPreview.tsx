import { useMemo } from 'react';
import type { LandingTabId } from '../../lib/landingCmsTabs';
import HomePageContent from '../home/HomePageContent';
import { LandingCmsEditProvider } from '../../contexts/LandingCmsEditContext';
import { readImageDataUrl } from '../../lib/readImageDataUrl';
import { useLandingDraftContent, useLandingContentStore, type LandingContentState } from '../../store/landingContentStore';

type Props = {
  sectionId: LandingTabId;
  editing?: boolean;
  onUploadError?: (message: string) => void;
};

export default function LandingSectionPreview({ sectionId, editing = false, onUploadError }: Props) {
  const landing = useLandingDraftContent();
  const ctx = useMemo(() => landing, [landing]);

  const onPickImage = async (fieldId: string, file: File) => {
    const res = await readImageDataUrl(file);
    if (res.ok === false) {
      onUploadError?.(res.error);
      return;
    }
    const provider = useLandingContentStore.getState();
    const draft = provider.draft ?? provider.published;
    applyImageField(fieldId, res.dataUrl, draft, provider);
  };

  return (
    <LandingCmsEditProvider editing={editing} onPickImage={onPickImage}>
      <div
        className={[
          'relative overflow-hidden rounded-xl border dash-border bg-kado-cream',
          editing ? 'ring-2 ring-amber-400/50' : '',
        ].join(' ')}
      >
        {editing ? (
          <div className="border-b border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-900">
            Click text or images in the preview to edit inline
          </div>
        ) : null}
        <div className="max-h-[min(52vh,640px)] overflow-y-auto overflow-x-hidden scroll-smooth [transform-origin:top_center]">
          <HomePageContent landing={ctx} sectionOnly={sectionId} cmsEditMode={editing} />
        </div>
      </div>
    </LandingCmsEditProvider>
  );
}

function applyImageField(
  fieldId: string,
  url: string,
  draft: LandingContentState,
  store: ReturnType<typeof useLandingContentStore.getState>,
) {
  const parts = fieldId.split('.');
  const [section, ...rest] = parts;
  if (section === 'hero') {
    if (rest[0] === 'slide' && rest[2] === 'image') {
      const si = Number(rest[1]);
      if (Number.isFinite(si)) store.updateHeroSlide(si, { image: url });
      return;
    }
    if (rest[0] === 'card' && rest[3] === 'src') {
      const si = Number(rest[1]);
      const ci = Number(rest[2]);
      if (Number.isFinite(si) && Number.isFinite(ci)) store.updateHeroCard(si, ci, { src: url });
      return;
    }
  }
  if (section === 'story' && rest[0] === 'pillar' && rest[2] === 'image') {
    const pi = Number(rest[1]);
    if (Number.isFinite(pi)) store.updateStorySeoPillar(pi, { imageUrl: url });
    return;
  }
  if (section === 'menu-seo' && rest[0] === 'pillar' && rest[2] === 'image') {
    const pi = Number(rest[1]);
    if (Number.isFinite(pi)) store.updateMenuSeoPillar(pi, { imageUrl: url });
    return;
  }
  if (section === 'schedule' && rest[0] === 'poster') {
    store.updateSchedule({ posterImageUrl: url });
    return;
  }
  if (section === 'events' && rest[0] === 'cover') {
    store.updateEvents({ coverImageOverride: url });
    return;
  }
  if (section === 'featured' && rest[0] === 'card' && rest[2] === 'image') {
    const slot = Number(rest[1]);
    if (Number.isFinite(slot)) {
      const next = [...draft.featured.cardImageOverrides] as [string, string, string];
      next[slot] = url;
      store.updateFeatured({ cardImageOverrides: next });
    }
  }
}
