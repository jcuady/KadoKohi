import type { ReactNode } from 'react';
import { Coffee, Gift, MapPin, Sparkles, Check } from 'lucide-react';
import AuthBrandMark from './AuthBrandMark';

const loginPerks = [
  { icon: Gift, text: 'Kado Circle stamps', full: 'Track Kado Circle stamps and rewards' },
  { icon: Coffee, text: 'Order history', full: 'View order history and pickup status' },
  { icon: MapPin, text: 'Every branch', full: 'One account for every branch' },
] as const;

const signupPerks = [
  {
    icon: Gift,
    title: 'Kado Circle stamps',
    body: 'Earn one stamp per drink — your 10th drink is on us.',
  },
  {
    icon: Coffee,
    title: 'Order from the menu',
    body: 'Pick your branch at checkout; we route orders to the right bar.',
  },
  {
    icon: MapPin,
    title: 'Every branch',
    body: 'One account for all locations.',
  },
] as const;

type Props = {
  variant: 'login' | 'signup';
  children: ReactNode;
};

export default function CustomerAuthLayout({ variant, children }: Props) {
  const isLogin = variant === 'login';

  return (
    <div className="customer-surface min-h-dvh flex flex-col bg-kado-offwhite lg:flex-row">
      <div className="lg:hidden bg-kado-dark text-kado-cream px-4 pb-5 pt-[max(1rem,env(safe-area-inset-top))]">
        <AuthBrandMark variant="customer" onDark />
        <p className="mt-3 text-sm text-kado-cream/75 leading-relaxed max-w-md">
          {isLogin
            ? 'Your coffee, your rewards — sign in to manage orders and stamps.'
            : 'Join Kado Circle and order from any branch.'}
        </p>
        {isLogin ? (
          <ul className="mt-4 flex gap-2 overflow-x-auto pb-0.5 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {loginPerks.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="snap-start shrink-0 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-kado-cream/90"
              >
                <Icon className="w-3.5 h-3.5 text-kado-red" aria-hidden />
                {text}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-kado-red">
            <Sparkles className="w-3.5 h-3.5" aria-hidden />
            Free to join
          </p>
        )}
      </div>

      <aside className="hidden lg:flex lg:w-[42%] xl:w-[40%] shrink-0 flex-col justify-between bg-kado-dark text-kado-cream px-10 xl:px-12 py-12">
        <div>
          {isLogin ? (
            <>
              <AuthBrandMark variant="customer" onDark />
              <h2 className="font-display text-3xl xl:text-4xl font-bold mt-10 leading-tight">
                Your coffee,
                <br />
                your rewards.
              </h2>
              <p className="text-sm text-kado-cream/70 mt-4 max-w-sm leading-relaxed">
                Sign in to manage orders, stamps, vouchers, and booth bookings in one place.
              </p>
              <ul className="mt-10 space-y-4">
                {loginPerks.map(({ icon: Icon, full }) => (
                  <li key={full} className="flex items-start gap-3 text-sm text-kado-cream/85">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-kado-red/20 text-kado-red">
                      <Icon className="w-4 h-4" aria-hidden />
                    </span>
                    {full}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <p className="flex items-center gap-2 text-kado-red">
                <Sparkles className="w-5 h-5" aria-hidden />
                <span className="text-[10px] font-black uppercase tracking-[0.22em]">Kado Circle</span>
              </p>
              <h2 className="font-display text-3xl xl:text-4xl font-bold mt-8 leading-tight">
                Start earning
                <br />
                with every cup.
              </h2>
              <ul className="mt-10 space-y-5">
                {signupPerks.map(({ icon: Icon, title, body }) => (
                  <li key={title} className="flex gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-kado-red/20 text-kado-red">
                      <Icon className="w-4 h-4" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-kado-cream">{title}</p>
                      <p className="text-xs text-kado-cream/70 mt-0.5 leading-relaxed">{body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-kado-cream/40 flex items-center gap-1.5">
          {isLogin ? (
            'Kado Kohi · Customer account'
          ) : (
            <>
              <Check className="w-3.5 h-3.5" aria-hidden /> Free to join
            </>
          )}
        </p>
      </aside>

      <main className="flex-1 flex items-start lg:items-center justify-center px-4 sm:px-6 py-8 sm:py-10 lg:py-16 lg:px-12 bg-kado-cream">
        <div className="w-full max-w-md mx-auto lg:max-w-none">{children}</div>
      </main>
    </div>
  );
}
