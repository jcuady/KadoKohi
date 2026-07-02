import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CartDrawer from '../components/CartDrawer';
import { hydrateForPublicPath, hydratePublicShell } from '../lib/bootstrapHydration';
import { pathUsesGuestRealtime, startGuestPageRealtime, stopGuestPageRealtime } from '../lib/supabase/guestPageRealtime';

export default function PublicLayout() {
  const { pathname } = useLocation();

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
    <div className="customer-surface flex min-h-dvh w-full min-w-0 flex-col bg-kado-cream font-sans text-kado-dark selection:bg-kado-red selection:text-kado-cream">
      <Navbar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
