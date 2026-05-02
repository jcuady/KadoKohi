import { cn } from '@/lib/utils';
import { type CSSProperties, type ReactNode, useEffect, useRef } from 'react';

export interface HorizontalMarqueeProps {
  children: ReactNode;
  pauseOnHover?: boolean;
  reverse?: boolean;
  className?: string;
  speed?: number;
}

/** Infinite horizontal scroll — set `--duration` via `speed` (seconds per loop). */
export function HorizontalMarquee({
  children,
  pauseOnHover = false,
  reverse = false,
  className,
  speed = 40,
}: HorizontalMarqueeProps) {
  return (
    <div
      className={cn('group flex overflow-hidden', className)}
      style={{ '--duration': `${speed}s` } as CSSProperties}
    >
      <div
        className={cn(
          'flex shrink-0 animate-marquee',
          reverse && '[animation-direction:reverse]',
          pauseOnHover && 'group-hover:[animation-play-state:paused]',
        )}
      >
        {children}
      </div>
      <div
        className={cn(
          'flex shrink-0 animate-marquee',
          reverse && '[animation-direction:reverse]',
          pauseOnHover && 'group-hover:[animation-play-state:paused]',
        )}
        aria-hidden="true"
      >
        {children}
      </div>
    </div>
  );
}

export interface VerticalMarqueeProps {
  children: ReactNode;
  pauseOnHover?: boolean;
  reverse?: boolean;
  className?: string;
  speed?: number;
  onItemsRef?: (items: HTMLElement[]) => void;
}

export function VerticalMarquee({
  children,
  pauseOnHover = false,
  reverse = false,
  className,
  speed = 30,
  onItemsRef,
}: VerticalMarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (onItemsRef && containerRef.current) {
      const items = Array.from(containerRef.current.querySelectorAll('.marquee-item')) as HTMLElement[];
      onItemsRef(items);
    }
  }, [onItemsRef]);

  return (
    <div
      ref={containerRef}
      className={cn('group flex flex-col overflow-hidden', className)}
      style={{ '--duration': `${speed}s` } as CSSProperties}
    >
      <div
        className={cn(
          'flex shrink-0 flex-col animate-marquee-vertical',
          reverse && '[animation-direction:reverse]',
          pauseOnHover && 'group-hover:[animation-play-state:paused]',
        )}
      >
        {children}
      </div>
      <div
        className={cn(
          'flex shrink-0 flex-col animate-marquee-vertical',
          reverse && '[animation-direction:reverse]',
          pauseOnHover && 'group-hover:[animation-play-state:paused]',
        )}
        aria-hidden="true"
      >
        {children}
      </div>
    </div>
  );
}
