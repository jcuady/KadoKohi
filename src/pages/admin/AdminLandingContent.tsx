import { useEffect, useState } from 'react';
import { Upload } from 'lucide-react';
import { useLandingContentStore, useLandingDraftContent } from '../../store/landingContentStore';
import { readImageDataUrl } from '../../lib/readImageDataUrl';
import LandingEditorToolbar from '../../components/admin/LandingEditorToolbar';
import LandingPreviewFrame from '../../components/admin/LandingPreviewFrame';

const HERO_SLIDE_LABELS = ['Slide 1 — Matcha', 'Slide 2 — Coffee culture', 'Slide 3 — Campaign'];
const TRUSTED_BRAND_SLOTS = 5;
const SPONSOR_SLOTS = 8;

export default function AdminLandingContent() {
  const content = useLandingDraftContent();
  const initDraft = useLandingContentStore((s) => s.initDraft);
  const isPreviewMode = useLandingContentStore((s) => s.isPreviewMode);
  const updateHeroSlide = useLandingContentStore((s) => s.updateHeroSlide);
  const updateHeroCard = useLandingContentStore((s) => s.updateHeroCard);
  const updateHeroChrome = useLandingContentStore((s) => s.updateHeroChrome);
  const updateFeatured = useLandingContentStore((s) => s.updateFeatured);
  const updateEvents = useLandingContentStore((s) => s.updateEvents);
  const updateTestimonials = useLandingContentStore((s) => s.updateTestimonials);
  const updateTestimonialItem = useLandingContentStore((s) => s.updateTestimonialItem);
  const setTrustedBrands = useLandingContentStore((s) => s.setTrustedBrands);
  const updateSchedule = useLandingContentStore((s) => s.updateSchedule);
  const updateOrdering = useLandingContentStore((s) => s.updateOrdering);
  const updateBranchesStrip = useLandingContentStore((s) => s.updateBranchesStrip);
  const updateKadoCircle = useLandingContentStore((s) => s.updateKadoCircle);

  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    initDraft();
    return () => useLandingContentStore.getState().setPreviewMode(false);
  }, [initDraft]);

  const onPickImage = async (onDone: (dataUrl: string) => void, fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    setUploadError(null);
    const res = await readImageDataUrl(file);
    switch (res.ok) {
      case true:
        onDone(res.dataUrl);
        break;
      case false:
        setUploadError(res.error);
        break;
    }
  };

  const patchTrustedBrand = (index: number, value: string) => {
    const next = [...content.trustedBrands];
    while (next.length < TRUSTED_BRAND_SLOTS) next.push('');
    next[index] = value;
    setTrustedBrands(next);
  };

  const patchSponsor = (index: number, value: string) => {
    const next = [...content.kadoCircle.sponsors];
    while (next.length < SPONSOR_SLOTS) next.push('');
    next[index] = value;
    updateKadoCircle({ sponsors: next });
  };

  return (
    <div className="dash-page max-w-6xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading">Homepage content</h1>
        <p className="dash-muted text-sm mt-1">
          Section order and layout are fixed. Replace text and images only, then preview (Zustand draft) or publish to
          go live. Product names/prices still come from Menu; Kado Booth details from Kado Booth admin; branch rows from Branches.
        </p>
        {uploadError ? <p className="mt-2 text-sm text-red-600 font-medium">{uploadError}</p> : null}
      </div>

      <LandingEditorToolbar />
      <LandingPreviewFrame active={isPreviewMode} />

      <div className="space-y-6">
        <section className="rounded-2xl dash-card border p-5 md:p-6">
          <h2 className="font-display font-bold text-xl dash-heading mb-2">Fixed sections (read-only)</h2>
          <ol className="text-sm dash-muted list-decimal list-inside space-y-1">
            <li>Hero</li>
            <li>Featured products</li>
            <li>How to order</li>
            <li>Cafe hours</li>
            <li>Kado Booth</li>
            <li>Testimonials</li>
            <li>Branches</li>
            <li>Kado Circle</li>
          </ol>
        </section>

        <section className="rounded-2xl dash-card border p-5 md:p-6">
          <h2 className="font-display font-bold text-xl dash-heading mb-4">Hero — Labels & CTAs</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Field
              label="Location badge"
              value={content.heroChrome.locationBadge}
              onChange={(v) => updateHeroChrome({ locationBadge: v })}
            />
            <Field
              label="Image credit line"
              value={content.heroChrome.imageCredit}
              onChange={(v) => updateHeroChrome({ imageCredit: v })}
            />
            <Field
              label="Primary CTA label"
              value={content.heroChrome.primaryCtaLabel}
              onChange={(v) => updateHeroChrome({ primaryCtaLabel: v })}
            />
            <Field
              label="Primary CTA path"
              value={content.heroChrome.primaryCtaPath}
              onChange={(v) => updateHeroChrome({ primaryCtaPath: v })}
            />
            <Field
              label="Secondary CTA label"
              value={content.heroChrome.secondaryCtaLabel}
              onChange={(v) => updateHeroChrome({ secondaryCtaLabel: v })}
            />
            <Field
              label="Secondary CTA path"
              value={content.heroChrome.secondaryCtaPath}
              onChange={(v) => updateHeroChrome({ secondaryCtaPath: v })}
            />
          </div>
        </section>

        <section className="rounded-2xl dash-card border p-5 md:p-6">
          <h2 className="font-display font-bold text-xl dash-heading mb-4">Hero slides & card images</h2>
          <p className="text-xs dash-muted mb-4">Three slides and three cards per slide — count cannot change.</p>
          <div className="space-y-6">
            {content.heroSlides.map((slide, index) => (
              <article key={slide.id} className="rounded-xl border dash-border p-4 space-y-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] dash-muted">
                  {HERO_SLIDE_LABELS[index] ?? `Slide ${index + 1}`}
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  <Field
                    label="Title"
                    value={slide.title}
                    onChange={(v) => updateHeroSlide(index, { title: v })}
                  />
                  <Field
                    label="Subtitle"
                    value={slide.subtitle}
                    onChange={(v) => updateHeroSlide(index, { subtitle: v })}
                  />
                  <ImageUrlField
                    label="Background image"
                    value={slide.image}
                    onChange={(v) => updateHeroSlide(index, { image: v })}
                    onPickFile={(files) =>
                      onPickImage((dataUrl) => updateHeroSlide(index, { image: dataUrl }), files)
                    }
                  />
                  <Field
                    label="Background alt text"
                    value={slide.imageAlt}
                    onChange={(v) => updateHeroSlide(index, { imageAlt: v })}
                  />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider dash-muted mb-2">Hero cards</p>
                  <div className="grid gap-4 md:grid-cols-3">
                    {slide.cards.slice(0, 3).map((card, ci) => (
                      <div
                        key={card.id}
                       
                        className="rounded-lg border dash-border p-3 space-y-2"
                      >
                        <p className="text-[10px] font-bold uppercase dash-muted">Card {ci + 1}</p>
                        <Field
                          label="Title"
                          value={card.title}
                          onChange={(v) => updateHeroCard(index, ci, { title: v })}
                        />
                        <Field label="Tag" value={card.tag} onChange={(v) => updateHeroCard(index, ci, { tag: v })} />
                        <Field label="Alt" value={card.alt} onChange={(v) => updateHeroCard(index, ci, { alt: v })} />
                        <ImageUrlField
                          label="Image"
                          value={card.src}
                          onChange={(v) => updateHeroCard(index, ci, { src: v })}
                          onPickFile={(files) =>
                            onPickImage((dataUrl) => updateHeroCard(index, ci, { src: dataUrl }), files)
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

        <section className="rounded-2xl dash-card border p-5 md:p-6">
          <h2 className="font-display font-bold text-xl dash-heading mb-4">Featured section</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Badge" value={content.featured.badge} onChange={(v) => updateFeatured({ badge: v })} />
            <Field label="Title" value={content.featured.title} onChange={(v) => updateFeatured({ title: v })} />
            <Field
              label="Desktop subtitle"
              value={content.featured.subtitleDesktop}
              onChange={(v) => updateFeatured({ subtitleDesktop: v })}
            />
            <Field
              label="Mobile subtitle"
              value={content.featured.subtitleMobile}
              onChange={(v) => updateFeatured({ subtitleMobile: v })}
            />
            <Field
              label="Menu CTA label"
              value={content.featured.menuCtaLabel}
              onChange={(v) => updateFeatured({ menuCtaLabel: v })}
            />
          </div>
          <p className="text-xs dash-muted mt-4 mb-2">
            Image overrides for the three product cards (names/prices from Menu). Leave blank to use each product image.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {([0, 1, 2] as const).map((slot) => (
              <div key={slot}>
                <ImageUrlField
                  label={`Card ${slot + 1} image`}
                  value={content.featured.cardImageOverrides[slot]}
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
                    onPickImage((dataUrl) => {
                      const next: [string, string, string] = [...content.featured.cardImageOverrides] as [
                        string,
                        string,
                        string,
                      ];
                      next[slot] = dataUrl;
                      updateFeatured({ cardImageOverrides: next });
                    }, files)
                  }
                />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl dash-card border p-5 md:p-6">
          <h2 className="font-display font-bold text-xl dash-heading mb-4">How to order</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Badge" value={content.ordering.badge} onChange={(v) => updateOrdering({ badge: v })} />
            <Field label="Title" value={content.ordering.title} onChange={(v) => updateOrdering({ title: v })} />
            <Field
              label="Desktop subtitle"
              value={content.ordering.subtitleDesktop}
              onChange={(v) => updateOrdering({ subtitleDesktop: v })}
            />
            <Field
              label="Mobile subtitle"
              value={content.ordering.subtitleMobile}
              onChange={(v) => updateOrdering({ subtitleMobile: v })}
            />
          </div>
        </section>

        <section className="rounded-2xl dash-card border p-5 md:p-6">
          <h2 className="font-display font-bold text-xl dash-heading mb-4">Schedule</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Badge" value={content.schedule.badge} onChange={(v) => updateSchedule({ badge: v })} />
            <Field label="Title" value={content.schedule.title} onChange={(v) => updateSchedule({ title: v })} />
            <Field label="Phone" value={content.schedule.phone} onChange={(v) => updateSchedule({ phone: v })} />
            <Field
              label="Credit line"
              value={content.schedule.creditLine}
              onChange={(v) => updateSchedule({ creditLine: v })}
            />
          </div>
          <div className="mt-4">
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Description</label>
            <textarea
              value={content.schedule.description}
              onChange={(e) => updateSchedule({ description: e.target.value })}
              rows={3}
              className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm resize-none"
            />
          </div>
        </section>

        <section className="rounded-2xl dash-card border p-5 md:p-6">
          <h2 className="font-display font-bold text-xl dash-heading mb-4">Kado Booth block</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Badge" value={content.events.badge} onChange={(v) => updateEvents({ badge: v })} />
            <Field label="Title" value={content.events.title} onChange={(v) => updateEvents({ title: v })} />
            <Field label="Subtitle" value={content.events.subtitle} onChange={(v) => updateEvents({ subtitle: v })} />
            <ImageUrlField
              label="Cover image override (optional)"
              value={content.events.coverImageOverride}
              onChange={(v) => updateEvents({ coverImageOverride: v })}
              onPickFile={(files) => onPickImage((dataUrl) => updateEvents({ coverImageOverride: dataUrl }), files)}
            />
            <Field
              label="No-event message"
              value={content.events.noEventBody}
              onChange={(v) => updateEvents({ noEventBody: v })}
            />
            <Field
              label="No-event link label"
              value={content.events.noEventBrowseLabel}
              onChange={(v) => updateEvents({ noEventBrowseLabel: v })}
            />
          </div>
        </section>

        <section className="rounded-2xl dash-card border p-5 md:p-6">
          <h2 className="font-display font-bold text-xl dash-heading mb-4">Branches strip</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Field
              label="Badge"
              value={content.branchesStrip.badge}
              onChange={(v) => updateBranchesStrip({ badge: v })}
            />
            <Field
              label="Title"
              value={content.branchesStrip.title}
              onChange={(v) => updateBranchesStrip({ title: v })}
            />
            <Field
              label="CTA label"
              value={content.branchesStrip.ctaLabel}
              onChange={(v) => updateBranchesStrip({ ctaLabel: v })}
            />
          </div>
        </section>

        <section className="rounded-2xl dash-card border p-5 md:p-6">
          <h2 className="font-display font-bold text-xl dash-heading mb-4">Testimonials</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <Field label="Badge" value={content.testimonials.badge} onChange={(v) => updateTestimonials({ badge: v })} />
            <Field label="Title" value={content.testimonials.title} onChange={(v) => updateTestimonials({ title: v })} />
            <Field
              label="Trusted row title"
              value={content.testimonials.trustedTitle}
              onChange={(v) => updateTestimonials({ trustedTitle: v })}
            />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Subtitle</label>
            <textarea
              value={content.testimonials.subtitle}
              onChange={(e) => updateTestimonials({ subtitle: e.target.value })}
              rows={2}
              className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm resize-none"
            />
          </div>
          <p className="text-xs font-bold uppercase dash-muted mb-2">Trusted brands ({TRUSTED_BRAND_SLOTS} slots)</p>
          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            {Array.from({ length: TRUSTED_BRAND_SLOTS }, (_, i) => (
              <div key={i}>
                <Field
                  label={`Brand ${i + 1}`}
                  value={content.trustedBrands[i] ?? ''}
                  onChange={(v) => patchTrustedBrand(i, v)}
                />
              </div>
            ))}
          </div>

          <p className="text-sm font-bold dash-heading mb-3">Customer quotes (4 fixed)</p>
          <div className="space-y-4">
            {content.testimonialItems.map((t, ti) => (
              <div key={t.id} className="rounded-xl border dash-border p-4 space-y-2">
                <span className="text-xs font-bold dash-muted">Quote #{ti + 1}</span>
                <div className="grid md:grid-cols-2 gap-2">
                  <Field label="Name" value={t.name} onChange={(v) => updateTestimonialItem(ti, { name: v })} />
                  <Field label="Role" value={t.role} onChange={(v) => updateTestimonialItem(ti, { role: v })} />
                  <Field label="Area" value={t.company} onChange={(v) => updateTestimonialItem(ti, { company: v })} />
                  <Field
                    label="Rating (1–5)"
                    value={String(t.rating)}
                    onChange={(v) => {
                      const n = Number.parseInt(v, 10);
                      if (!Number.isFinite(n)) return;
                      updateTestimonialItem(ti, { rating: Math.min(5, Math.max(1, n)) });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Quote</label>
                  <textarea
                    value={t.content}
                    onChange={(e) => updateTestimonialItem(ti, { content: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm resize-none"
                  />
                </div>
                <ImageUrlField
                  label="Avatar image"
                  value={t.avatar}
                  onChange={(v) => updateTestimonialItem(ti, { avatar: v })}
                  onPickFile={(files) => onPickImage((dataUrl) => updateTestimonialItem(ti, { avatar: dataUrl }), files)}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl dash-card border p-5 md:p-6">
          <h2 className="font-display font-bold text-xl dash-heading mb-4">Kado Circle</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Badge" value={content.kadoCircle.badge} onChange={(v) => updateKadoCircle({ badge: v })} />
            <Field
              label="Title (before accent)"
              value={content.kadoCircle.titleBefore}
              onChange={(v) => updateKadoCircle({ titleBefore: v })}
            />
            <Field
              label="Title accent (red)"
              value={content.kadoCircle.titleAccent}
              onChange={(v) => updateKadoCircle({ titleAccent: v })}
            />
            <Field
              label="Email placeholder"
              value={content.kadoCircle.emailPlaceholder}
              onChange={(v) => updateKadoCircle({ emailPlaceholder: v })}
            />
            <Field
              label="Submit button"
              value={content.kadoCircle.submitLabel}
              onChange={(v) => updateKadoCircle({ submitLabel: v })}
            />
            <Field
              label="Disclaimer"
              value={content.kadoCircle.disclaimer}
              onChange={(v) => updateKadoCircle({ disclaimer: v })}
            />
            <Field
              label="Marquee label"
              value={content.kadoCircle.marqueeLabel}
              onChange={(v) => updateKadoCircle({ marqueeLabel: v })}
            />
            <Field
              label="Footer link"
              value={content.kadoCircle.footerLinkLabel}
              onChange={(v) => updateKadoCircle({ footerLinkLabel: v })}
            />
          </div>
          <div className="mt-4">
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Body</label>
            <textarea
              value={content.kadoCircle.body}
              onChange={(e) => updateKadoCircle({ body: e.target.value })}
              rows={3}
              className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm resize-none"
            />
          </div>
          <p className="text-xs font-bold uppercase dash-muted mt-4 mb-2">Sponsors ({SPONSOR_SLOTS} slots)</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {Array.from({ length: SPONSOR_SLOTS }, (_, i) => (
              <div key={i}>
                <Field
                label={`Sponsor ${i + 1}`}
                value={content.kadoCircle.sponsors[i] ?? ''}
                onChange={(v) => patchSponsor(i, v)}
              />
              </div>
            ))}
          </div>
          <p className="text-xs font-bold uppercase dash-muted mt-4 mb-2">Stats row (4 fixed)</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {content.kadoCircle.stats.map((stat, si) => (
              <div key={si} className="rounded-lg border dash-border p-3 space-y-2">
                <Field
                  label={`Stat ${si + 1} value`}
                  value={stat.num}
                  onChange={(v) => {
                    const stats = [...content.kadoCircle.stats];
                    stats[si] = { ...stats[si], num: v };
                    updateKadoCircle({ stats });
                  }}
                />
                <Field
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
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
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
