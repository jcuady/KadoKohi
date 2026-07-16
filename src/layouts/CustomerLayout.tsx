import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CartDrawer from '../components/CartDrawer';
import ConnectivityBanner from '../components/ConnectivityBanner';
import AccountBottomNav from '../components/account/AccountBottomNav';
import AccountDesktopNav from '../components/account/AccountDesktopNav';

/** Customer account shell — same red BrandWordmark header as the public home site. */
export default function CustomerLayout() {
  return (
    <div className="customer-surface account-app flex min-h-dvh w-full min-w-0 flex-col bg-kado-offwhite font-sans text-kado-dark selection:bg-kado-red selection:text-kado-cream">
      <Navbar />
      <ConnectivityBanner />
      <AccountDesktopNav />

      <main className="account-app-main flex-1 min-w-0 overflow-x-hidden">
        <div className="account-app-content mx-auto w-full max-w-3xl sm:max-w-5xl">
          <Outlet />
        </div>
      </main>

      <AccountBottomNav />
      <CartDrawer />
    </div>
  );
}
