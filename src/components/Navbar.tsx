import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, User, Menu, X, LayoutDashboard, Coffee, Package, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useCartToggle } from '../hooks/useCartToggle';
import { PUBLIC_SITE_NAV } from '../config/siteNav';
import BrandWordmark from './BrandWordmark';

function useAuthLink(): { label: string; path: string; icon: typeof User } {
  const user = useAuthStore((s) => s.user);
  if (!user) return { label: 'Sign in', path: '/auth/login', icon: User };
  if (user.role === 'admin') return { label: 'Admin', path: '/admin', icon: LayoutDashboard };
  if (user.role === 'barista') return { label: 'Kiosk', path: '/barista', icon: Coffee };
  if (user.role === 'staff') return { label: 'Staff', path: '/staff', icon: Package };
  return { label: 'My Account', path: '/account', icon: User };
}

const mobileNavLinkClass = (active: boolean) =>
  `kado-body rounded-xl px-4 py-3 font-medium transition-colors ${
    active
      ? 'bg-white text-kado-red'
      : 'text-white/90 hover:bg-white/10 hover:text-white'
  }`;

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const authLink = useAuthLink();
  const AuthIcon = authLink.icon;

  const cartItems = useCartStore((s) => s.items);
  const { toggleCart } = useCartToggle();
  const cartCount = useMemo(() => cartItems.reduce((sum, i) => sum + i.qty, 0), [cartItems]);

  return (
    <>
      <nav className="sticky top-0 z-[100] w-full border-b border-white/12 bg-kado-red text-white shadow-[0_1px_0_rgba(0,0,0,0.1)]">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="group shrink-0 transition-opacity duration-200 hover:opacity-90"
            aria-label="Kado Kohi home"
          >
            <BrandWordmark variant="nav" />
          </Link>

          <div className="hidden min-w-0 flex-1 justify-center lg:flex">
            <div className="inline-flex items-center gap-0.5 rounded-full border border-white/18 bg-white/8 px-1 py-1">
              {PUBLIC_SITE_NAV.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`kado-body-sm rounded-full px-3 py-1.5 font-medium transition-colors whitespace-nowrap ${
                    location.pathname === link.path
                      ? 'bg-white text-kado-red shadow-sm'
                      : 'text-white/92 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
            <button
              type="button"
              onClick={toggleCart}
              aria-label={cartCount > 0 ? `Cart — ${cartCount} items` : 'Cart'}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
            >
              <ShoppingBag className="h-5 w-5" />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                    className="absolute -top-0.5 -right-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-white px-[3px] text-[9px] font-bold leading-none text-kado-red pointer-events-none"
                  >
                    {cartCount > 9 ? '9+' : cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {!user && (
              <Link
                to="/auth/signup"
                className="hidden xl:inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 kado-label text-kado-red transition-colors hover:bg-kado-offwhite"
              >
                <UserPlus className="h-4 w-4 shrink-0" />
                <span>Join</span>
              </Link>
            )}
            <Link
              to={authLink.path}
              className="hidden h-10 items-center gap-1.5 rounded-full px-2.5 kado-body font-medium text-white transition-colors hover:bg-white/10 lg:inline-flex"
            >
              <AuthIcon className="h-5 w-5 shrink-0" />
              <span className="max-w-[7rem] truncate xl:max-w-none">{authLink.label}</span>
            </Link>

            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[110] bg-kado-dark/55 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              key="mobile-sidebar"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="fixed top-0 right-0 z-[120] flex h-full w-[min(88vw,20rem)] flex-col bg-kado-red text-white shadow-2xl lg:hidden"
            >
              <div className="flex h-14 items-center justify-between border-b border-white/15 px-4">
                <Link to="/" onClick={() => setMobileOpen(false)} className="shrink-0">
                  <BrandWordmark variant="sidebar" />
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/10"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
                {PUBLIC_SITE_NAV.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileOpen(false)}
                    className={mobileNavLinkClass(location.pathname === link.path)}
                  >
                    {link.label}
                  </Link>
                ))}

                <div className="my-3 border-t border-white/15" />

                {!user && (
                  <Link
                    to="/auth/signup"
                    onClick={() => setMobileOpen(false)}
                    className="kado-label flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-kado-red"
                  >
                    <UserPlus className="h-5 w-5" />
                    Join — create account
                  </Link>
                )}
                <Link
                  to={authLink.path}
                  onClick={() => setMobileOpen(false)}
                  className={`${mobileNavLinkClass(false)} flex items-center gap-2`}
                >
                  <AuthIcon className="h-5 w-5" />
                  {authLink.label}
                </Link>
              </nav>

              <p className="kado-subtext border-t border-white/15 px-5 py-4 text-white/55">
                Japanese-inspired urban tambayan · Marikina
              </p>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
