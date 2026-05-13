import { useState } from 'react';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { useLandingContentStore, type HomeBlockType } from '../../store/landingContentStore';
import type { HomeHeroSlide } from '../../data/homeHeroMedia';

export default function AdminLandingContent() {
  const content = useLandingContentStore((s) => s.content);
  const setHeroSlides = useLandingContentStore((s) => s.setHeroSlides);
  const reorderHomeBlocks = useLandingContentStore((s) => s.reorderHomeBlocks);
  const toggleHomeBlock = useLandingContentStore((s) => s.toggleHomeBlock);
  const updateFeatured = useLandingContentStore((s) => s.updateFeatured);
  const updateEvents = useLandingContentStore((s) => s.updateEvents);
  const updateTestimonials = useLandingContentStore((s) => s.updateTestimonials);
  const updateSchedule = useLandingContentStore((s) => s.updateSchedule);

  const [dragBlockId, setDragBlockId] = useState<HomeBlockType | null>(null);
  const [dragSlideIndex, setDragSlideIndex] = useState<number | null>(null);

  const moveBlock = (targetId: HomeBlockType) => {
    if (!dragBlockId || dragBlockId === targetId) return;
    const from = content.homeBlocks.findIndex((b) => b.id === dragBlockId);
    const to = content.homeBlocks.findIndex((b) => b.id === targetId);
    if (from === -1 || to === -1) return;
    reorderHomeBlocks(from, to);
  };

  const moveSlide = (toIndex: number) => {
    if (dragSlideIndex === null || dragSlideIndex === toIndex) return;
    const next = [...content.heroSlides];
    const [moved] = next.splice(dragSlideIndex, 1);
    next.splice(toIndex, 0, moved);
    setHeroSlides(next);
  };

  const updateSlide = (index: number, patch: Partial<HomeHeroSlide>) => {
    const next = [...content.heroSlides];
    next[index] = { ...next[index], ...patch };
    setHeroSlides(next);
  };

  const removeSlide = (index: number) => {
    if (content.heroSlides.length <= 1) return;
    const next = content.heroSlides.filter((_, i) => i !== index);
    setHeroSlides(next);
  };

  const addSlide = () => {
    const base = content.heroSlides[content.heroSlides.length - 1];
    const id = `slide-${Date.now()}`;
    setHeroSlides([
      ...content.heroSlides,
      {
        ...base,
        id,
        title: 'New Slide Title',
        subtitle: 'New slide subtitle',
      },
    ]);
  };

  return (
    <div className="dash-page max-w-6xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading">Landing Builder (MVP)</h1>
        <p className="dash-muted text-sm mt-1">
          Drag and drop homepage sections and hero slides. Edit copy and image placeholders without code.
        </p>
      </div>

      <div className="space-y-6">
        <section className="rounded-2xl dash-card border p-5 md:p-6">
          <h2 className="font-display font-bold text-xl dash-heading mb-4">Home Section Order (Drag & Drop)</h2>
          <div className="space-y-2">
            {content.homeBlocks.map((block) => (
              <div
                key={block.id}
                draggable
                onDragStart={() => setDragBlockId(block.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => moveBlock(block.id)}
                className="rounded-xl border dash-border dash-card-alt px-4 py-3 flex items-center gap-3"
              >
                <GripVertical className="w-4 h-4 dash-muted" />
                <p className="text-sm font-bold dash-heading flex-1">{block.label}</p>
                <label className="text-xs dash-muted flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={block.enabled}
                    onChange={(e) => toggleHomeBlock(block.id, e.target.checked)}
                  />
                  Visible
                </label>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl dash-card border p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-xl dash-heading">Hero Slides (Drag & Drop)</h2>
            <button
              type="button"
              onClick={addSlide}
              className="inline-flex items-center gap-2 rounded-xl bg-kado-red text-kado-cream px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-kado-dark transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Slide
            </button>
          </div>
          <div className="space-y-3">
            {content.heroSlides.map((slide, index) => (
              <article
                key={slide.id}
                draggable
                onDragStart={() => setDragSlideIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => moveSlide(index)}
                className="rounded-xl border dash-border p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <GripVertical className="w-4 h-4 dash-muted" />
                  <p className="text-xs font-bold uppercase tracking-[0.14em] dash-muted">Slide {index + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeSlide(index)}
                    className="ml-auto text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <Field label="Title" value={slide.title} onChange={(v) => updateSlide(index, { title: v })} />
                  <Field label="Subtitle" value={slide.subtitle} onChange={(v) => updateSlide(index, { subtitle: v })} />
                  <Field label="Image URL" value={slide.image} onChange={(v) => updateSlide(index, { image: v })} />
                  <Field label="Image Alt" value={slide.imageAlt} onChange={(v) => updateSlide(index, { imageAlt: v })} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl dash-card border p-5 md:p-6">
          <h2 className="font-display font-bold text-xl dash-heading mb-4">Featured Section Copy</h2>
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
        </section>

        <section className="rounded-2xl dash-card border p-5 md:p-6">
          <h2 className="font-display font-bold text-xl dash-heading mb-4">Events + Testimonials Copy</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Events badge" value={content.events.badge} onChange={(v) => updateEvents({ badge: v })} />
            <Field label="Events title" value={content.events.title} onChange={(v) => updateEvents({ title: v })} />
            <Field label="Events subtitle" value={content.events.subtitle} onChange={(v) => updateEvents({ subtitle: v })} />
            <Field
              label="Testimonials badge"
              value={content.testimonials.badge}
              onChange={(v) => updateTestimonials({ badge: v })}
            />
            <Field
              label="Testimonials title"
              value={content.testimonials.title}
              onChange={(v) => updateTestimonials({ title: v })}
            />
            <Field
              label="Trusted title"
              value={content.testimonials.trustedTitle}
              onChange={(v) => updateTestimonials({ trustedTitle: v })}
            />
          </div>
          <div className="mt-4">
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Testimonials subtitle</label>
            <textarea
              value={content.testimonials.subtitle}
              onChange={(e) => updateTestimonials({ subtitle: e.target.value })}
              rows={3}
              className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm resize-none"
            />
          </div>
        </section>

        <section className="rounded-2xl dash-card border p-5 md:p-6">
          <h2 className="font-display font-bold text-xl dash-heading mb-4">Schedule Section Copy + Credits</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Schedule badge" value={content.schedule.badge} onChange={(v) => updateSchedule({ badge: v })} />
            <Field label="Schedule title" value={content.schedule.title} onChange={(v) => updateSchedule({ title: v })} />
            <Field label="Phone" value={content.schedule.phone} onChange={(v) => updateSchedule({ phone: v })} />
            <Field label="Credit line" value={content.schedule.creditLine} onChange={(v) => updateSchedule({ creditLine: v })} />
          </div>
          <div className="mt-4">
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Schedule description</label>
            <textarea
              value={content.schedule.description}
              onChange={(e) => updateSchedule({ description: e.target.value })}
              rows={3}
              className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm resize-none"
            />
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

