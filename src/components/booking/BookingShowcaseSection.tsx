import { motion } from 'motion/react';
import { Bird, Cake, Coffee, Leaf, Sparkles, Users, type LucideIcon } from 'lucide-react';
import type { BookingShowcaseMedia } from '../../types/domain';
import type { BookingPageKind } from '../../lib/bookingPageKinds';

type Props = {
  kind: BookingPageKind;
  media: BookingShowcaseMedia[];
};

const COFFEE_FALLBACK: LucideIcon[] = [Cake, Bird, Users];
const MATCHA_FALLBACK: LucideIcon[] = [Leaf, Coffee, Sparkles];

function resolveIcon(kind: BookingPageKind, item: BookingShowcaseMedia, index: number): LucideIcon {
  const hay = `${item.title} ${(item.tags ?? []).join(' ')}`.toLowerCase();
  if (kind === 'matcha-bar') {
    if (/latte/.test(hay)) return Coffee;
    if (/private|celebrat/.test(hay)) return Sparkles;
    if (/ceremon|matcha bar|setup/.test(hay)) return Leaf;
    return MATCHA_FALLBACK[index % MATCHA_FALLBACK.length]!;
  }
  if (/birth|cake/.test(hay)) return Cake;
  if (/wed|reception|dove/.test(hay)) return Bird;
  if (/corp|mixer|business|office/.test(hay)) return Users;
  return COFFEE_FALLBACK[index % COFFEE_FALLBACK.length]!;
}

/**
 * Occasion tiles on brand-red grid.
 * Desktop: 3-up portrait cards. Mobile: stacked. Icon leads; type follows.
 */
export default function BookingShowcaseSection({ kind, media }: Props) {
  if (media.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-kado-red px-5 py-12 sm:px-8 sm:py-16" aria-label="Event experiences">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #191919 1px, transparent 1px), linear-gradient(to bottom, #191919 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
        aria-hidden
      />
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3">
        {media.map((item, i) => {
          const Icon = resolveIcon(kind, item, i);
          return (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex h-full flex-col rounded-xl bg-kado-cream p-5 sm:p-6"
            >
              <Icon className="mb-5 h-9 w-9 stroke-[1.4] text-kado-red sm:h-10 sm:w-10" aria-hidden />
              <h3 className="font-display text-lg font-bold leading-[1.15] tracking-tight text-kado-red sm:text-xl">
                {item.title}
              </h3>
              {item.caption ? (
                <p className="mt-2.5 flex-1 text-sm leading-relaxed text-kado-red/75">{item.caption}</p>
              ) : null}
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
