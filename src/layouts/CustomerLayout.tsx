import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import Navbar from '../components/Navbar';
import CartDrawer from '../components/CartDrawer';
import { ACCOUNT_NAV } from '../config/accountNav';
import { requestCookiePreferences } from '../lib/cookieConsent';

export default function CustomerLayout() {
  const location = useLocation();

  const currentPage = ACCOUNT_NAV.find((n) =>
    n.end ? location.pathname === n.to : location.pathname.startsWith(n.to),
  );

  const accountNavLinkClass = (isActive: boolean) =>
    `flex items-center gap-2 rounded-full px-5 py-2.5 text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-200 shrink-0 ${
      isActive
        ? 'bg-kado-dark text-white shadow-lg shadow-kado-dark/10'
        : 'bg-white border border-kado-dark/10 text-kado-dark/60 hover:border-kado-red/30 hover:text-kado-red hover:shadow-sm'
    }`;

  return (
    <div className="customer-surface min-h-screen font-sans flex flex-col selection:bg-kado-red selection:text-kado-cream bg-kado-cream text-kado-dark">
      <Navbar />

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

          <nav className="flex gap-1.5 pb-4 overflow-x-auto scrollbar-none -mx-1 px-1">
            {ACCOUNT_NAV.map(({ to, label, end, icon: Icon }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => accountNavLinkClass(isActive)}>
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      <main className="flex-1 bg-white min-w-0 overflow-x-hidden">
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
            <Link to="/menu" className="hover:text-kado-red transition-colors">
              Menu
            </Link>
            <Link to="/branches" className="hover:text-kado-red transition-colors">
              Branches
            </Link>
            <Link to="/contact" className="hover:text-kado-red transition-colors">
              Contact
            </Link>
            <button
              type="button"
              onClick={() => requestCookiePreferences()}
              className="hover:text-kado-red transition-colors"
            >
              Cookies
            </button>
          </div>
        </div>
      </footer>

      <CartDrawer />
    </div>
  );
}
