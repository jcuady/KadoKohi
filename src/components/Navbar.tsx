import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, User, Menu, X, LayoutDashboard, Coffee, Package, UserPlus, LogOut } from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useCartToggle } from '../hooks/useCartToggle';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import BrandWordmark from './BrandWordmark';
import { PublicSiteNavDesktop, PublicSiteNavMobile } from './nav/PublicSiteNavMenu';

function useAuthLink(): { label: string; path: string; icon: typeof User } {
  const user = useAuthStore((s) => s.user);
  if (!user) return { label: 'Sign in', path: '/auth/login', icon: User };
  if (user.role === 'admin') return { label: 'Admin', path: '/admin', icon: LayoutDashboard };
  if (user.role === 'barista') return { label: 'Kiosk', path: '/barista', icon: Coffee };
  if (user.role === 'staff') return { label: 'Staff', path: '/staff', icon: Package };
  return { label: 'My Account', path: '/account', icon: User };
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuTitleId = useId();

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const authLink = useAuthLink();
  const AuthIcon = authLink.icon;

  const cartItems = useCartStore((s) => s.items);
  const { toggleCart } = useCartToggle();
  const cartCount = useMemo(() => cartItems.reduce((sum, i) => sum + i.qty, 0), [cartItems]);

  const closeMobile = () => setMobileOpen(false);

  useBodyScrollLock(mobileOpen);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobile();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  return (
    <>
      <nav className="sticky top-0 z-[100] w-full border-b border-kado-dark/10 bg-kado-red text-kado-cream shadow-[0_1px_3px_rgba(0,0,0,0.12)] pt-safe-nav">
        <div className="mx-auto flex min-h-[3.25rem] max-w-7xl items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:min-h-14 lg:px-8">
          <Link
            to="/"
            className="group shrink-0 transition-opacity duration-200 hover:opacity-90"
            aria-label="Kado Kohi home"
          >
            <BrandWordmark variant="nav" />
          </Link>

          <button
            type="button"
            className="public-nav-icon-btn hidden max-xl:inline-flex"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileOpen}
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>

          <PublicSiteNavDesktop />

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={toggleCart}
              aria-label={cartCount > 0 ? `Cart — ${cartCount} items` : 'Cart'}
              className="public-nav-icon-btn relative"
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
                    className="absolute -top-0.5 -right-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-kado-cream px-[3px] text-[9px] font-bold leading-none text-kado-dark pointer-events-none"
                  >
                    {cartCount > 9 ? '9+' : cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {!user ? (
              <>
                <Link to="/auth/signup" className="public-nav-cta hidden xl:inline-flex">
                  <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
                  <span>Join</span>
                </Link>
                <Link to="/auth/login" className="public-nav-ghost hidden xl:inline-flex">
                  <User className="h-5 w-5 shrink-0" aria-hidden />
                  <span className="hidden xl:inline max-w-[7rem] truncate">Sign in</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to={authLink.path}
                  className="public-nav-ghost hidden xl:inline-flex max-w-[8rem]"
                >
                  <AuthIcon className="h-5 w-5 shrink-0" aria-hidden />
                  <span className="hidden xl:inline truncate">{authLink.label}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="public-nav-icon-btn"
                  aria-label="Sign out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            )}
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
              className="fixed inset-0 z-[110] bg-kado-dark/55 xl:hidden"
              onClick={closeMobile}
            />
            <motion.aside
              key="mobile-sidebar"
              role="dialog"
              aria-modal="true"
              aria-labelledby={mobileMenuTitleId}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="fixed top-0 right-0 z-[120] flex h-full w-[min(88vw,22rem)] flex-col bg-kado-red text-white shadow-2xl xl:hidden pt-safe-nav"
            >
              <h2 id={mobileMenuTitleId} className="sr-only">
                Main menu
              </h2>
              <div className="flex h-14 items-center justify-between border-b border-white/15 px-4">
                <Link to="/" onClick={closeMobile} className="shrink-0">
                  <BrandWordmark variant="sidebar" />
                </Link>
                <button
                  type="button"
                  onClick={closeMobile}
                  className="public-nav-icon-btn text-white/90"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
                <PublicSiteNavMobile onNavigate={closeMobile} />

                <div className="border-t border-white/15 pt-3">
                {!user ? (
                  <>
                    <Link
                      to="/auth/signup"
                      onClick={closeMobile}
                      className="public-nav-cta flex w-full min-h-[44px] justify-center"
                    >
                      <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
                      Join — create account
                    </Link>
                    <Link
                      to="/auth/login"
                      onClick={closeMobile}
                      className="public-nav-ghost mt-2 flex min-h-[44px] w-full justify-center text-white"
                    >
                      <User className="h-5 w-5" />
                      Sign in
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to={authLink.path}
                      onClick={closeMobile}
                      className="public-nav-ghost mt-2 flex min-h-[44px] w-full justify-center text-white"
                    >
                      <AuthIcon className="h-5 w-5" />
                      {authLink.label}
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        closeMobile();
                        void logout();
                      }}
                      className="public-nav-ghost mt-2 flex min-h-[44px] w-full justify-center text-white"
                    >
                      <LogOut className="h-5 w-5" />
                      Sign out
                    </button>
                  </>
                )}
                </div>
              </nav>

              <p className="kado-subtext border-t border-white/15 px-5 py-4 text-white/55 pb-safe">
                Japanese-inspired urban tambayan · Marikina
              </p>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
