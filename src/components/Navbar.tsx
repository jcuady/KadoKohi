import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, User, Menu, X, LayoutDashboard, Coffee, Package, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Coffee', path: '/menu' },
  { label: 'Merch', path: '/merch' },
  { label: 'Book Booth', path: '/book/booth' },
  { label: 'Branches', path: '/branches' },
  { label: 'Events', path: '/events' },
  { label: 'About Us', path: '/about' },
  { label: 'Contact Us', path: '/contact' },
];

function useAuthLink(): { label: string; path: string; icon: typeof User } {
  const user = useAuthStore((s) => s.user);
  if (!user) return { label: 'Sign in', path: '/auth/login', icon: User };
  if (user.role === 'admin') return { label: 'Admin', path: '/admin', icon: LayoutDashboard };
  if (user.role === 'barista') return { label: 'Kiosk', path: '/barista', icon: Coffee };
  if (user.role === 'staff') return { label: 'Staff', path: '/staff', icon: Package };
  return { label: 'My Account', path: '/account', icon: User };
}

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const authLink = useAuthLink();
  const AuthIcon = authLink.icon;

  // Cart count — stable selector (no method call, raw array)
  const cartItems = useCartStore((s) => s.items);
  const toggleCart = useCartStore((s) => s.toggleCart);
  const cartCount = useMemo(() => cartItems.reduce((sum, i) => sum + i.qty, 0), [cartItems]);

  return (
    <nav className="sticky top-0 z-[100] w-full overflow-visible border-b border-kado-dark/10 bg-kado-cream/88 backdrop-blur-xl supports-[backdrop-filter]:bg-kado-cream/75 shadow-[0_1px_0_rgba(25,25,25,0.04)]">
      <div className="max-w-7xl mx-auto overflow-visible px-4 sm:px-6 lg:px-8 py-3.5 md:py-4 flex items-center justify-between gap-3 md:gap-4 relative text-kado-dark min-h-[3.5rem] md:min-h-[3.75rem]">

        {/* Logo — max-height only (no fixed h-*) so macrons / ascenders in Logo1.png are never cropped */}
        <Link
          to="/"
          className="flex items-center gap-3 md:gap-3.5 group shrink-0 min-w-0 pr-2 isolate overflow-visible py-0.5"
        >
          <div className="w-10 h-10 md:w-11 md:h-11 shrink-0 bg-kado-red text-kado-cream flex items-center justify-center font-display font-bold text-lg md:text-xl rounded-sm group-hover:scale-[1.03] transition-transform duration-300">
            角
          </div>
          <span className="inline-flex items-center overflow-visible self-center">
            <img
              src="/logo/Logo1.png"
              alt="Kado Kohi"
              decoding="async"
              className="relative z-10 block h-auto w-auto max-h-9 md:max-h-10 lg:max-h-11 max-w-[min(200px,42vw)] object-contain object-left mix-blend-multiply contrast-[1.08]"
            />
          </span>
        </Link>

        {/* Desktop nav pill */}
        <div className="hidden lg:flex items-center gap-1 bg-kado-offwhite/80 backdrop-blur-md px-2 py-1.5 xl:px-3 xl:py-2 rounded-full border border-kado-dark/10 shadow-sm">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-[12px] xl:text-sm font-medium transition-colors whitespace-nowrap px-2.5 xl:px-3 py-1.5 xl:py-2 rounded-full ${
                location.pathname === link.path
                  ? 'bg-kado-dark text-kado-cream'
                  : 'text-kado-dark/80 hover:text-kado-red'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {/* Cart button with count badge */}
          <button
            type="button"
            onClick={toggleCart}
            aria-label={cartCount > 0 ? `Cart — ${cartCount} items` : 'Cart'}
            className="relative p-1.5 hover:text-kado-red transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  key="badge"
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                  className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] bg-kado-red text-kado-cream text-[9px] font-bold rounded-full flex items-center justify-center px-[3px] pointer-events-none leading-none"
                >
                  {cartCount > 9 ? '9+' : cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Customer signup + auth */}
          {!user && (
            <Link
              to="/auth/signup"
              className="hidden xl:inline-flex items-center gap-1.5 rounded-full border-2 border-kado-dark/12 bg-kado-offwhite/90 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-kado-dark hover:border-kado-red hover:text-kado-red transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              <span>Join</span>
            </Link>
          )}
          <Link
            to={authLink.path}
            className="hover:text-kado-red transition-colors hidden lg:flex items-center gap-1.5 text-sm font-medium"
          >
            <AuthIcon className="w-5 h-5" />
            <span className="hidden lg:inline">{authLink.label}</span>
          </Link>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden hover:text-kado-red transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="absolute top-full left-0 right-0 bg-kado-cream/97 backdrop-blur-lg border-b border-kado-dark/10 p-5 flex flex-col gap-1 lg:hidden shadow-lg z-10"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={`text-base font-medium transition-colors py-2.5 px-4 rounded-xl ${
                    location.pathname === link.path
                      ? 'bg-kado-dark text-kado-cream'
                      : 'hover:bg-kado-dark/6 hover:text-kado-red'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <div className="my-1 border-t border-kado-dark/10" />

              {!user && (
                <Link
                  to="/auth/signup"
                  onClick={() => setMobileOpen(false)}
                  className="text-base font-medium py-2.5 px-4 rounded-xl bg-kado-dark text-kado-cream flex items-center gap-2 justify-center font-bold uppercase tracking-wider text-xs"
                >
                  <UserPlus className="w-5 h-5" />
                  Join — create account
                </Link>
              )}
              <Link
                to={authLink.path}
                onClick={() => setMobileOpen(false)}
                className="text-base font-medium py-2.5 px-4 rounded-xl hover:bg-kado-dark/6 hover:text-kado-red flex items-center gap-2"
              >
                <AuthIcon className="w-5 h-5" />
                {authLink.label}
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
