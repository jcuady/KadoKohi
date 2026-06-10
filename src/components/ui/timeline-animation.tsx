import {
  createElement,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
  type RefObject,
} from 'react';
import { motion, useInView, type Variants } from 'motion/react';
import { cn } from '@/lib/utils';

type ViewportOptions = {
  amount?: number;
  margin?: string;
  once?: boolean;
};

export type TimelineContentProps<T extends ElementType = 'div'> = {
  as?: T;
  children?: ReactNode;
  animationNum?: number;
  timelineRef: RefObject<HTMLElement | null>;
  customVariants?: Variants;
  className?: string;
  viewport?: ViewportOptions;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

const MOTION_TAGS = new Set([
  'div',
  'span',
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'a',
  'button',
  'nav',
  'ul',
  'li',
  'section',
]);

const defaultVariants: Variants = {
  hidden: { opacity: 0, y: 28, filter: 'blur(8px)' },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
      transition: {
        delay: i * 0.12,
        duration: 0.65,
        ease: 'easeOut' as const,
      },
  }),
};

/**
 * Staggered viewport reveal — pairs with a shared `timelineRef` on the section container.
 * Based on UI Layouts timeline-animation pattern (motion/react).
 */
export function TimelineContent<T extends ElementType = 'div'>({
  as,
  children,
  animationNum = 0,
  timelineRef,
  customVariants,
  className,
  viewport = { amount: 0.22, margin: '0px 0px -80px 0px', once: true },
  ...props
}: TimelineContentProps<T>) {
  const tag = (as ?? 'div') as string;
  const isInView = useInView(timelineRef, {
    amount: viewport.amount ?? 0.22,
    margin: viewport.margin as `${number}px ${number}px ${number}px ${number}px` | undefined,
    once: viewport.once ?? true,
  });

  const variants = customVariants ?? defaultVariants;

  if (MOTION_TAGS.has(tag)) {
    const MotionEl = motion[tag as keyof typeof motion] as typeof motion.div;
    return (
      <MotionEl
        custom={animationNum}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={variants}
        className={cn(className)}
        {...(props as object)}
      >
        {children}
      </MotionEl>
    );
  }

  return createElement(
    tag,
    { className: cn(className), ...props },
    children,
  );
}
