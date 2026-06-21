import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CartDrawer from '../components/CartDrawer';
import { hydrateForPublicPath, hydratePublicShell } from '../lib/bootstrapHydration';
import { startGuestPageRealtime, stopGuestPageRealtime } from '../lib/supabase/guestPageRealtime';

export default function PublicLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    void hydratePublicShell();
    startGuestPageRealtime();
    return () => stopGuestPageRealtime();
  }, []);

  useEffect(() => {
    hydrateForPublicPath(pathname);
  }, [pathname]);

  return (
    <div className="min-h-screen font-sans selection:bg-kado-red selection:text-kado-cream flex flex-col bg-kado-cream text-kado-dark">
      <Navbar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
