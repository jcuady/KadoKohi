/**
 * Empty-state calendar mark — cream line-art on brand red.
 * Fluid clamp size; always centered + upright (no tilt).
 */
const WEBP = '/events/calendar-icon.webp';
const PNG = '/events/calendar-icon.png';
const W = 589;
const H = 603;

type Props = {
  className?: string;
};

export default function EmptyCalendarMark({ className = '' }: Props) {
  return (
    <picture
      className={`mx-auto block w-[clamp(6.75rem,28vw,11.5rem)] shrink-0 ${className}`.trim()}
    >
      <source
        type="image/webp"
        srcSet={`${WEBP} ${W}w`}
        sizes="(max-width: 640px) 28vw, 11.5rem"
      />
      <img
        src={PNG}
        srcSet={`${PNG} ${W}w`}
        sizes="(max-width: 640px) 28vw, 11.5rem"
        alt=""
        width={W}
        height={H}
        decoding="async"
        fetchPriority="low"
        draggable={false}
        className="mx-auto block aspect-[589/603] h-auto w-full max-w-full object-contain object-center select-none"
      />
    </picture>
  );
}
