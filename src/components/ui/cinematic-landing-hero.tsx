import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "../../lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const STYLES = `
  /* Only GSAP-controlled intro layers use reveal; card shell stays visible */
  .app-reveal { visibility: hidden; }

  .app-grain {
    position: absolute; inset: 0; width: 100%; height: 100%;
    pointer-events: none; z-index: 50; opacity: 0.03; mix-blend-mode: overlay;
    background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)"/></svg>');
  }

  .app-grid {
    background-size: 60px 60px;
    background-image:
      linear-gradient(to right, rgba(241,223,186,0.04) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(241,223,186,0.04) 1px, transparent 1px);
    mask-image: radial-gradient(ellipse at center, black 0%, transparent 68%);
    -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 68%);
  }

  .app-text-warm {
    color: #F1DFBA;
    text-shadow: 0 6px 20px rgba(158,24,29,0.15), 0 2px 4px rgba(0,0,0,0.2);
  }
  /* Gradient fill only — no filter on clipped text (filters cause descender "cutouts" in WebKit) */
  .app-text-cream-grad {
    background: linear-gradient(180deg, #FAF4E8 0%, #E8D4B0 55%, #C4A882 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    padding-bottom: 0.12em;
    line-height: 1.12;
  }
  .app-text-card-cream {
    background: linear-gradient(180deg, #FFFFFF 0%, #D4BC94 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    padding-bottom: 0.1em;
    line-height: 1.05;
  }

  .app-card {
    background: linear-gradient(145deg, #1F0C0D 0%, #0D0808 100%);
    box-shadow:
      0 40px 100px -20px rgba(0,0,0,0.97),
      0 20px 40px -20px rgba(0,0,0,0.88),
      inset 0 1px 2px rgba(241,223,186,0.06),
      inset 0 -2px 4px rgba(0,0,0,0.9);
    border: 1px solid rgba(241,223,186,0.03);
    position: relative;
  }
  .app-sheen {
    position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 50;
    background: radial-gradient(800px circle at var(--mouse-x,50%) var(--mouse-y,50%), rgba(241,223,186,0.04) 0%, transparent 40%);
    mix-blend-mode: screen; transition: opacity 0.3s ease;
  }

  .app-bezel {
    background-color: #111;
    box-shadow:
      inset 0 0 0 2px #52525B,
      inset 0 0 0 7px #000,
      0 40px 80px -15px rgba(0,0,0,0.97),
      0 15px 25px -5px rgba(0,0,0,0.85);
    transform-style: preserve-3d;
  }
  .app-hw-btn {
    background: linear-gradient(90deg, #404040 0%, #171717 100%);
    box-shadow: -2px 0 5px rgba(0,0,0,0.8), inset -1px 0 1px rgba(255,255,255,0.15), inset 1px 0 2px rgba(0,0,0,0.8);
    border-left: 1px solid rgba(255,255,255,0.05);
  }
  .app-glare { background: linear-gradient(110deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 45%); }

  .app-badge {
    background: linear-gradient(135deg, rgba(241,223,186,0.06) 0%, rgba(241,223,186,0.01) 100%);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    box-shadow:
      0 0 0 1px rgba(241,223,186,0.07),
      0 25px 50px -12px rgba(0,0,0,0.88),
      inset 0 1px 1px rgba(241,223,186,0.1),
      inset 0 -1px 1px rgba(0,0,0,0.55);
  }

  .btn-store-cream {
    background: linear-gradient(180deg, #F1DFBA 0%, #E4CDA0 100%);
    color: #191919;
    box-shadow: 0 0 0 1px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.12), 0 12px 24px -4px rgba(0,0,0,0.38), inset 0 1px 1px rgba(255,255,255,0.75), inset 0 -3px 6px rgba(0,0,0,0.06);
    transition: all 0.4s cubic-bezier(0.25,1,0.5,1);
  }
  .btn-store-cream:hover {
    transform: translateY(-3px);
    box-shadow: 0 0 0 1px rgba(0,0,0,0.07), 0 6px 12px -2px rgba(0,0,0,0.18), 0 20px 32px -6px rgba(0,0,0,0.48), inset 0 1px 1px rgba(255,255,255,0.75), inset 0 -3px 6px rgba(0,0,0,0.06);
  }
  .btn-store-cream:active { transform: translateY(1px); }

  .btn-store-red {
    background: linear-gradient(180deg, #9E181D 0%, #7a1115 100%);
    color: #FAF9F6;
    box-shadow: 0 0 0 1px rgba(158,24,29,0.35), 0 2px 4px rgba(0,0,0,0.6), 0 12px 24px -4px rgba(158,24,29,0.38), inset 0 1px 1px rgba(255,255,255,0.1), inset 0 -3px 6px rgba(0,0,0,0.55);
    transition: all 0.4s cubic-bezier(0.25,1,0.5,1);
  }
  .btn-store-red:hover {
    transform: translateY(-3px);
    background: linear-gradient(180deg, #c01f25 0%, #9E181D 100%);
    box-shadow: 0 0 0 1px rgba(158,24,29,0.45), 0 6px 12px -2px rgba(158,24,29,0.28), 0 20px 32px -6px rgba(158,24,29,0.48), inset 0 1px 1px rgba(255,255,255,0.12), inset 0 -3px 6px rgba(0,0,0,0.6);
  }
  .btn-store-red:active { transform: translateY(1px); }
`;

export interface CinematicAppHeroProps {
  className?: string;
  tagline1?: string;
  tagline2?: string;
  cardHeading?: string;
  cardDescription?: React.ReactNode;
  ctaHeading?: string;
  ctaDescription?: string;
  appStoreUrl?: string;
  playStoreUrl?: string;
}

export function CinematicAppHero({
  tagline1 = "Your coffee,",
  tagline2 = "on the go.",
  cardHeading = "Order ahead. Pick up fresh.",
  cardDescription = (
    <>
      The <span className="text-[#F1DFBA] font-semibold">Kado Kohi</span> app brings
      your favorite corner café to your pocket — browse the menu, order ahead, earn stamps,
      and never wait in line.
    </>
  ),
  ctaHeading = "Coming soon.",
  ctaDescription = "The Kado Kohi app is in the works. Be the first to know when we drop on iOS and Android.",
  appStoreUrl = "#",
  playStoreUrl = "#",
  className,
}: CinematicAppHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCardRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (window.scrollY > window.innerHeight * 2) return;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (!mainCardRef.current || !mockupRef.current) return;
        const r = mainCardRef.current.getBoundingClientRect();
        mainCardRef.current.style.setProperty("--mouse-x", `${e.clientX - r.left}px`);
        mainCardRef.current.style.setProperty("--mouse-y", `${e.clientY - r.top}px`);
        const xV = (e.clientX / window.innerWidth - 0.5) * 2;
        const yV = (e.clientY / window.innerHeight - 0.5) * 2;
        gsap.to(mockupRef.current, { rotationY: xV * 10, rotationX: -yV * 10, ease: "power3.out", duration: 1.2 });
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(rafRef.current); };
  }, []);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;

    const ctx = gsap.context(() => {
      gsap.set(".app-txt-track", { autoAlpha: 0, y: 50, scale: 0.9, filter: "blur(16px)" });
      /* Extra vertical inset so clip animation never shears descenders (g, y, etc.) */
      gsap.set(".app-txt-days", { autoAlpha: 1, clipPath: "inset(-0.14em 100% -0.14em 0)" });
      gsap.set(".app-main", { y: window.innerHeight + 200, autoAlpha: 1 });
      gsap.set([".app-cleft", ".app-cright", ".app-badge-el", ".app-pw"], { autoAlpha: 0 });
      /* Phone: faint teaser + slight tilt — card never reads as empty mid-scroll */
      gsap.set(".app-mockup", {
        autoAlpha: 0.28, y: 100, scale: 0.9, filter: "blur(5px)",
        rotationX: 22, rotationY: -14, z: -180,
      });
      gsap.set(".app-cta",       { autoAlpha: 0, scale: 0.8, filter: "blur(30px)" });

      // Entry animation — then remove clip-path so nothing stays clipped at rest
      gsap.timeline({ delay: 0.4 })
        .to(".app-txt-track", { duration: 1.6, autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", ease: "expo.out" })
        .to(".app-txt-days", { duration: 1.2, clipPath: "inset(-0.14em 0% -0.14em 0)", ease: "power4.inOut" }, "-=0.9")
        .set(".app-txt-days", { clipPath: "none" });

      // Scroll-pinned timeline — section stays locked until all phases finish
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=6000",
          pin: true,
          pinSpacing: true,
          // Reparent to <body> while pinned so no ancestor stacking context traps it
          pinReparent: true,
          scrub: 1.2,
          anticipatePin: 1,
        },
      });

      tl
        // Phase 1: text fades, card arrives
        .to([".app-hero-wrap", ".app-grid"], { scale: 1.1, filter: "blur(18px)", opacity: 0.12, ease: "power2.inOut", duration: 2 }, 0)
        .to(".app-main", { y: 0, ease: "power3.inOut", duration: 2 }, 0)
        // Phase 2: card goes fullscreen — overlap with phone so no "dead" fullscreen
        .to(".app-main", { width: "100%", height: "100%", borderRadius: "0px", ease: "power3.inOut", duration: 1.5 })
        // Phase 3: phone resolves from teaser → crisp (starts mid phase-2)
        .to(".app-mockup", {
          y: 0, z: 0, rotationX: 0, rotationY: 0, autoAlpha: 1, scale: 1, filter: "blur(0px)",
          ease: "expo.out", duration: 2,
        }, "-=1.05")
        // Phase 4: phone widgets stagger in
        .fromTo(".app-pw", { y: 30, autoAlpha: 0, scale: 0.95 }, { y: 0, autoAlpha: 1, scale: 1, stagger: 0.12, ease: "back.out(1.2)", duration: 1.4 }, "-=1.5")
        // Phase 5: floating badges + side text
        .fromTo(".app-badge-el", { y: 80, autoAlpha: 0, scale: 0.75, rotationZ: -8 }, { y: 0, autoAlpha: 1, scale: 1, rotationZ: 0, ease: "back.out(1.5)", duration: 1.4, stagger: 0.2 }, "-=1.8")
        .fromTo(".app-cleft",  { x: -40, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: "power4.out", duration: 1.4 }, "-=1.4")
        .fromTo(".app-cright", { x: 40, autoAlpha: 0, scale: 0.85 }, { x: 0, autoAlpha: 1, scale: 1, ease: "expo.out", duration: 1.4 }, "<")
        // Hold — let user see the full mockup
        .to({}, { duration: 3 })
        // Phase 6: swap to CTA
        .set(".app-hero-wrap", { autoAlpha: 0 })
        .set(".app-cta", { autoAlpha: 1 })
        .to({}, { duration: 1.5 })
        // Phase 7: mockup & text exit, card shrinks, CTA appears
        .to([".app-mockup", ".app-badge-el", ".app-cleft", ".app-cright"],
          { scale: 0.9, y: -30, z: -150, autoAlpha: 0, ease: "power3.in", duration: 1, stagger: 0.05 })
        .to(".app-main", {
          width:  isMobile ? "92vw" : "85vw",
          height: isMobile ? "92vh" : "85vh",
          borderRadius: isMobile ? "32px" : "40px",
          ease: "expo.inOut", duration: 1.8,
        }, "pullback")
        .to(".app-cta", { scale: 1, filter: "blur(0px)", ease: "expo.inOut", duration: 1.8 }, "pullback")
        // Hold CTA visible
        .to({}, { duration: 2 })
        // Phase 8: card exits upward
        .to(".app-main", { y: -(window.innerHeight + 300), ease: "power3.in", duration: 1.5 });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "cinematic-app-root relative w-full min-w-0 max-w-[100vw] h-svh min-h-svh overflow-hidden flex items-center justify-center bg-kado-dark font-sans antialiased",
        className
      )}
      style={{ perspective: "1500px", position: "relative", zIndex: 100 }}
    >
      <style>{`
        .cinematic-app-root { --phone-scale: 0.76; }
        @media (min-width: 640px) { .cinematic-app-root { --phone-scale: 0.86; } }
        @media (min-width: 1024px) { .cinematic-app-root { --phone-scale: 1; } }
      `}</style>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="app-grain" aria-hidden="true" />
      <div className="app-grid absolute inset-0 z-0 pointer-events-none opacity-50" aria-hidden="true" />

      {/* ── Background tagline ── */}
      <div className="app-hero-wrap absolute z-10 flex flex-col items-center justify-center text-center w-full max-w-[100vw] px-4 sm:px-6 will-change-transform gap-3 md:gap-4 pb-4">
        <h1 className="app-txt-track app-reveal app-text-warm font-display font-bold tracking-tight text-[clamp(3rem,10vw,7rem)] leading-[1.08] pb-0.5">
          {tagline1}
        </h1>
        <h1 className="app-txt-days app-reveal app-text-cream-grad font-display font-extrabold tracking-tighter text-[clamp(3rem,10vw,7rem)] leading-[1.12] pb-1">
          {tagline2}
        </h1>
      </div>

      {/* ── CTA layer ── */}
      <div className="app-cta absolute z-10 flex flex-col items-center justify-center text-center w-full max-w-[100vw] px-4 sm:px-6 app-reveal pointer-events-auto will-change-transform">
        <p className="text-kado-red text-[10px] font-bold tracking-[0.3em] uppercase mb-4">角 Kado Kohi App</p>
        <h2 className="app-text-cream-grad font-display text-[clamp(2.5rem,8vw,5rem)] font-bold mb-5 tracking-tight leading-[1.12] pb-1">
          {ctaHeading}
        </h2>
        <p className="text-[#F1DFBA]/72 text-base md:text-lg mb-10 max-w-lg mx-auto font-normal leading-relaxed">
          {ctaDescription}
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a href={appStoreUrl} aria-label="Download on the App Store"
            className="btn-store-cream flex items-center justify-center gap-3 px-7 py-3.5 rounded-2xl group focus:outline-none">
            <svg className="w-7 h-7 transition-transform group-hover:scale-105" fill="currentColor" viewBox="0 0 384 512" aria-hidden="true">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
            </svg>
            <div className="text-left">
              <div className="text-[9px] font-bold tracking-wider text-[#191919]/40 uppercase">Download on the</div>
              <div className="text-lg font-bold leading-none tracking-tight text-[#191919]">App Store</div>
            </div>
          </a>
          <a href={playStoreUrl} aria-label="Get it on Google Play"
            className="btn-store-red flex items-center justify-center gap-3 px-7 py-3.5 rounded-2xl group focus:outline-none">
            <svg className="w-6 h-6 transition-transform group-hover:scale-105" fill="currentColor" viewBox="0 0 512 512" aria-hidden="true">
              <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/>
            </svg>
            <div className="text-left">
              <div className="text-[9px] font-bold tracking-wider text-[#FAF9F6]/40 uppercase">Get it on</div>
              <div className="text-lg font-bold leading-none tracking-tight">Google Play</div>
            </div>
          </a>
        </div>
      </div>

      {/* ── Foreground card ── */}
      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none" style={{ perspective: "1500px" }}>
        <div
          ref={mainCardRef}
          className="app-main app-card relative overflow-hidden flex items-center justify-center pointer-events-auto w-[92vw] md:w-[85vw] h-[92vh] md:h-[85vh] rounded-[32px] md:rounded-[40px]"
        >
          {/* Always-on depth: never a flat empty card between scroll beats */}
          <div
            className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center"
            aria-hidden
          >
            <span className="font-display text-[min(42vw,18rem)] font-black text-white/[0.04] select-none leading-none">
              角
            </span>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[10px] font-semibold tracking-[0.35em] uppercase text-[#F1DFBA]/25">
              <span className="h-px w-8 bg-kado-red/30" />
              App preview
              <span className="h-px w-8 bg-kado-red/30" />
            </div>
          </div>
          <div className="app-sheen" aria-hidden="true" />

          {/* Desktop 3-col / mobile stacked — single valid className string */}
          <div
            className={cn(
              "relative z-10 h-full w-full",
              "flex flex-col items-center justify-center gap-4 px-4 py-6",
              "lg:mx-auto lg:grid lg:max-w-7xl lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-6 lg:px-12 lg:py-0"
            )}
          >

            {/* ① Brand name — desktop right only */}
            <div className="app-cright app-reveal hidden lg:flex justify-end z-20 w-full order-last">
              <h2 className="font-display text-[5rem] xl:text-[7rem] font-black uppercase tracking-tighter app-text-card-cream leading-[0.9] text-right">
                KADO<br />
                KOHI<br />
                APP
              </h2>
            </div>

            {/* ② iPhone mockup — always centred, fills available space */}
            <div className="app-mockup relative flex items-center justify-center z-10 order-first lg:order-none" style={{ perspective: "1000px" }}>
              {/*
                Fixed phone size (280×580). Scale it to fit the viewport:
                  mobile  → 80% (224×464)  keeps phone readable inside the card
                  tablet  → 88%
                  desktop → 100% (native)
                Using transform+origin avoids layout shifts.
              */}
              <div
                className="relative mx-auto"
                style={{
                  width: 280,
                  height: 580,
                  transform: "scale(var(--phone-scale, 0.76))",
                  transformOrigin: "center center",
                }}
              >

                {/* Badges live here — OUTSIDE overflow-hidden screen — so they're never clipped */}
                {/* Badge: Order ready (top-left of phone) */}
                <div className="app-badge-el app-badge hidden lg:flex absolute top-10 -left-[90px] rounded-2xl p-4 items-center gap-4 z-30 min-w-[170px]">
                  <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-lg"
                    style={{ background: "linear-gradient(135deg,rgba(158,24,29,0.22),rgba(158,24,29,0.06))", border: "1px solid rgba(158,24,29,0.28)" }}>
                    ☕
                  </div>
                  <div>
                    <p className="text-white text-xs font-bold tracking-tight">Order ready!</p>
                    <p className="text-[#F1DFBA]/40 text-[10px] font-medium">Pick up at counter</p>
                  </div>
                </div>

                {/* Badge: New item (bottom-right of phone) */}
                <div className="app-badge-el app-badge hidden lg:flex absolute bottom-20 -right-[90px] rounded-2xl p-4 items-center gap-4 z-30 min-w-[170px]">
                  <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-lg"
                    style={{ background: "linear-gradient(135deg,rgba(241,223,186,0.12),rgba(241,223,186,0.03))", border: "1px solid rgba(241,223,186,0.12)" }}>
                    ✨
                  </div>
                  <div>
                    <p className="text-white text-xs font-bold tracking-tight">New: Ube Shio</p>
                    <p className="text-[#F1DFBA]/40 text-[10px] font-medium">Limited seasonal drop</p>
                  </div>
                </div>

                {/* iPhone bezel */}
                <div
                  ref={mockupRef}
                  className="app-bezel absolute inset-0 rounded-[3rem] will-change-transform"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Side buttons */}
                  <div className="absolute top-[120px] -left-[3px] w-[3px] h-[25px] app-hw-btn rounded-l-md" aria-hidden="true" />
                  <div className="absolute top-[160px] -left-[3px] w-[3px] h-[45px] app-hw-btn rounded-l-md" aria-hidden="true" />
                  <div className="absolute top-[220px] -left-[3px] w-[3px] h-[45px] app-hw-btn rounded-l-md" aria-hidden="true" />
                  <div className="absolute top-[170px] -right-[3px] w-[3px] h-[70px] app-hw-btn rounded-r-md" style={{ transform: "scaleX(-1)" }} aria-hidden="true" />

                  {/* Screen — cream coffee shop UI */}
                  <div className="absolute inset-[7px] rounded-[2.5rem] overflow-hidden z-10" style={{ background: "#FAF9F6", boxShadow: "inset 0 0 12px rgba(0,0,0,0.15)" }}>
                    <div className="absolute inset-0 app-glare z-40 pointer-events-none" aria-hidden="true" />

                    {/* Dynamic Island */}
                    <div className="absolute top-[5px] left-1/2 -translate-x-1/2 w-[100px] h-[28px] bg-black rounded-full z-50 flex items-center justify-end px-3"
                      style={{ boxShadow: "inset 0 -1px 2px rgba(255,255,255,0.1)" }}>
                      <div className="w-1.5 h-1.5 rounded-full bg-[#9E181D] animate-pulse" style={{ boxShadow: "0 0 6px rgba(158,24,29,0.7)" }} />
                    </div>

                    <div className="relative w-full h-full pt-11 flex flex-col overflow-hidden">

                      {/* App header */}
                      <div className="app-pw px-5 pt-2 pb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "#9E181D" }}>
                            <span className="text-white text-[8px] font-black">角</span>
                          </div>
                          <span className="text-[10px] font-bold text-[#191919] tracking-tight">Kado Kohi</span>
                        </div>
                        <div className="w-7 h-7 rounded-full bg-[#F1DFBA] flex items-center justify-center">
                          <span className="text-[8px] font-bold text-[#191919]">JC</span>
                        </div>
                      </div>

                      {/* Promo banner */}
                      <div className="app-pw px-5 mb-3">
                        <p className="text-[10px] text-[#191919]/50 font-medium mb-1">Good morning, Juan!</p>
                        <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: "linear-gradient(135deg,#9E181D,#7a1115)" }}>
                          <div className="flex-1">
                            <p className="text-white text-[10px] font-bold mb-0.5">Free drink awaits!</p>
                            <p className="text-white/60 text-[8px]">2 more stamps to redeem</p>
                          </div>
                          <div className="flex gap-0.5 flex-shrink-0">
                            {Array(10).fill(0).map((_, i) => (
                              <div key={i} className="w-1.5 h-1.5 rounded-full"
                                style={{ background: i < 8 ? "#F1DFBA" : "rgba(255,255,255,0.25)" }} />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Category pills */}
                      <div className="app-pw flex gap-1.5 px-5 mb-3 overflow-x-hidden">
                        {["All", "Hot", "Iced", "Matcha", "Food"].map((cat, i) => (
                          <div key={cat} className="px-2.5 py-1 rounded-full text-[8px] font-bold whitespace-nowrap flex-shrink-0"
                            style={{ background: i === 0 ? "#191919" : "#F1DFBA", color: i === 0 ? "#FAF9F6" : "#191919" }}>
                            {cat}
                          </div>
                        ))}
                      </div>

                      {/* Product grid */}
                      <div className="app-pw flex-1 px-4 grid grid-cols-2 gap-2 overflow-hidden pb-14">
                        {[
                          { name: "Matcha Oat Latte", price: "₱185", img: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?q=80&w=200&auto=format&fit=crop" },
                          { name: "Iced Café Latte",  price: "₱165", img: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=200&auto=format&fit=crop" },
                          { name: "Español Con Leche", price: "₱155", img: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?q=80&w=200&auto=format&fit=crop" },
                          { name: "Ube Shio Karamel", price: "₱195", img: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=200&auto=format&fit=crop" },
                        ].map((p) => (
                          <div key={p.name} className="rounded-xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                            <div className="w-full aspect-square">
                              <img src={p.img} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                            </div>
                            <div className="p-2">
                              <p className="text-[9px] font-bold text-[#191919] truncate">{p.name}</p>
                              <p className="text-[8px] text-[#9E181D] font-bold">{p.price}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Bottom tab bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-12 flex items-center justify-around px-5"
                        style={{ background: "#FAF9F6", borderTop: "1px solid rgba(25,25,25,0.06)" }}>
                        {[
                          { label: "Home", active: true,  icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
                          { label: "Orders", active: false, icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
                          { label: "Rewards", active: false, icon: "M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" },
                          { label: "Profile", active: false, icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
                        ].map((t) => (
                          <div key={t.label} className="flex flex-col items-center gap-0.5">
                            <svg className="w-4 h-4" style={{ color: t.active ? "#9E181D" : "rgba(25,25,25,0.3)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={t.icon} />
                            </svg>
                            <span className="text-[6px] font-bold" style={{ color: t.active ? "#9E181D" : "rgba(25,25,25,0.3)" }}>{t.label}</span>
                          </div>
                        ))}
                      </div>

                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[100px] h-[3px] rounded-full bg-[#191919]/15" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ③ Description — desktop left, mobile below phone */}
            <div className="app-cleft app-reveal order-last lg:order-first flex flex-col justify-center text-center lg:text-left z-20 w-full max-w-xs lg:max-w-none">
              <p className="text-[#9E181D] text-[9px] font-bold tracking-[0.25em] uppercase mb-2 lg:mb-3">角 Coming Soon</p>
              <h3 className="text-white text-lg md:text-2xl lg:text-3xl font-bold mb-2 lg:mb-4 tracking-tight leading-snug">
                {cardHeading}
              </h3>
              <p className="text-[#F1DFBA]/45 text-sm lg:text-base font-normal leading-relaxed">
                {cardDescription}
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
