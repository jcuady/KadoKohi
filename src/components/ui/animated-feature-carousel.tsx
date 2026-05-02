import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type CSSProperties,
  type ReactNode,
} from "react";
import clsx from "clsx";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  type MotionStyle,
  type MotionValue,
} from "motion/react";

// ─── Types ────────────────────────────────────────────────────────────────────

type WrapperStyle = MotionStyle & {
  "--x": MotionValue<string>;
  "--y": MotionValue<string>;
};

interface Step {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: string;
  visual: ReactNode;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useNumberCycler(total: number, interval = 6000) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setCurrent((p) => (p + 1) % total), interval);
    return () => clearTimeout(id);
  }, [current, total, interval]);

  const setStep = useCallback((i: number) => setCurrent(i % total), [total]);
  return { current, setStep };
}

function useIsMobile() {
  const [is, setIs] = useState(false);
  useEffect(() => {
    const check = () => setIs(window.matchMedia("(max-width: 768px)").matches);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return is;
}

// ─── Step visuals (Kado Kohi ordering flows) ─────────────────────────────────

function VisualInStore() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Counter mockup */}
      <div className="absolute right-0 top-[5%] w-[68%] rounded-2xl overflow-hidden shadow-2xl shadow-black/30 border border-kado-cream/10">
        <img
          src="https://images.unsplash.com/photo-1453614512568-c4024d13c247?q=80&w=900&auto=format&fit=crop"
          alt="Barista at the counter"
          className="w-full h-48 object-cover"
        />
        <div className="bg-[#FAF9F6] p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded bg-kado-red flex items-center justify-center">
              <span className="text-white text-[7px] font-black">角</span>
            </div>
            <span className="text-[11px] font-bold text-kado-dark tracking-tight">Kado Counter</span>
          </div>
          <div className="space-y-2">
            {[
              { name: "Matcha Oat Latte", price: "₱185" },
              { name: "Iced Café Latte",  price: "₱165" },
            ].map((i) => (
              <div key={i.name} className="flex justify-between items-center py-1.5 border-b border-kado-dark/8 last:border-0">
                <span className="text-[10px] text-kado-dark font-medium">{i.name}</span>
                <span className="text-[10px] text-kado-red font-bold">{i.price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* POS receipt stub */}
      <div className="absolute bottom-[8%] left-0 w-[42%] bg-[#FAF9F6] rounded-xl shadow-xl border border-kado-dark/10 p-4">
        <p className="text-[9px] font-black uppercase tracking-widest text-kado-dark/40 mb-2">Order #042</p>
        <div className="space-y-1 mb-3">
          <div className="flex justify-between text-[10px] text-kado-dark">
            <span>Matcha Latte</span><span className="font-bold">₱185</span>
          </div>
          <div className="flex justify-between text-[10px] text-kado-dark">
            <span>Ube Shio</span><span className="font-bold">₱195</span>
          </div>
        </div>
        <div className="border-t border-dashed border-kado-dark/20 pt-2 flex justify-between">
          <span className="text-[9px] font-bold text-kado-dark/50">TOTAL</span>
          <span className="text-[11px] font-black text-kado-red">₱380</span>
        </div>
      </div>
    </div>
  );
}

function VisualOnlineOrder() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Browser chrome */}
      <div className="absolute right-0 top-[2%] w-[72%] rounded-2xl overflow-hidden shadow-2xl border border-kado-dark/10">
        <div className="bg-kado-dark/90 px-3 py-2 flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500/80" />
            <div className="w-2 h-2 rounded-full bg-yellow-500/80" />
            <div className="w-2 h-2 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 bg-kado-dark/60 rounded-full px-3 py-0.5">
            <span className="text-[8px] text-white/40 font-mono">kado-kohi.com/menu</span>
          </div>
        </div>
        <div className="bg-[#FAF9F6] p-4">
          <div className="flex gap-1.5 mb-3">
            {["All", "Hot", "Iced", "Matcha"].map((c, i) => (
              <span key={c} className="px-2 py-0.5 rounded-full text-[8px] font-bold"
                style={{ background: i === 0 ? "#9E181D" : "#F1DFBA", color: i === 0 ? "#fff" : "#191919" }}>
                {c}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { n: "Matcha Oat Latte", p: "₱185", img: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?q=80&w=200&auto=format&fit=crop" },
              { n: "Iced Café Latte",  p: "₱165", img: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=200&auto=format&fit=crop" },
            ].map((p) => (
              <div key={p.n} className="rounded-xl overflow-hidden bg-white shadow-sm border border-kado-dark/5">
                <img src={p.img} alt={p.n} className="w-full h-16 object-cover" />
                <div className="p-2">
                  <p className="text-[9px] font-bold text-kado-dark truncate">{p.n}</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-[9px] text-kado-red font-bold">{p.p}</p>
                    <button className="w-4 h-4 rounded-full bg-kado-red flex items-center justify-center text-white text-[10px] font-bold leading-none">+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart summary pill */}
      <div className="absolute bottom-[10%] left-0 bg-kado-dark text-kado-cream rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3">
        <div className="w-8 h-8 bg-kado-red rounded-xl flex items-center justify-center text-sm">🛍</div>
        <div>
          <p className="text-[9px] font-bold text-kado-cream/50 uppercase tracking-wider">Cart</p>
          <p className="text-[11px] font-black text-kado-cream">2 items · ₱350</p>
        </div>
        <div className="ml-auto bg-kado-red text-white text-[8px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg">Order</div>
      </div>
    </div>
  );
}

function VisualQROrder() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Table card with QR */}
      <div className="absolute right-[5%] top-[4%] w-[56%] bg-[#FAF9F6] rounded-2xl shadow-2xl border border-kado-dark/10 overflow-hidden">
        <div className="bg-kado-dark p-4 flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-kado-red flex items-center justify-center">
            <span className="text-white text-[8px] font-black">角</span>
          </div>
          <div>
            <p className="text-kado-cream text-[10px] font-black tracking-tight">TABLE 5</p>
            <p className="text-kado-cream/40 text-[8px]">Scan to order</p>
          </div>
        </div>
        <div className="p-4 flex flex-col items-center">
          {/* Stylised QR grid */}
          <div className="w-28 h-28 bg-white rounded-xl p-2 shadow-inner border border-kado-dark/10 mb-2">
            <div className="w-full h-full"
              style={{
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96'%3E%3Crect width='96' height='96' fill='white'/%3E%3Crect x='4' y='4' width='32' height='32' fill='none' stroke='%23191919' stroke-width='4'/%3E%3Crect x='12' y='12' width='16' height='16' fill='%239E181D'/%3E%3Crect x='60' y='4' width='32' height='32' fill='none' stroke='%23191919' stroke-width='4'/%3E%3Crect x='68' y='12' width='16' height='16' fill='%239E181D'/%3E%3Crect x='4' y='60' width='32' height='32' fill='none' stroke='%23191919' stroke-width='4'/%3E%3Crect x='12' y='68' width='16' height='16' fill='%239E181D'/%3E%3Crect x='44' y='4' width='4' height='4' fill='%23191919'/%3E%3Crect x='44' y='20' width='8' height='4' fill='%23191919'/%3E%3Crect x='52' y='36' width='4' height='8' fill='%23191919'/%3E%3Crect x='44' y='44' width='12' height='4' fill='%23191919'/%3E%3Crect x='60' y='44' width='4' height='12' fill='%23191919'/%3E%3Crect x='68' y='52' width='12' height='4' fill='%23191919'/%3E%3Crect x='76' y='60' width='4' height='12' fill='%23191919'/%3E%3Crect x='52' y='68' width='8' height='4' fill='%23191919'/%3E%3Crect x='44' y='76' width='4' height='16' fill='%23191919'/%3E%3Crect x='60' y='76' width='12' height='4' fill='%23191919'/%3E%3C/svg%3E\")",
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
              }}
            />
          </div>
          <p className="text-[8px] text-kado-dark/40 font-medium text-center">Point your camera here</p>
        </div>
      </div>

      {/* Mobile scan result */}
      <div className="absolute bottom-[6%] left-0 w-[50%] bg-kado-dark rounded-2xl overflow-hidden shadow-xl">
        <img src="https://images.unsplash.com/photo-1521017432531-fbd92d768814?q=80&w=400&auto=format&fit=crop"
          alt="Coffee shop table" className="w-full h-16 object-cover opacity-60" />
        <div className="p-3">
          <p className="text-kado-red text-[8px] font-bold uppercase tracking-widest mb-0.5">Table 5 · Dine In</p>
          <p className="text-kado-cream text-[10px] font-bold">Menu loaded!</p>
          <p className="text-kado-cream/40 text-[8px] mt-0.5">Ready to take your order</p>
        </div>
      </div>
    </div>
  );
}

function VisualLoyalty() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Loyalty card */}
      <div className="absolute right-0 top-[4%] w-[68%] rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "linear-gradient(135deg,#9E181D 0%,#4a0d10 100%)" }}>
        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-kado-cream/50 text-[8px] font-bold uppercase tracking-[0.25em]">Kado Circle</p>
              <p className="text-kado-cream text-base font-black tracking-tight">Juan Cruz</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-kado-cream/10 border border-kado-cream/20 flex items-center justify-center">
              <span className="text-kado-cream text-sm font-black">角</span>
            </div>
          </div>
          <p className="text-kado-cream/40 text-[8px] uppercase tracking-widest mb-2">Stamps collected</p>
          <div className="grid grid-cols-5 gap-1.5">
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className="w-full aspect-square rounded-full flex items-center justify-center"
                style={{
                  background: i < 8 ? "rgba(241,223,186,0.9)" : "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(241,223,186,0.2)",
                }}>
                {i < 8 && <span className="text-kado-red text-[8px] font-black">角</span>}
              </div>
            ))}
          </div>
          <p className="text-kado-cream/50 text-[8px] mt-3">2 more stamps · Free drink awaits!</p>
        </div>
      </div>

      {/* Push notification */}
      <div className="absolute bottom-[8%] left-0 bg-white rounded-2xl p-3 shadow-2xl border border-kado-dark/8 flex items-center gap-3 w-[52%]">
        <div className="w-9 h-9 rounded-xl bg-kado-red flex items-center justify-center flex-shrink-0">
          <span className="text-kado-cream text-base">🎉</span>
        </div>
        <div>
          <p className="text-kado-dark text-[9px] font-black">Congrats! Free drink earned</p>
          <p className="text-kado-dark/40 text-[8px]">Redeem at any Kado branch</p>
        </div>
      </div>
    </div>
  );
}

// ─── Steps data ───────────────────────────────────────────────────────────────

const STEPS: readonly Step[] = [
  {
    id: "1",
    eyebrow: "Walk In",
    title: "Order at the counter.",
    description:
      "Pull up, pick your poison. Walk in to any branch, browse the board, and tell your barista exactly how you want it. Every cup is pulled fresh for you.",
    icon: "☕",
    visual: <VisualInStore />,
  },
  {
    id: "2",
    eyebrow: "Order Online",
    title: "Order from the web.",
    description:
      "Browse the full menu, customise your drink, and place your order before you even arrive. Skip the queue — your name's already on the cup.",
    icon: "🌐",
    visual: <VisualOnlineOrder />,
  },
  {
    id: "3",
    eyebrow: "Dine In",
    title: "Scan the table QR.",
    description:
      "Every table has a Kado QR. Scan it with your camera, browse the menu, and order right from your seat — no app download required.",
    icon: "📷",
    visual: <VisualQROrder />,
  },
  {
    id: "4",
    eyebrow: "Kado Circle",
    title: "Earn loyalty rewards.",
    description:
      "Every order earns a stamp on your Kado Circle card. Collect 10 stamps and your next drink is on us — then start all over again.",
    icon: "🏆",
    visual: <VisualLoyalty />,
  },
];

// ─── Inner card with mouse-tracking sheen ─────────────────────────────────────

function FeatureCard({ children, step }: { children: ReactNode; step: number }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const isMobile = useIsMobile();
  const cardRef = useRef<HTMLDivElement>(null);

  function handleMouseMove({ clientX, clientY }: MouseEvent) {
    if (isMobile || !cardRef.current) return;
    const { left, top } = cardRef.current.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      ref={cardRef}
      className="group relative w-full rounded-3xl"
      onMouseMove={handleMouseMove}
      style={
        {
          "--x": useMotionTemplate`${mouseX}px`,
          "--y": useMotionTemplate`${mouseY}px`,
        } as WrapperStyle
      }
    >
      {/* Sheen overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(400px circle at var(--x, 50%) var(--y, 50%), rgba(158,24,29,0.07) 0%, transparent 60%)",
        }}
      />

      <div className="relative w-full overflow-hidden rounded-3xl border border-kado-dark/10 bg-[#FAF9F6] shadow-sm">
        <div className="flex flex-col md:flex-row min-h-0 md:min-h-[380px]">

          {/* Left: text */}
          <div className="flex flex-col justify-center p-6 sm:p-8 md:p-10 md:w-[44%] shrink-0 gap-4 sm:gap-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col gap-4"
              >
                <motion.div
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="text-xl">{STEPS[step].icon}</span>
                  <span className="text-kado-red text-[10px] font-black uppercase tracking-[0.25em]">
                    {STEPS[step].eyebrow}
                  </span>
                </motion.div>

                <motion.h3
                  className="font-display text-2xl md:text-3xl font-bold text-kado-dark leading-tight tracking-tight"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  {STEPS[step].title}
                </motion.h3>

                <motion.p
                  className="text-kado-dark/65 text-sm md:text-base leading-relaxed"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.14, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  {STEPS[step].description}
                </motion.p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: visual */}
          <div className="relative flex-1 bg-kado-dark/[0.03] border-t md:border-t-0 md:border-l border-kado-dark/8 overflow-hidden min-h-[220px] sm:min-h-[260px] md:min-h-0">
            {/* Corner kanji watermark */}
            <span className="pointer-events-none absolute -bottom-4 -right-2 font-display text-[8rem] font-black text-kado-dark/[0.04] leading-none select-none">
              角
            </span>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                className="absolute inset-0 p-6"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>
    </motion.div>
  );
}

// ─── Step nav ─────────────────────────────────────────────────────────────────

function StepNav({ current, onChange }: { current: number; onChange: (i: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {STEPS.map((s, i) => {
        const done = current > i;
        const active = current === i;
        return (
          <motion.button
            key={s.id}
            type="button"
            onClick={() => onChange(i)}
            animate={active ? { scale: 1, opacity: 1 } : { scale: 0.93, opacity: 0.7 }}
            transition={{ duration: 0.25 }}
            className={clsx(
              "flex items-center gap-2 rounded-full px-4 py-2.5 min-h-[44px] text-xs font-bold transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-kado-red focus-visible:ring-offset-2",
              active
                ? "bg-kado-dark text-kado-cream"
                : "bg-kado-dark/8 text-kado-dark hover:bg-kado-dark/14"
            )}
          >
            {/* Step number/check */}
            <span
              className={clsx(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black transition-all duration-300",
                done
                  ? "bg-kado-red text-white"
                  : active
                  ? "bg-kado-red text-white"
                  : "bg-kado-dark/15 text-kado-dark/60"
              )}
            >
              {done ? "✓" : i + 1}
            </span>
            <span className="hidden sm:inline">{s.eyebrow}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step, total, interval }: { step: number; total: number; interval: number }) {
  return (
    <div className="flex gap-1.5">
      {Array(total)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="h-[2px] flex-1 rounded-full bg-kado-dark/10 overflow-hidden">
            <motion.div
              className="h-full bg-kado-red origin-left"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: step === i ? 1 : step > i ? 1 : 0 }}
              transition={
                step === i
                  ? { duration: interval / 1000, ease: "linear" }
                  : { duration: 0.25 }
              }
            />
          </div>
        ))}
    </div>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────

export function KadoOrderingCarousel({ className }: { className?: string }) {
  const INTERVAL = 6000;
  const { current, setStep } = useNumberCycler(STEPS.length, INTERVAL);

  return (
    <section
      className={clsx(
        "py-14 sm:py-20 md:py-24 px-4 sm:px-6 md:px-12 lg:px-24 w-full min-w-0 bg-kado-offwhite border-t border-kado-dark/8",
        className
      )}
    >
      <div className="max-w-[1100px] mx-auto flex flex-col gap-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
          <div>
            <span className="text-kado-red font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
              How it works
            </span>
            <h2 className="font-display text-[clamp(1.75rem,5.5vw,3.75rem)] md:text-5xl lg:text-6xl font-bold text-kado-dark leading-tight">
              Order your way.
            </h2>
          </div>
          <p className="text-kado-dark/55 font-medium max-w-sm text-sm md:text-base hidden md:block leading-relaxed">
            Walk in, order online, or scan a table QR — then collect stamps every time.
          </p>
        </div>
        <p className="text-kado-dark/55 text-sm leading-relaxed md:hidden -mt-2">
          In-store, online, QR at your table — earn stamps every visit.
        </p>

        {/* Progress */}
        <ProgressBar step={current} total={STEPS.length} interval={INTERVAL} />

        {/* Card */}
        <FeatureCard step={current}>
          {STEPS[current].visual}
        </FeatureCard>

        {/* Nav */}
        <StepNav current={current} onChange={setStep} />

      </div>
    </section>
  );
}
