import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CartDrawer from '../components/CartDrawer';
import ConnectivityBanner from '../components/ConnectivityBanner';
import { hydrateForPublicPath, hydratePublicShell } from '../lib/bootstrapHydration';
import { pathUsesGuestRealtime, startGuestPageRealtime, stopGuestPageRealtime } from '../lib/supabase/guestPageRealtime';

export default function PublicLayout() {
  const { pathname } = useLocation();
  // Checkout is a focused payment surface — soft off-white, no marketing footer.
  const isCheckout = pathname.startsWith('/checkout');

  useEffect(() => {
    void hydratePublicShell();
  }, []);

  useEffect(() => {
    if (!pathUsesGuestRealtime(pathname)) return;
    startGuestPageRealtime();
    return () => stopGuestPageRealtime();
  }, [pathname]);

  useEffect(() => {
    hydrateForPublicPath(pathname);
  }, [pathname]);

  return (
    <div
      className={[
        'customer-surface flex min-h-dvh w-full min-w-0 flex-col font-sans text-kado-dark selection:bg-kado-red selection:text-kado-cream',
        isCheckout ? 'bg-kado-offwhite' : 'bg-kado-cream',
      ].join(' ')}
    >
      <Navbar />
      <ConnectivityBanner />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <Outlet />
      </main>
      {!isCheckout && <Footer />}
      <CartDrawer />
    </div>
  );
}
