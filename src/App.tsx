import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazyWithRetry } from './lib/lazyWithRetry';
import PublicLayout from './layouts/PublicLayout';
import RoleGate from './components/RoleGate';
import Home from './pages/Home';
import Menu from './pages/Menu';
import About from './pages/About';
import Contact from './pages/Contact';
import Branches from './pages/Branches';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import AuthConfirm from './pages/auth/AuthConfirm';
import InternalLogin from './pages/auth/InternalLogin';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Events from './pages/Events';
import Order from './pages/Order';
import OrderQR from './pages/OrderQR';
import OrderTakeout from './pages/OrderTakeout';
import Merch from './pages/Merch';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Pastries from './pages/Pastries';
import Careers from './pages/Careers';
import TermsOfService from './pages/legal/TermsOfService';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import BookBooth from './pages/BookBooth';
import NotFound from './pages/NotFound';
import HelpInstall from './pages/HelpInstall';
import RouteSeo from './components/RouteSeo';
import PublicDocumentTheme from './components/PublicDocumentTheme';
import SiteCookieConsent from './components/SiteCookieConsent';

const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const BaristaLayout = lazy(() => import('./layouts/BaristaLayout'));
const StaffLayout = lazy(() => import('./layouts/StaffLayout'));
const CustomerLayout = lazyWithRetry(() => import('./layouts/CustomerLayout'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminBranches = lazy(() => import('./pages/admin/AdminBranches'));
const AdminPOS = lazy(() => import('./pages/admin/AdminPOS'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminMenu = lazy(() => import('./pages/admin/AdminMenu'));
const AdminEvents = lazy(() => import('./pages/admin/AdminEvents'));
const AdminTables = lazy(() => import('./pages/admin/AdminTables'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminAuditLog = lazy(() => import('./pages/admin/AdminAuditLog'));
const AdminVouchers = lazy(() => import('./pages/admin/AdminVouchers'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminMerch = lazy(() => import('./pages/admin/AdminMerch'));
const AdminLoyalty = lazy(() => import('./pages/admin/AdminLoyalty'));
const AdminStamps = lazy(() => import('./pages/admin/AdminStamps'));
const AdminBoothBookings = lazy(() => import('./pages/admin/AdminBoothBookings'));
const AdminBoothCatalog = lazy(() => import('./pages/admin/AdminBoothCatalog'));
const AdminBoothContent = lazy(() => import('./pages/admin/AdminBoothContent'));
const AdminLandingContent = lazy(() => import('./pages/admin/AdminLandingContent'));
const AdminCareers = lazy(() => import('./pages/admin/AdminCareers'));
const AdminBlog = lazy(() => import('./pages/admin/AdminBlog'));

const StaffMerchOrders = lazy(() => import('./pages/staff/StaffMerchOrders'));
const StaffAllOrders = lazy(() => import('./pages/staff/StaffAllOrders'));
const StaffBoothBookings = lazy(() => import('./pages/staff/StaffBoothBookings'));
const InternalAccountSettings = lazy(() => import('./pages/internal/InternalAccountSettings'));

const BaristaBoard = lazy(() => import('./pages/barista/BaristaBoard'));
const BaristaQueue = lazy(() => import('./pages/barista/BaristaQueue'));
const BaristaPOS = lazy(() => import('./pages/barista/BaristaPOS'));
const BaristaMenu = lazy(() => import('./pages/barista/BaristaMenu'));
const BaristaStamps = lazy(() => import('./pages/barista/BaristaStamps'));
const BaristaKioskDisplay = lazy(() => import('./pages/barista/BaristaKioskDisplay'));

const AccountDashboard = lazyWithRetry(() => import('./pages/account/AccountDashboard'));
const AccountOrders = lazyWithRetry(() => import('./pages/account/AccountOrders'));
const AccountProfile = lazyWithRetry(() => import('./pages/account/AccountProfile'));
const AccountBoothBookings = lazyWithRetry(() => import('./pages/account/AccountBoothBookings'));
const AccountVouchers = lazyWithRetry(() => import('./pages/account/AccountVouchers'));

function RouteChunkFallback() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center text-sm text-kado-dark/70">
      Loading…
    </div>
  );
}

function LazyRoutes({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteChunkFallback />}>{children}</Suspense>;
}

export default function App() {
  return (
    <BrowserRouter>
      <PublicDocumentTheme />
      <RouteSeo />
      <SiteCookieConsent />
      <Routes>
        {/* Standalone utility pages */}
        <Route path="/help/install" element={<HelpInstall />} />

        {/* Standalone QR / takeout order pages — no marketing nav/footer */}
        <Route path="/order/qr/:code" element={<OrderQR />} />
        <Route path="/order/takeout" element={<OrderTakeout />} />

        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/about" element={<About />} />
          <Route path="/contacts" element={<Navigate to="/contact" replace />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/branches" element={<Branches />} />
          <Route path="/events" element={<Events />} />
          <Route path="/order" element={<Order />} />
          <Route path="/merch" element={<Merch />} />
          <Route path="/pastries" element={<Pastries />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/book/coffee-cart" element={<BookBooth />} />
          <Route path="/book/matcha-bar" element={<BookBooth kind="matcha-bar" />} />
          <Route path="/book/booth" element={<Navigate to="/book/coffee-cart" replace />} />
          <Route path="/legal/terms" element={<TermsOfService />} />
          <Route path="/legal/privacy" element={<PrivacyPolicy />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="/auth/login/*" element={<Login />} />
        <Route path="/auth/signup/*" element={<Signup />} />
        <Route path="/auth/confirm/*" element={<AuthConfirm />} />
        <Route path="/auth/forgot-password/*" element={<ForgotPassword />} />
        <Route path="/auth/reset-password/*" element={<ResetPassword />} />
        <Route path="/management-portal/forgot-password/*" element={<ForgotPassword variant="internal" />} />
        <Route path="/management-portal/*" element={<InternalLogin />} />

        <Route element={<RoleGate allowed={['admin']} />}>
          <Route
            path="/admin"
            element={
              <LazyRoutes>
                <AdminLayout />
              </LazyRoutes>
            }
          >
            <Route index element={<LazyRoutes><AdminDashboard /></LazyRoutes>} />
            <Route path="branches" element={<LazyRoutes><AdminBranches /></LazyRoutes>} />
            <Route path="pos" element={<LazyRoutes><AdminPOS /></LazyRoutes>} />
            <Route path="orders" element={<LazyRoutes><AdminOrders /></LazyRoutes>} />
            <Route path="menu" element={<LazyRoutes><AdminMenu /></LazyRoutes>} />
            <Route path="merch" element={<LazyRoutes><AdminMerch /></LazyRoutes>} />
            <Route path="loyalty" element={<LazyRoutes><AdminLoyalty /></LazyRoutes>} />
            <Route path="stamps" element={<LazyRoutes><AdminStamps /></LazyRoutes>} />
            <Route path="booth-bookings" element={<LazyRoutes><AdminBoothBookings /></LazyRoutes>} />
            <Route path="booth-catalog" element={<LazyRoutes><AdminBoothCatalog /></LazyRoutes>} />
            <Route path="booth-content" element={<LazyRoutes><AdminBoothContent /></LazyRoutes>} />
            <Route path="events" element={<LazyRoutes><AdminEvents /></LazyRoutes>} />
            <Route path="tables" element={<LazyRoutes><AdminTables /></LazyRoutes>} />
            <Route path="landing" element={<LazyRoutes><AdminLandingContent /></LazyRoutes>} />
            <Route path="blog" element={<LazyRoutes><AdminBlog /></LazyRoutes>} />
            <Route path="careers" element={<LazyRoutes><AdminCareers /></LazyRoutes>} />
            <Route path="pastries" element={<Navigate to="/admin/menu?tab=pastries" replace />} />
            <Route path="users" element={<LazyRoutes><AdminUsers /></LazyRoutes>} />
            <Route path="audit" element={<LazyRoutes><AdminAuditLog /></LazyRoutes>} />
            <Route path="vouchers" element={<LazyRoutes><AdminVouchers /></LazyRoutes>} />
            <Route path="settings" element={<LazyRoutes><AdminSettings /></LazyRoutes>} />
          </Route>
        </Route>

        <Route element={<RoleGate allowed={['admin', 'barista']} />}>
          <Route
            path="/barista/kiosk"
            element={
              <LazyRoutes>
                <BaristaKioskDisplay />
              </LazyRoutes>
            }
          />
          <Route
            path="/barista"
            element={
              <LazyRoutes>
                <BaristaLayout />
              </LazyRoutes>
            }
          >
            <Route index element={<LazyRoutes><BaristaBoard /></LazyRoutes>} />
            <Route path="queue" element={<LazyRoutes><BaristaQueue /></LazyRoutes>} />
            <Route path="pos" element={<LazyRoutes><BaristaPOS /></LazyRoutes>} />
            <Route path="menu" element={<LazyRoutes><BaristaMenu /></LazyRoutes>} />
            <Route path="stamps" element={<LazyRoutes><BaristaStamps /></LazyRoutes>} />
            <Route path="settings" element={<LazyRoutes><InternalAccountSettings portalLabel="Barista" /></LazyRoutes>} />
          </Route>
        </Route>

        <Route element={<RoleGate allowed={['admin', 'staff']} />}>
          <Route
            path="/staff"
            element={
              <LazyRoutes>
                <StaffLayout />
              </LazyRoutes>
            }
          >
            <Route index element={<LazyRoutes><StaffMerchOrders /></LazyRoutes>} />
            <Route path="booth-bookings" element={<LazyRoutes><StaffBoothBookings /></LazyRoutes>} />
            <Route path="merch-orders" element={<LazyRoutes><StaffMerchOrders /></LazyRoutes>} />
            <Route path="orders" element={<LazyRoutes><StaffAllOrders /></LazyRoutes>} />
            <Route path="settings" element={<LazyRoutes><InternalAccountSettings portalLabel="Staff" /></LazyRoutes>} />
          </Route>
        </Route>

        <Route element={<RoleGate allowed={['customer', 'admin']} />}>
          <Route
            path="/account"
            element={
              <LazyRoutes>
                <CustomerLayout />
              </LazyRoutes>
            }
          >
            <Route index element={<LazyRoutes><AccountDashboard /></LazyRoutes>} />
            <Route path="orders" element={<LazyRoutes><AccountOrders /></LazyRoutes>} />
            <Route path="booth" element={<LazyRoutes><AccountBoothBookings /></LazyRoutes>} />
            <Route path="vouchers" element={<LazyRoutes><AccountVouchers /></LazyRoutes>} />
            <Route path="profile" element={<LazyRoutes><AccountProfile /></LazyRoutes>} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
