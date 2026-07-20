import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { toWebpSrc } from '../../lib/toWebpSrc';

export type CollagePolaroid = {
  src: string;
  alt: string;
  /** Degrees — scrapbook tilt */
  rotate?: number;
  /** CSS object-position for collage crops from a shared hero frame */
  objectPosition?: string;
  className?: string;
};

export type CollageSticker =
  | { kind: 'circle'; label: string; className?: string }
  | { kind: 'rect'; label: string; className?: string };

type Props = {
  eyebrow: string;
  title: string;
  description: ReactNode;
  /** Prefer 4 shots — 2 left + 2 right */
  polaroids:
    | [CollagePolaroid, CollagePolaroid, CollagePolaroid, CollagePolaroid]
    | CollagePolaroid[];
  stickers?: CollageSticker[];
  titleId?: string;
  children?: ReactNode;
  className?: string;
};

const LEFT_LAYOUT = [
  { pos: 'absolute left-[6%] top-[12%] w-[76%]', rotate: -9 },
  { pos: 'absolute bottom-[10%] left-[14%] w-[70%]', rotate: 7 },
] as const;

const RIGHT_LAYOUT = [
  { pos: 'absolute right-[6%] top-[12%] w-[74%]', rotate: 8 },
  { pos: 'absolute bottom-[10%] right-[12%] w-[70%]', rotate: -6 },
] as const;

function PolaroidCard({
  shot,
  rotate,
  className,
  priority,
}: {
  shot: CollagePolaroid;
  rotate: number;
  className?: string;
  priority?: boolean;
}) {
  const webp = toWebpSrc(shot.src);
  return (
    <figure
      className={cn(
        'overflow-hidden bg-kado-offwhite p-1.5 shadow-[0_10px_28px_rgba(25,25,25,0.18)] sm:p-2',
        className,
      )}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <picture>
        {webp ? <source type="image/webp" srcSet={webp} /> : null}
        <img
          src={shot.src}
          alt={shot.alt}
          width={480}
          height={480}
          className="aspect-square w-full object-cover"
          style={shot.objectPosition ? { objectPosition: shot.objectPosition } : undefined}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : undefined}
        />
      </picture>
    </figure>
  );
}

/**
 * Cream collage marketing hero — centered type, 2 polaroids per side.
 * Brand: cream field + dark type + red accents (proper contrast).
 */
export default function CollagePageHero({
  eyebrow,
  title,
  description,
  polaroids,
  stickers = [],
  titleId,
  children,
  className,
}: Props) {
  const shots = polaroids.slice(0, 4);
  const leftShots = shots.slice(0, 2);
  const rightShots = shots.slice(2, 4);

  return (
    <section
      className={cn(
        'relative overflow-hidden bg-kado-cream text-kado-dark',
        'min-h-[min(78svh,34rem)] sm:min-h-[min(64svh,30rem)]',
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(25,25,25,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(25,25,25,0.22) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />

      <span
        aria-hidden
        className="pointer-events-none absolute -left-4 bottom-[8%] select-none font-display text-[clamp(5rem,18vw,11rem)] font-black leading-none text-kado-red/[0.08] sm:left-2"
      >
        角
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute -right-2 top-[12%] select-none font-display text-[clamp(4rem,14vw,9rem)] font-black leading-none text-kado-red/[0.08] sm:right-4"
      >
        角
      </span>

      {/* Left — 2 polaroids */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-[1] hidden w-[min(28%,16rem)] lg:block"
        aria-hidden
      >
        {leftShots.map((shot, i) => {
          const layout = LEFT_LAYOUT[i]!;
          return (
            <div key={`${shot.src}-l-${i}`} className={layout.pos}>
              <PolaroidCard
                shot={shot}
                rotate={shot.rotate ?? layout.rotate}
                priority={i === 0}
                className={cn('w-full', shot.className)}
              />
            </div>
          );
        })}
        {stickers.map((sticker, i) =>
          sticker.kind === 'circle' ? (
            <span
              key={`c-${i}`}
              className={cn(
                'absolute z-[3] flex h-[4.5rem] w-[4.5rem] -rotate-[12deg] items-center justify-center rounded-full bg-kado-red px-2 text-center font-display text-[0.55rem] font-black uppercase leading-tight tracking-wide text-kado-cream',
                sticker.className ?? 'left-[12%] top-[8%]',
              )}
            >
              {sticker.label}
            </span>
          ) : (
            <span
              key={`r-${i}`}
              className={cn(
                'absolute z-[3] -rotate-6 rounded-sm bg-kado-red px-2.5 py-1.5 font-sans text-[9px] font-bold uppercase tracking-[0.14em] text-kado-cream sm:text-[10px]',
                sticker.className ?? 'bottom-[18%] left-[14%]',
              )}
            >
              {sticker.label}
            </span>
          ),
        )}
      </div>

      {/* Right — 2 polaroids */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-[1] hidden w-[min(30%,17rem)] lg:block"
        aria-hidden
      >
        {rightShots.map((shot, i) => {
          const layout = RIGHT_LAYOUT[i]!;
          return (
            <div key={`${shot.src}-r-${i}`} className={layout.pos}>
              <PolaroidCard
                shot={shot}
                rotate={shot.rotate ?? layout.rotate}
                className={cn('w-full', shot.className)}
              />
            </div>
          );
        })}
        <span className="absolute right-[16%] top-[46%] font-display text-2xl font-black uppercase tracking-tight text-kado-red/90">
          KADO KŌHĪ
        </span>
      </div>

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-5 pb-14 pt-[calc(var(--public-nav-height,4rem)+2rem)] text-center sm:px-8 sm:pb-16 sm:pt-[calc(var(--public-nav-height,4rem)+2.5rem)]">
        <span className="inline-flex rounded-full bg-kado-red px-3.5 py-1.5 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-kado-cream">
          {eyebrow}
        </span>
        <h1
          id={titleId}
          className="mt-4 max-w-2xl font-display text-[clamp(1.85rem,5.5vw,3.25rem)] font-bold uppercase leading-[1.05] tracking-tight text-kado-dark"
        >
          {title}
        </h1>
        <div className="mx-auto mt-4 max-w-xl font-sans text-sm leading-relaxed text-kado-dark/70 sm:text-base">
          {description}
        </div>
        {children ? <div className="mt-6 flex w-full max-w-lg flex-col items-center gap-3">{children}</div> : null}

        {/* Mobile: 2×2 scrapbook */}
        <div
          className="relative mt-10 grid w-full max-w-xs grid-cols-2 gap-3 lg:hidden"
          aria-hidden
        >
          {shots.map((shot, i) => (
            <div key={`${shot.src}-m-${i}`} className={cn(i % 2 === 1 && 'mt-4')}>
              <PolaroidCard
                shot={shot}
                rotate={shot.rotate ?? [-7, 6, 5, -4][i] ?? 0}
                priority={i === 0}
                className="w-full"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
