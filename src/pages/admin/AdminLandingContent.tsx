import { useEffect, useMemo, useState } from 'react';
import { Upload, ExternalLink } from 'lucide-react';
import {
  useLandingContentStore,
  useLandingDraftContent,
  type AccentHeadlineCopy,
} from '../../store/landingContentStore';
import { uploadCmsImageFile } from '../../lib/cmsImageUpload';
import LandingEditorToolbar from '../../components/admin/LandingEditorToolbar';
import LandingCmsSectionCard from '../../components/admin/LandingCmsSectionCard';
import CmsReorderList from '../../components/admin/CmsReorderList';
import { useMenuStore } from '../../store/menuStore';
import { listVisibleCoffeeProducts } from '../../lib/menuCatalog';
import { discountedBasePrice } from '../../lib/productPricing';
import { LANDING_CMS_TABS, type LandingTabId } from '../../lib/landingCmsTabs';
import CmsTextField from '../../components/admin/CmsTextField';
import type { CmsText } from '../../lib/cmsTypography';
import { writeLandingPreviewDraft } from '../../lib/landingPreviewSession';

const HERO_SLIDE_LABELS = ['Slide 1 — Matcha', 'Slide 2 — Coffee culture', 'Slide 3 — Campaign'];
const HERO_CARD_SLOTS = 4;
const TRUSTED_BRAND_SLOTS = 5;
const SPONSOR_SLOTS = 8;

function cmsTab(id: LandingTabId) {
  const tab = LANDING_CMS_TABS.find((item) => item.id === id);
  if (!tab) throw new Error(`Unknown landing CMS tab: ${id}`);
  return tab;
}

export default function AdminLandingContent() {
  const content = useLandingDraftContent();
  const initDraft = useLandingContentStore((s) => s.initDraft);
  const hydrateFromRemote = useLandingContentStore((s) => s.hydrateFromRemote);
  const updateHeroSlide = useLandingContentStore((s) => s.updateHeroSlide);
  const updateHeroCard = useLandingContentStore((s) => s.updateHeroCard);
  const updateHeroChrome = useLandingContentStore((s) => s.updateHeroChrome);
  const updateStorySeo = useLandingContentStore((s) => s.updateStorySeo);
  const updateStorySeoPillar = useLandingContentStore((s) => s.updateStorySeoPillar);
  const updateMenuSeo = useLandingContentStore((s) => s.updateMenuSeo);
  const updateMenuSeoPillar = useLandingContentStore((s) => s.updateMenuSeoPillar);
  const updateFeatured = useLandingContentStore((s) => s.updateFeatured);
  const updateEvents = useLandingContentStore((s) => s.updateEvents);
  const updateTestimonials = useLandingContentStore((s) => s.updateTestimonials);
  const updateTestimonialItem = useLandingContentStore((s) => s.updateTestimonialItem);
  const updateTrustedBrand = useLandingContentStore((s) => s.updateTrustedBrand);
  const updateOrdering = useLandingContentStore((s) => s.updateOrdering);
  const updateOrderingStep = useLandingContentStore((s) => s.updateOrderingStep);
  const reorderOrderingSteps = useLandingContentStore((s) => s.reorderOrderingSteps);
  const updateKadoCircleSponsor = useLandingContentStore((s) => s.updateKadoCircleSponsor);
  const updateBranchesStrip = useLandingContentStore((s) => s.updateBranchesStrip);
  const updateAboutPage = useLandingContentStore((s) => s.updateAboutPage);
  const updateKadoCircle = useLandingContentStore((s) => s.updateKadoCircle);
  const updateFaq = useLandingContentStore((s) => s.updateFaq);
  const updateFaqItem = useLandingContentStore((s) => s.updateFaqItem);
  const categories = useMenuStore((s) => s.categories);
  const allProducts = useMenuStore((s) => s.products);
  const menuDataSource = useMenuStore((s) => s.dataSource);
  const products = useMemo(() => {
    if (menuDataSource !== 'remote') return [];
    return listVisibleCoffeeProducts(allProducts, categories);
  }, [allProducts, categories, menuDataSource]);

  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void hydrateFromRemote().finally(() => {
      if (!cancelled) initDraft();
    });
    return () => {
      cancelled = true;
    };
  }, [hydrateFromRemote, initDraft]);

  const openFullPreview = () => {
    const { draft, published } = useLandingContentStore.getState();
    writeLandingPreviewDraft(draft ?? published);
  };

  const onPickImage = async (
    prefix: string,
    onDone: (url: string) => void,
    fileList: FileList | null,
  ) => {
    const file = fileList?.[0];
    if (!file) return;
    setUploadError(null);
    try {
      const url = await uploadCmsImageFile(file, prefix);
      onDone(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Could not upload image.');
    }
  };

  return (
    <div className="dash-page max-w-6xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading">Homepage content</h1>
        <p className="dash-muted text-sm mt-1">
          Each section shows a live preview first. Click Edit to change text and images inline or in the panel below.
          Layout order is fixed. Product, event, and branch data still come from their admin pages.
        </p>
        {uploadError ? <p className="mt-2 text-sm text-red-600 font-medium">{uploadError}</p> : null}
      </div>

      <LandingEditorToolbar onOpenFullPreview={openFullPreview} />

      <nav
        aria-label="Jump to section"
        className="mt-4 flex flex-wrap gap-2 rounded-2xl border dash-border dash-card p-3"
      >
        {LANDING_CMS_TABS.map((tab) => (
          <a
            key={tab.id}
            href={`#cms-section-${tab.id}`}
            className="rounded-lg border dash-border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider dash-muted hover:border-kado-red/40 hover:text-kado-red"
          >
            {tab.label}
          </a>
        ))}
        <a
          href="/?preview=1"
          target="_blank"
          rel="noopener noreferrer"
          onClick={openFullPreview}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-kado-red hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Full page
        </a>
      </nav>

      <div className="mt-6 space-y-6">
        <LandingCmsSectionCard tab={cmsTab('hero')} onUploadError={setUploadError}>
          <div className="space-y-6">
        <section className="rounded-2xl dash-card border p-5 md:p-6">
          <h2 className="font-display font-bold text-xl dash-heading mb-4">Hero — Labels & CTAs</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <CmsField
              label="Main headline (H1)"
              value={content.heroChrome.mainHeadline}
              onChange={(v) => updateHeroChrome({ mainHeadline: v })}
            />
            <CmsField
              label="Location badge"
              value={content.heroChrome.locationBadge}
              onChange={(v) => updateHeroChrome({ locationBadge: v })}
            />
            <CmsField
              label="Image credit line"
              value={content.heroChrome.imageCredit}
              onChange={(v) => updateHeroChrome({ imageCredit: v })}
            />
            <CmsField
              label="Primary CTA label"
              value={content.heroChrome.primaryCtaLabel}
              onChange={(v) => updateHeroChrome({ primaryCtaLabel: v })}
            />
            <PlainField
              label="Primary CTA path"
              value={content.heroChrome.primaryCtaPath}
              onChange={(v) => updateHeroChrome({ primaryCtaPath: v })}
            />
            <CmsField
              label="Secondary CTA label"
              value={content.heroChrome.secondaryCtaLabel}
              onChange={(v) => updateHeroChrome({ secondaryCtaLabel: v })}
            />
            <PlainField
              label="Secondary CTA path"
              value={content.heroChrome.secondaryCtaPath}
              onChange={(v) => updateHeroChrome({ secondaryCtaPath: v })}
            />
          </div>
        </section>

        <section className="rounded-2xl dash-card border p-5 md:p-6">
          <h2 className="font-display font-bold text-xl dash-heading mb-4">Hero slides & card images</h2>
          <p className="text-xs dash-muted mb-4">
            Three slides and four cards per slide on desktop — count cannot change.
          </p>
          <div className="space-y-6">
            {content.heroSlides.map((slide, index) => (
              <article key={slide.id} className="rounded-xl border dash-border p-4 space-y-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] dash-muted">
                  {HERO_SLIDE_LABELS[index] ?? `Slide ${index + 1}`}
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  <CmsField
                    label="Title"
                    value={slide.title}
                    onChange={(v) => updateHeroSlide(index, { title: v })}
                  />
                  <CmsField
                    label="Subtitle"
                    value={slide.subtitle}
                    onChange={(v) => updateHeroSlide(index, { subtitle: v })}
                  />
                  <ImageUrlField
                    label="Background image"
                    value={slide.image}
                    onChange={(v) => updateHeroSlide(index, { image: v })}
                    onPickFile={(files) =>
                      onPickImage(`landing/hero/slides/${index}`, (url) => updateHeroSlide(index, { image: url }), files)
                    }
                  />
                  <PlainField
                    label="Background alt text"
                    value={slide.imageAlt}
                    onChange={(v) => updateHeroSlide(index, { imageAlt: v })}
                  />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider dash-muted mb-2">Hero cards</p>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {slide.cards.slice(0, HERO_CARD_SLOTS).map((card, ci) => (
                      <div
                        key={card.id}
                       
                        className="rounded-lg border dash-border p-3 space-y-2"
                      >
                        <p className="text-[10px] font-bold uppercase dash-muted">Card {ci + 1}</p>
                        <CmsField
                          label="Title"
                          value={card.title}
                          onChange={(v) => updateHeroCard(index, ci, { title: v })}
                        />
                        <CmsField label="Tag" value={card.tag} onChange={(v) => updateHeroCard(index, ci, { tag: v })} />
                        <PlainField label="Alt" value={card.alt} onChange={(v) => updateHeroCard(index, ci, { alt: v })} />
                        <ImageUrlField
                          label="Image"
                          value={card.src}
                          onChange={(v) => updateHeroCard(index, ci, { src: v })}
                          onPickFile={(files) =>
                            onPickImage(
                              `landing/hero/cards/${index}-${ci}`,
                              (url) => updateHeroCard(index, ci, { src: url }),
                              files,
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
          </div>
        </LandingCmsSectionCard>

        <LandingCmsSectionCard tab={cmsTab('story')} onUploadError={setUploadError}>
          <div className="space-y-6">
        <section className="rounded-2xl dash-card border p-5 md:p-6">
          <h2 className="font-display font-bold text-xl dash-heading mb-2">Brand story (SEO intro)</h2>
          <p className="text-xs dash-muted mb-4">
            Headline, intro copy, and three image pillars below the hero. Drink links in the next section still come from
            the SEO menu list.
          </p>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <CmsField label="Badge" value={content.storySeo.badge} onChange={(v) => updateStorySeo({ badge: v })} />
            <CmsField
              label="CTA label"
              value={content.storySeo.ctaLabel}
              onChange={(v) => updateStorySeo({ ctaLabel: v })}
            />
          </div>
          <HeadlineFields
            label="Headline"
            value={content.storySeo.headline}
            onChange={(headline) => updateStorySeo({ headline })}
          />
          <div className="mt-4">
            <CmsField
              label="Intro paragraph"
              value={content.storySeo.intro}
              onChange={(v) => updateStorySeo({ intro: v })}
              multiline
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <CmsField
              label="Footer tagline (line 1)"
              value={content.storySeo.footerTagline1}
              onChange={(v) => updateStorySeo({ footerTagline1: v })}
            />
            <CmsField
              label="Footer tagline (line 2)"
              value={content.storySeo.footerTagline2}
              onChange={(v) => updateStorySeo({ footerTagline2: v })}
            />
            <CmsField
              label="Social heading"
              value={content.storySeo.socialHeading}
              onChange={(v) => updateStorySeo({ socialHeading: v })}
            />
          </div>
          <p className="text-xs font-bold uppercase dash-muted mt-6 mb-3">Story pillars (3 fixed)</p>
          <div className="space-y-4">
            {content.storySeo.pillars.map((pillar, pi) => (
              <article key={`story-pillar-${pi}`} className="rounded-xl border dash-border p-4 space-y-3">
                <p className="text-xs font-bold dash-muted">Pillar {pi + 1}</p>
                <div className="grid md:grid-cols-2 gap-3">
                  <CmsField
                    label="Title"
                    value={pillar.title}
                    onChange={(v) => updateStorySeoPillar(pi, { title: v })}
                  />
                  <CmsField
                    label="Subtitle"
                    value={pillar.subtitle}
                    onChange={(v) => updateStorySeoPillar(pi, { subtitle: v })}
                  />
                </div>
                <CmsField
                  label="Body"
                  value={pillar.body ?? ''}
                  onChange={(v) => updateStorySeoPillar(pi, { body: v })}
                  multiline
                />
                <ImageUrlField
                  label="Image"
                  value={pillar.imageUrl}
                  onChange={(v) => updateStorySeoPillar(pi, { imageUrl: v })}
                  onPickFile={(files) =>
                    onPickImage(`landing/story/pillars/${pi}`, (url) => updateStorySeoPillar(pi, { imageUrl: url }), files)
                  }
                />
                <PlainField
                  label="Image alt text"
                  value={pillar.imageAlt}
                  onChange={(v) => updateStorySeoPillar(pi, { imageAlt: v })}
                />
              </article>
            ))}
          </div>
        </section>
          </div>
        </LandingCmsSectionCard>

        <LandingCmsSectionCard tab={cmsTab('menu-seo')} onUploadError={setUploadError}>
          <div className="space-y-6">
        <section className="rounded-2xl dash-card border p-5 md:p-6">
          <h2 className="font-display font-bold text-xl dash-heading mb-2">Menu SEO pillars</h2>
          <p className="text-xs dash-muted mb-4">
            Matcha / signatures / classics / sodas & yuzu pillar cards and visible SEO body copy. Google review count stays live from
            Maps.
          </p>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <CmsField
              label="Location badge"
              value={content.menuSeo.locationBadge}
              onChange={(v) => updateMenuSeo({ locationBadge: v })}
            />
            <CmsField
              label="Location chip"
              value={content.menuSeo.locationChipLabel}
              onChange={(v) => updateMenuSeo({ locationChipLabel: v })}
            />
            <CmsField
              label="Explore nav heading"
              value={content.menuSeo.exploreHeading}
              onChange={(v) => updateMenuSeo({ exploreHeading: v })}
            />
          </div>
          <HeadlineFields
            label="Headline"
            value={content.menuSeo.headline}
            onChange={(headline) => updateMenuSeo({ headline })}
          />
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            {([0, 1] as const).map((i) => (
              <div key={`menu-body-${i}`}>
                <CmsField
                  label={`Body paragraph ${i + 1}`}
                  value={content.menuSeo.bodyParagraphs[i]}
                  onChange={(v) => {
                    const next: [typeof v, typeof v] = [...content.menuSeo.bodyParagraphs] as [typeof v, typeof v];
                    next[i] = v;
                    updateMenuSeo({ bodyParagraphs: next });
                  }}
                  multiline
                />
              </div>
            ))}
          </div>
          <p className="text-xs font-bold uppercase dash-muted mt-6 mb-3">Menu pillars (3 fixed)</p>
          <div className="space-y-4">
            {content.menuSeo.pillars.map((pillar, pi) => (
              <article key={`menu-pillar-${pi}`} className="rounded-xl border dash-border p-4 space-y-3">
                <p className="text-xs font-bold dash-muted">Pillar {pi + 1}</p>
                <div className="grid md:grid-cols-2 gap-3">
                  <CmsField
                    label="Title"
                    value={pillar.title}
                    onChange={(v) => updateMenuSeoPillar(pi, { title: v })}
                  />
                  <CmsField
                    label="Subtitle"
                    value={pillar.subtitle}
                    onChange={(v) => updateMenuSeoPillar(pi, { subtitle: v })}
                  />
                </div>
                <ImageUrlField
                  label="Image"
                  value={pillar.imageUrl}
                  onChange={(v) => updateMenuSeoPillar(pi, { imageUrl: v })}
                  onPickFile={(files) =>
                    onPickImage(`landing/menu-seo/pillars/${pi}`, (url) => updateMenuSeoPillar(pi, { imageUrl: url }), files)
                  }
                />
                <PlainField
                  label="Image alt text"
                  value={pillar.imageAlt}
                  onChange={(v) => updateMenuSeoPillar(pi, { imageAlt: v })}
                />
              </article>
            ))}
          </div>
        </section>
          </div>
        </LandingCmsSectionCard>

        <LandingCmsSectionCard tab={cmsTab('featured')} onUploadError={setUploadError}>
          <div className="space-y-6">
        <section className="rounded-2xl dash-card border p-5 md:p-6">
          <h2 className="font-display font-bold text-xl dash-heading mb-4">Featured section</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <CmsField label="Badge" value={content.featured.badge} onChange={(v) => updateFeatured({ badge: v })} />
            <CmsField label="Title" value={content.featured.title} onChange={(v) => updateFeatured({ title: v })} />
            <CmsField
              label="Desktop subtitle"
              value={content.featured.subtitleDesktop}
              onChange={(v) => updateFeatured({ subtitleDesktop: v })}
            />
            <CmsField
              label="Mobile subtitle"
              value={content.featured.subtitleMobile}
              onChange={(v) => updateFeatured({ subtitleMobile: v })}
            />
            <CmsField
              label="Menu CTA label"
              value={content.featured.menuCtaLabel}
              onChange={(v) => updateFeatured({ menuCtaLabel: v })}
            />
            <CmsField
              label="Shop CTA label"
              value={content.featured.shopCtaLabel}
              onChange={(v) => updateFeatured({ shopCtaLabel: v })}
            />
            <PlainField
              label="Shop CTA path"
              value={content.featured.shopCtaPath}
              onChange={(v) => updateFeatured({ shopCtaPath: v })}
            />
          </div>
          <p className="text-xs dash-muted mt-4 mb-2">
            Pick three coffee products to showcase. These are pulled live from Menu products.
          </p>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            {([0, 1, 2] as const).map((slot) => (
              <div key={`product-${slot}`}>
                <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">
                  Card {slot + 1} product
                </label>
                <select
                  value={content.featured.productIds[slot] ?? ''}
                  onChange={(e) => {
                    const next: [string, string, string] = [...content.featured.productIds] as [
                      string,
                      string,
                      string,
                    ];
                    next[slot] = e.target.value;
                    updateFeatured({ productIds: next });
                  }}
                  className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm"
                >
                  <option value="">Auto-select best available</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - ₱{discountedBasePrice(p)}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <p className="text-xs font-bold uppercase dash-muted mt-6 mb-3">Card image overrides (optional)</p>
          <p className="text-xs dash-muted mb-3">
            Leave blank to use each product&apos;s menu image. Upload or paste a URL to override a featured card photo
            without changing the menu product.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {([0, 1, 2] as const).map((slot) => (
              <div key={`featured-img-${slot}`}>
              <ImageUrlField
                label={`Card ${slot + 1} image override`}
                value={content.featured.cardImageOverrides[slot] ?? ''}
                onChange={(v) => {
                  const next: [string, string, string] = [...content.featured.cardImageOverrides] as [
                    string,
                    string,
                    string,
                  ];
                  next[slot] = v;
                  updateFeatured({ cardImageOverrides: next });
                }}
                onPickFile={(files) =>
                  onPickImage(`landing/featured/cards/${slot}`, (url) => {
                    const next: [string, string, string] = [...content.featured.cardImageOverrides] as [
                      string,
                      string,
                      string,
                    ];
                    next[slot] = url;
                    updateFeatured({ cardImageOverrides: next });
                  }, files)
                }
              />
              </div>
            ))}
          </div>
        </section>
          </div>
        </LandingCmsSectionCard>

        <LandingCmsSectionCard tab={cmsTab('ordering')} onUploadError={setUploadError}>
          <div className="space-y-6">
        <section className="rounded-2xl dash-card border p-5 md:p-6">
          <h2 className="font-display font-bold text-xl dash-heading mb-4">How to order</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <CmsField label="Badge" value={content.ordering.badge} onChange={(v) => updateOrdering({ badge: v })} />
            <CmsField label="Title" value={content.ordering.title} onChange={(v) => updateOrdering({ title: v })} />
            <CmsField
              label="Desktop subtitle"
              value={content.ordering.subtitleDesktop}
              onChange={(v) => updateOrdering({ subtitleDesktop: v })}
            />
            <CmsField
              label="Mobile subtitle"
              value={content.ordering.subtitleMobile}
              onChange={(v) => updateOrdering({ subtitleMobile: v })}
            />
          </div>
          <p className="text-xs font-bold uppercase dash-muted mt-6 mb-3">Carousel steps (4 fixed) — drag to reorder</p>
          <CmsReorderList
            items={content.ordering.steps}
            onReorder={reorderOrderingSteps}
            keyFn={(step) => step.id}
            renderItem={(step, si) => (
              <div className="space-y-3">
                <p className="text-xs font-bold dash-muted">Step {si + 1}</p>
                <div className="grid md:grid-cols-2 gap-3">
                  <CmsField
                    label="Eyebrow"
                    value={step.eyebrow}
                    onChange={(v) => updateOrderingStep(si, { eyebrow: v })}
                  />
                  <CmsField label="Title" value={step.title} onChange={(v) => updateOrderingStep(si, { title: v })} />
                </div>
                <CmsField
                  label="Description"
                  value={step.description}
                  onChange={(v) => updateOrderingStep(si, { description: v })}
                  multiline
                />
              </div>
            )}
          />
        </section>
          </div>
        </LandingCmsSectionCard>

        <LandingCmsSectionCard tab={cmsTab('events')} onUploadError={setUploadError}>
          <div className="space-y-6">
        <section className="rounded-2xl dash-card border p-5 md:p-6">
          <h2 className="font-display font-bold text-xl dash-heading mb-4">Kado Events block</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <CmsField label="Badge" value={content.events.badge} onChange={(v) => updateEvents({ badge: v })} />
            <CmsField label="Title" value={content.events.title} onChange={(v) => updateEvents({ title: v })} />
            <CmsField label="Subtitle" value={content.events.subtitle} onChange={(v) => updateEvents({ subtitle: v })} />
            <ImageUrlField
              label="Cover image override (optional)"
              value={content.events.coverImageOverride}
              onChange={(v) => updateEvents({ coverImageOverride: v })}
              onPickFile={(files) => onPickImage('landing/events/cover', (url) => updateEvents({ coverImageOverride: url }), files)}
            />
            <CmsField
              label="No-event message"
              value={content.events.noEventBody}
              onChange={(v) => updateEvents({ noEventBody: v })}
            />
            <CmsField
              label="No-event link label"
              value={content.events.noEventBrowseLabel}
              onChange={(v) => updateEvents({ noEventBrowseLabel: v })}
            />
          </div>
        </section>
          </div>
        </LandingCmsSectionCard>

        <LandingCmsSectionCard tab={cmsTab('branches')} onUploadError={setUploadError}>
          <div className="space-y-6">
        <section className="rounded-2xl dash-card border p-5 md:p-6">
          <h2 className="font-display font-bold text-xl dash-heading mb-4">Branches strip</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <CmsField
              label="Badge"
              value={content.branchesStrip.badge}
              onChange={(v) => updateBranchesStrip({ badge: v })}
            />
            <CmsField
              label="Title"
              value={content.branchesStrip.title}
              onChange={(v) => updateBranchesStrip({ title: v })}
            />
            <CmsField
              label="CTA label"
              value={content.branchesStrip.ctaLabel}
              onChange={(v) => updateBranchesStrip({ ctaLabel: v })}
            />
          </div>
        </section>
          </div>
        </LandingCmsSectionCard>

        <LandingCmsSectionCard tab={cmsTab('about')} onUploadError={setUploadError}>
          <div className="space-y-6">
            <section className="rounded-2xl dash-card border p-5 md:p-6">
              <h2 className="font-display font-bold text-xl dash-heading mb-2">About page hero</h2>
              <p className="text-xs dash-muted mb-4">
                Live on <code className="text-[10px]">/about</code>. Headline accents render in brand red.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <CmsField
                  label="Eyebrow"
                  value={content.aboutPage.eyebrow}
                  onChange={(v) => updateAboutPage({ eyebrow: v })}
                />
                <CmsField
                  label="Soft opening chip"
                  value={content.aboutPage.softOpeningLabel}
                  onChange={(v) => updateAboutPage({ softOpeningLabel: v })}
                />
                <CmsField
                  label="Soft opening date"
                  value={content.aboutPage.softOpeningDate}
                  onChange={(v) => updateAboutPage({ softOpeningDate: v })}
                />
                <CmsField
                  label="Location note"
                  value={content.aboutPage.locationNote}
                  onChange={(v) => updateAboutPage({ locationNote: v })}
                />
                <CmsField
                  label="Headline line 1"
                  value={content.aboutPage.line1Before}
                  onChange={(v) => updateAboutPage({ line1Before: v })}
                />
                <CmsField
                  label="Line 1 accent (red)"
                  value={content.aboutPage.line1Accent}
                  onChange={(v) => updateAboutPage({ line1Accent: v })}
                />
                <CmsField
                  label="Headline line 2"
                  value={content.aboutPage.line2Before}
                  onChange={(v) => updateAboutPage({ line2Before: v })}
                />
                <CmsField
                  label="Line 2 accent (red)"
                  value={content.aboutPage.line2Accent}
                  onChange={(v) => updateAboutPage({ line2Accent: v })}
                />
              </div>
              <CmsField
                label="Tagline"
                value={content.aboutPage.tagline}
                onChange={(v) => updateAboutPage({ tagline: v })}
                multiline
              />
              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <ImageUrlField
                  label="Hero photo URL"
                  value={content.aboutPage.heroImageSrc}
                  onChange={(v) => updateAboutPage({ heroImageSrc: v })}
                  onPickFile={(files) =>
                    onPickImage(`landing/about/hero`, (url) => updateAboutPage({ heroImageSrc: url }), files)
                  }
                />
                <CmsField
                  label="Hero image alt"
                  value={content.aboutPage.heroImageAlt}
                  onChange={(v) => updateAboutPage({ heroImageAlt: v })}
                />
              </div>
            </section>

            <section className="rounded-2xl dash-card border p-5 md:p-6">
              <h2 className="font-display font-bold text-xl dash-heading mb-2">About — Origins</h2>
              <p className="text-xs dash-muted mb-4">
                Second section on <code className="text-[10px]">/about</code> (story + photo). Headline lines stay on the brand editorial set.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <CmsField
                  label="Eyebrow"
                  value={content.aboutPage.originsEyebrow}
                  onChange={(v) => updateAboutPage({ originsEyebrow: v })}
                />
                <CmsField
                  label="Image alt"
                  value={content.aboutPage.originsImageAlt}
                  onChange={(v) => updateAboutPage({ originsImageAlt: v })}
                />
              </div>
              <CmsField
                label="Lead"
                value={content.aboutPage.originsLead}
                onChange={(v) => updateAboutPage({ originsLead: v })}
                multiline
              />
              <CmsField
                label="Paragraph 1"
                value={content.aboutPage.originsParagraph1}
                onChange={(v) => updateAboutPage({ originsParagraph1: v })}
                multiline
              />
              <CmsField
                label="Paragraph 2"
                value={content.aboutPage.originsParagraph2}
                onChange={(v) => updateAboutPage({ originsParagraph2: v })}
                multiline
              />
              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <ImageUrlField
                  label="Origins photo URL"
                  value={content.aboutPage.originsImageSrc}
                  onChange={(v) => updateAboutPage({ originsImageSrc: v })}
                  onPickFile={(files) =>
                    onPickImage(`landing/about/origins`, (url) => updateAboutPage({ originsImageSrc: url }), files)
                  }
                />
                <ImageUrlField
                  label="Fallback photo URL"
                  value={content.aboutPage.originsImageFallback}
                  onChange={(v) => updateAboutPage({ originsImageFallback: v })}
                  onPickFile={(files) =>
                    onPickImage(`landing/about/origins-fallback`, (url) => updateAboutPage({ originsImageFallback: url }), files)
                  }
                />
              </div>
            </section>
          </div>
        </LandingCmsSectionCard>

        <LandingCmsSectionCard tab={cmsTab('testimonials')} onUploadError={setUploadError}>
          <div className="space-y-6">
        <section className="rounded-2xl dash-card border p-5 md:p-6">
          <h2 className="font-display font-bold text-xl dash-heading mb-4">Testimonials</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <CmsField label="Badge" value={content.testimonials.badge} onChange={(v) => updateTestimonials({ badge: v })} />
            <CmsField label="Title" value={content.testimonials.title} onChange={(v) => updateTestimonials({ title: v })} />
            <CmsField
              label="Trusted row title"
              value={content.testimonials.trustedTitle}
              onChange={(v) => updateTestimonials({ trustedTitle: v })}
            />
          </div>
          <CmsField
            label="Subtitle"
            value={content.testimonials.subtitle}
            onChange={(v) => updateTestimonials({ subtitle: v })}
            multiline
          />
          <p className="text-xs font-bold uppercase dash-muted mb-2">
            Trusted brands ({TRUSTED_BRAND_SLOTS} slots) — label or logo image
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {Array.from({ length: TRUSTED_BRAND_SLOTS }, (_, i) => {
              const brand = content.trustedBrands[i] ?? { label: '', imageUrl: '' };
              return (
                <div key={i} className="rounded-lg border dash-border p-3 space-y-2">
                  <CmsField
                    label={`Brand ${i + 1} name`}
                    value={brand.label}
                    onChange={(v) => updateTrustedBrand(i, { label: v })}
                  />
                  <ImageUrlField
                    label="Logo image (optional)"
                    value={brand.imageUrl ?? ''}
                    onChange={(v) => updateTrustedBrand(i, { imageUrl: v })}
                    onPickFile={(files) =>
                      onPickImage(`landing/testimonials/brands/${i}`, (url) => updateTrustedBrand(i, { imageUrl: url }), files)
                    }
                  />
                </div>
              );
            })}
          </div>

          <p className="text-sm font-bold dash-heading mb-3">
            Customer quotes ({content.testimonialItems.length} fixed)
          </p>
          <div className="space-y-4">
            {content.testimonialItems.map((t, ti) => (
              <div key={t.id} className="rounded-xl border dash-border p-4 space-y-2">
                <span className="text-xs font-bold dash-muted">Quote #{ti + 1}</span>
                <div className="grid md:grid-cols-2 gap-2">
                  <CmsField label="Name" value={t.name} onChange={(v) => updateTestimonialItem(ti, { name: v })} />
                  <CmsField label="Role" value={t.role} onChange={(v) => updateTestimonialItem(ti, { role: v })} />
                  <CmsField label="Area" value={t.company} onChange={(v) => updateTestimonialItem(ti, { company: v })} />
                  <PlainField
                    label="Rating (1–5)"
                    value={String(t.rating)}
                    onChange={(v) => {
                      const n = Number.parseInt(v, 10);
                      if (!Number.isFinite(n)) return;
                      updateTestimonialItem(ti, { rating: Math.min(5, Math.max(1, n)) });
                    }}
                  />
                </div>
                <CmsField
                  label="Quote"
                  value={t.content}
                  onChange={(v) => updateTestimonialItem(ti, { content: v })}
                  multiline
                />
                <ImageUrlField
                  label="Avatar image"
                  value={t.avatar}
                  onChange={(v) => updateTestimonialItem(ti, { avatar: v })}
                  onPickFile={(files) =>
                    onPickImage(`landing/testimonials/avatars/${ti}`, (url) => updateTestimonialItem(ti, { avatar: url }), files)
                  }
                />
              </div>
            ))}
          </div>
        </section>
          </div>
        </LandingCmsSectionCard>

        <LandingCmsSectionCard tab={cmsTab('faq')} onUploadError={setUploadError}>
          <div className="space-y-6">
        <section className="rounded-2xl dash-card border p-5 md:p-6">
          <h2 className="font-display font-bold text-xl dash-heading mb-4">FAQ</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <CmsField label="Eyebrow" value={content.faq.eyebrow} onChange={(v) => updateFaq({ eyebrow: v })} />
            <CmsField label="Title" value={content.faq.title} onChange={(v) => updateFaq({ title: v })} />
            <CmsField
              label="Subtitle"
              value={content.faq.subtitle}
              onChange={(v) => updateFaq({ subtitle: v })}
              multiline
            />
            <CmsField
              label="Footer text"
              value={content.faq.footerText}
              onChange={(v) => updateFaq({ footerText: v })}
              multiline
            />
            <CmsField
              label="Contact CTA label"
              value={content.faq.contactCtaLabel}
              onChange={(v) => updateFaq({ contactCtaLabel: v })}
            />
          </div>
          <p className="text-sm font-bold dash-heading mb-3">Questions & answers ({content.faq.items.length})</p>
          <div className="space-y-4">
            {content.faq.items.map((item, fi) => (
              <div key={`faq-admin-${fi}`} className="rounded-xl border dash-border p-4 space-y-2">
                <span className="text-xs font-bold dash-muted">FAQ #{fi + 1}</span>
                <CmsField
                  label="Question"
                  value={item.question}
                  onChange={(v) => updateFaqItem(fi, { question: v })}
                />
                <CmsField
                  label="Answer"
                  value={item.answer}
                  onChange={(v) => updateFaqItem(fi, { answer: v })}
                  multiline
                />
              </div>
            ))}
          </div>
        </section>
          </div>
        </LandingCmsSectionCard>

        <LandingCmsSectionCard tab={cmsTab('kado-circle')} onUploadError={setUploadError}>
          <div className="space-y-6">
        <section className="rounded-2xl dash-card border p-5 md:p-6">
          <h2 className="font-display font-bold text-xl dash-heading mb-4">Kado Circle</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <CmsField label="Badge" value={content.kadoCircle.badge} onChange={(v) => updateKadoCircle({ badge: v })} />
            <CmsField
              label="Title (before accent)"
              value={content.kadoCircle.titleBefore}
              onChange={(v) => updateKadoCircle({ titleBefore: v })}
            />
            <CmsField
              label="Title accent (red)"
              value={content.kadoCircle.titleAccent}
              onChange={(v) => updateKadoCircle({ titleAccent: v })}
            />
            <PlainField
              label="Email placeholder"
              value={content.kadoCircle.emailPlaceholder}
              onChange={(v) => updateKadoCircle({ emailPlaceholder: v })}
            />
            <CmsField
              label="Submit button"
              value={content.kadoCircle.submitLabel}
              onChange={(v) => updateKadoCircle({ submitLabel: v })}
            />
            <CmsField
              label="Disclaimer"
              value={content.kadoCircle.disclaimer}
              onChange={(v) => updateKadoCircle({ disclaimer: v })}
            />
            <CmsField
              label="Marquee label"
              value={content.kadoCircle.marqueeLabel}
              onChange={(v) => updateKadoCircle({ marqueeLabel: v })}
            />
            <CmsField
              label="Footer link"
              value={content.kadoCircle.footerLinkLabel}
              onChange={(v) => updateKadoCircle({ footerLinkLabel: v })}
            />
          </div>
          <CmsField
            label="Body"
            value={content.kadoCircle.body}
            onChange={(v) => updateKadoCircle({ body: v })}
            multiline
          />
          <p className="text-xs font-bold uppercase dash-muted mt-4 mb-2">
            Marquee carousel ({SPONSOR_SLOTS} slots) — partner name and/or logo
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {Array.from({ length: SPONSOR_SLOTS }, (_, i) => {
              const sponsor = content.kadoCircle.sponsors[i] ?? { label: '', imageUrl: '' };
              return (
                <div key={i} className="rounded-lg border dash-border p-3 space-y-2">
                  <CmsField
                    label={`Partner ${i + 1} name`}
                    value={sponsor.label}
                    onChange={(v) => updateKadoCircleSponsor(i, { label: v })}
                  />
                  <ImageUrlField
                    label="Logo image (optional)"
                    value={sponsor.imageUrl ?? ''}
                    onChange={(v) => updateKadoCircleSponsor(i, { imageUrl: v })}
                    onPickFile={(files) =>
                      onPickImage(`landing/kado-circle/sponsors/${i}`, (url) => updateKadoCircleSponsor(i, { imageUrl: url }), files)
                    }
                  />
                </div>
              );
            })}
          </div>
          <p className="text-xs font-bold uppercase dash-muted mt-4 mb-2">Stats row (4 fixed)</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {content.kadoCircle.stats.map((stat, si) => (
              <div key={si} className="rounded-lg border dash-border p-3 space-y-2">
                <CmsField
                  label={`Stat ${si + 1} value`}
                  value={stat.num}
                  onChange={(v) => {
                    const stats = [...content.kadoCircle.stats];
                    stats[si] = { ...stats[si], num: v };
                    updateKadoCircle({ stats });
                  }}
                />
                <CmsField
                  label="Label"
                  value={stat.label}
                  onChange={(v) => {
                    const stats = [...content.kadoCircle.stats];
                    stats[si] = { ...stats[si], label: v };
                    updateKadoCircle({ stats });
                  }}
                />
              </div>
            ))}
          </div>
        </section>
          </div>
        </LandingCmsSectionCard>
      </div>
    </div>
  );
}

function HeadlineFields({
  label,
  value,
  onChange,
}: {
  label: string;
  value: AccentHeadlineCopy;
  onChange: (next: AccentHeadlineCopy) => void;
}) {
  const fields: { key: keyof AccentHeadlineCopy; fieldLabel: string }[] = [
    { key: 'beforeAccent1', fieldLabel: 'Before accent 1' },
    { key: 'accent1', fieldLabel: 'Accent 1 (red)' },
    { key: 'middle', fieldLabel: 'Middle' },
    { key: 'accent2', fieldLabel: 'Accent 2 (red)' },
    { key: 'afterAccent2', fieldLabel: 'After accent 2' },
  ];
  return (
    <div>
      <p className="text-xs font-bold uppercase dash-muted mb-2">{label}</p>
      <div className="grid md:grid-cols-2 gap-3">
        {fields.map(({ key: fieldKey, fieldLabel }) => (
          <div key={fieldKey}>
            <CmsTextField
              label={fieldLabel}
              value={value[fieldKey]}
              onChange={(v) => onChange({ ...value, [fieldKey]: v })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function PlainField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm"
      />
    </div>
  );
}

function CmsField({ label, value, onChange, multiline }: { label: string; value: CmsText; onChange: (v: CmsText) => void; multiline?: boolean }) {
  return <CmsTextField label={label} value={value} onChange={onChange} multiline={multiline} />;
}

function ImageUrlField({
  label,
  value,
  onChange,
  onPickFile,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onPickFile: (files: FileList | null) => void | Promise<void>;
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">{label}</label>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/path, https://…, or upload"
          className="flex-1 min-w-0 rounded-xl dash-input border px-4 py-2.5 text-sm"
        />
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border dash-border px-3 py-2 text-xs font-bold uppercase tracking-wider hover:bg-kado-dark/5 shrink-0">
          <Upload className="w-4 h-4" />
          Upload
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onPickFile(e.target.files)} />
        </label>
      </div>
      {value ? (
        <div className="mt-2 flex items-start gap-2">
          <img src={value} alt="" className="h-16 w-24 rounded-md object-cover border dash-border" />
          <button type="button" className="text-xs font-bold text-red-600 uppercase" onClick={() => onChange('')}>
            Clear image
          </button>
        </div>
      ) : null}
    </div>
  );
}
