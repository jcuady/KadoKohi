import { useEffect, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Vertical parallax on scroll (GSAP ScrollTrigger scrub). */
export function useParallaxY(ref: RefObject<HTMLElement | null>, amount = 12) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { y: -amount },
        {
          y: amount,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2,
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [ref, amount]);
}

/** Pin a section and scrub inner progress (timeline rail). */
export function usePinnedProgress(
  sectionRef: RefObject<HTMLElement | null>,
  progressRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const section = sectionRef.current;
    const progress = progressRef.current;
    if (!section || !progress || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        progress,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top 20%',
            end: 'bottom 60%',
            scrub: 0.6,
          },
        },
      );
    }, section);

    return () => ctx.revert();
  }, [sectionRef, progressRef]);
}

/** Stagger children with a shared scroll trigger. */
export function useStaggerReveal(
  containerRef: RefObject<HTMLElement | null>,
  childSelector: string,
) {
  useEffect(() => {
    const root = containerRef.current;
    if (!root || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.from(root.querySelectorAll(childSelector), {
        opacity: 0,
        y: 36,
        duration: 0.7,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: root,
          start: 'top 78%',
          toggleActions: 'play none none reverse',
        },
      });
    }, root);

    return () => ctx.revert();
  }, [containerRef, childSelector]);
}

/** Draw accent lines / borders as cards enter the viewport. */
export function useRevealLines(
  containerRef: RefObject<HTMLElement | null>,
  lineSelector: string,
) {
  useEffect(() => {
    const root = containerRef.current;
    if (!root || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      root.querySelectorAll(lineSelector).forEach((line) => {
        const horizontal = line.classList.contains('commitment-accent-h');
        gsap.from(line, {
          scaleX: horizontal ? 0 : 1,
          scaleY: horizontal ? 1 : 0,
          transformOrigin: horizontal ? 'left center' : 'top center',
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: line,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        });
      });
    }, root);

    return () => ctx.revert();
  }, [containerRef, lineSelector]);
}

/** Subtle parallax on section headings while scrolling. */
export function useHeadingParallax(
  ref: RefObject<HTMLElement | null>,
  yPercent = 8,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { yPercent: -yPercent },
        {
          yPercent,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.4,
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [ref, yPercent]);
}
