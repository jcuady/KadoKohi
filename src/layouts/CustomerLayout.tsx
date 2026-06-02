import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, ShoppingBag, Menu, X, ChevronRight, Home } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useCartToggle } from '../hooks/useCartToggle';
import CartDrawer from '../components/CartDrawer';
import { PUBLIC_SITE_NAV } from '../config/siteNav';
import { ACCOUNT_NAV } from '../config/accountNav';

export default function CustomerLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const cartItems = useCartStore((s) => s.items);
  const { toggleCart } = useCartToggle();
  const cartCount = useMemo(() => cartItems.reduce((sum, i) => sum + i.qty, 0), [cartItems]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const currentPage = ACCOUNT_NAV.find((n) =>
    n.end ? location.pathname === n.to : location.pathname.startsWith(n.to),
  );

  const accountNavLinkClass = (isActive: boolean) =>
    `flex items-center gap-2 rounded-full px-5 py-2.5 text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-200 ${
      isActive
        ? 'bg-kado-dark text-white shadow-lg shadow-kado-dark/10'
        : 'bg-white border border-kado-dark/10 text-kado-dark/60 hover:border-kado-red/30 hover:text-kado-red hover:shadow-sm'
    }`;

  const mobileAccountLinkClass = (isActive: boolean) =>
    `text-sm font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 ${
      isActive ? 'bg-kado-dark text-white' : 'text-kado-dark/70 hover:text-kado-red'
    }`;

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col selection:bg-kado-red selection:text-white">
      <nav className="sticky top-0 z-[100] w-full border-b border-kado-dark/10 bg-kado-cream/88 backdrop-blur-xl supports-[backdrop-filter]:bg-kado-cream/75 shadow-[0_1px_0_rgba(25,25,25,0.04)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-3.5 flex items-center justify-between gap-4 relative min-h-[3.5rem]">
          <Link to="/" className="flex items-center gap-3 group shrink-0 pr-2 overflow-visible py-0.5">
            <div className="w-9 h-9 md:w-10 md:h-10 shrink-0 bg-kado-red text-kado-cream flex items-center justify-center font-display font-bold text-lg rounded-sm group-hover:scale-[1.03] transition-transform duration-300">
              角
            </div>
            <span className="inline-flex items-center overflow-visible self-center">
              <img
                src="/logo/Logo1.png"
                alt="Kado Kohi"
                decoding="async"
                className="relative z-10 block h-auto w-auto max-h-8 md:max-h-9 max-w-[min(180px,38vw)] object-contain object-left mix-blend-multiply contrast-[1.08]"
              />
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1 bg-kado-offwhite/80 backdrop-blur-md px-2 py-1.5 rounded-full border border-kado-dark/10 shadow-sm">
            {PUBLIC_SITE_NAV.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-[12px] font-medium transition-colors whitespace-nowrap px-3 py-1.5 rounded-full text-kado-dark/70 hover:text-kado-red"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={toggleCart}
              aria-label={cartCount > 0 ? `Cart — ${cartCount} items` : 'Cart'}
              className="relative p-1.5 text-kado-dark hover:text-kado-red transition-colors"
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
                    className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] bg-kado-red text-white text-[9px] font-bold rounded-full flex items-center justify-center px-[3px] pointer-events-none leading-none"
                  >
                    {cartCount > 9 ? '9+' : cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs text-kado-dark/60">
              <div className="w-7 h-7 rounded-full bg-kado-dark text-white flex items-center justify-center font-bold text-[10px] uppercase">
                {user?.name?.charAt(0) ?? 'U'}
              </div>
              <span className="font-bold hidden md:block">{user?.name}</span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-kado-red hover:text-kado-dark transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>

            <button
              className="lg:hidden text-kado-dark hover:text-kado-red transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                key="mobile-menu"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="absolute top-full left-0 right-0 bg-kado-cream/97 backdrop-blur-lg border-b border-kado-dark/10 p-5 flex flex-col gap-1 lg:hidden shadow-lg z-10 max-h-[min(70vh,520px)] overflow-y-auto"
              >
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-kado-dark/40 px-4 pb-1">
                  Site
                </p>
                {PUBLIC_SITE_NAV.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileOpen(false)}
                    className={`text-sm font-medium py-2.5 px-4 rounded-xl ${
                      location.pathname === link.path
                        ? 'bg-kado-dark text-white'
                        : 'text-kado-dark/80 hover:bg-kado-dark/5 hover:text-kado-red'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="my-2 border-t border-kado-dark/10" />
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-kado-dark/40 px-4 pb-1">
                  My account
                </p>
                {ACCOUNT_NAV.map(({ to, label, end, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) => mobileAccountLinkClass(isActive)}
                  >
                    <Icon className="w-4 h-4" /> {label}
                  </NavLink>
                ))}
                <div className="my-2 border-t border-kado-dark/10" />
                <button
                  type="button"
                  onClick={() => { setMobileOpen(false); handleLogout(); }}
                  className="text-sm font-bold py-2.5 px-4 rounded-xl text-kado-red flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      <div className="border-b border-kado-dark/5 bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1.5 pt-5 pb-3 text-[10px] font-bold uppercase tracking-widest text-kado-dark/40">
            <Link to="/" className="hover:text-kado-red transition-colors flex items-center gap-1">
              <Home className="w-3 h-3" /> Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-kado-dark/70">My Account</span>
            {currentPage && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="text-kado-red">{currentPage.label}</span>
              </>
            )}
          </div>

          {/* Desktop account tabs — mobile uses hamburger (same ACCOUNT_NAV items) */}
          <nav className="hidden lg:flex gap-1.5 pb-4 overflow-x-auto scrollbar-none">
            {ACCOUNT_NAV.map(({ to, label, end, icon: Icon }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => accountNavLinkClass(isActive)}>
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      <main className="flex-1 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <Outlet />
        </div>
      </main>

      <footer className="mt-auto border-t border-kado-dark/5 bg-kado-dark text-white">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-kado-red text-white flex items-center justify-center font-display font-bold text-xs rounded-sm">
              角
            </div>
            <span className="text-xs font-bold text-white/70">Kado Kohi &copy; 2026</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/50">
            <Link to="/menu" className="hover:text-kado-red transition-colors">Menu</Link>
            <Link to="/branches" className="hover:text-kado-red transition-colors">Branches</Link>
            <Link to="/contact" className="hover:text-kado-red transition-colors">Contact</Link>
          </div>
        </div>
      </footer>

      <CartDrawer />
    </div>
  );
}
