import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import BaristaLayout from './layouts/BaristaLayout';
import CustomerLayout from './layouts/CustomerLayout';
import RoleGate from './components/RoleGate';
import Home from './pages/Home';
import Menu from './pages/Menu';
import About from './pages/About';
import Contact from './pages/Contact';
import Branches from './pages/Branches';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import InternalLogin from './pages/auth/InternalLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBranches from './pages/admin/AdminBranches';
import AdminPOS from './pages/admin/AdminPOS';
import AdminOrders from './pages/admin/AdminOrders';
import AdminMenu from './pages/admin/AdminMenu';
import AdminEvents from './pages/admin/AdminEvents';
import AdminTables from './pages/admin/AdminTables';
import AdminSections from './pages/admin/AdminSections';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSettings from './pages/admin/AdminSettings';
import Events from './pages/Events';
import Order from './pages/Order';
import OrderQR from './pages/OrderQR';
import OrderTakeout from './pages/OrderTakeout';
import Merch from './pages/Merch';
import BookBooth from './pages/BookBooth';
import AdminMerch from './pages/admin/AdminMerch';
import AdminLoyalty from './pages/admin/AdminLoyalty';
import AdminBoothBookings from './pages/admin/AdminBoothBookings';
import AdminBoothCatalog from './pages/admin/AdminBoothCatalog';
import AdminBoothContent from './pages/admin/AdminBoothContent';
import AdminLandingContent from './pages/admin/AdminLandingContent';
import StaffLayout from './layouts/StaffLayout';
import StaffMerchOrders from './pages/staff/StaffMerchOrders';
import StaffAllOrders from './pages/staff/StaffAllOrders';
import StaffBoothBookings from './pages/staff/StaffBoothBookings';
import BaristaBoard from './pages/barista/BaristaBoard';
import BaristaQueue from './pages/barista/BaristaQueue';
import BaristaPOS from './pages/barista/BaristaPOS';
import BaristaMenu from './pages/barista/BaristaMenu';
import BaristaKioskDisplay from './pages/barista/BaristaKioskDisplay';
import AccountDashboard from './pages/account/AccountDashboard';
import AccountOrders from './pages/account/AccountOrders';
import AccountProfile from './pages/account/AccountProfile';
import AccountBoothBookings from './pages/account/AccountBoothBookings';
import AccountVouchers from './pages/account/AccountVouchers';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/branches" element={<Branches />} />
          <Route path="/events" element={<Events />} />
          <Route path="/order" element={<Order />} />
          <Route path="/order/qr/:code" element={<OrderQR />} />
          <Route path="/order/takeout" element={<OrderTakeout />} />
          <Route path="/merch" element={<Merch />} />
          <Route path="/book/booth" element={<BookBooth />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/signup" element={<Signup />} />
        <Route path="/management-portal" element={<InternalLogin />} />

        <Route element={<RoleGate allowed={['admin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="branches" element={<AdminBranches />} />
            <Route path="pos" element={<AdminPOS />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="menu" element={<AdminMenu />} />
            <Route path="merch" element={<AdminMerch />} />
            <Route path="loyalty" element={<AdminLoyalty />} />
            <Route path="booth-bookings" element={<AdminBoothBookings />} />
            <Route path="booth-catalog" element={<AdminBoothCatalog />} />
            <Route path="booth-content" element={<AdminBoothContent />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="tables" element={<AdminTables />} />
            <Route path="sections" element={<AdminSections />} />
            <Route path="landing" element={<AdminLandingContent />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Route>

        <Route element={<RoleGate allowed={['admin', 'barista']} />}>
          <Route path="/barista/kiosk" element={<BaristaKioskDisplay />} />
          <Route path="/barista" element={<BaristaLayout />}>
            <Route index element={<BaristaBoard />} />
            <Route path="queue" element={<BaristaQueue />} />
            <Route path="pos" element={<BaristaPOS />} />
            <Route path="menu" element={<BaristaMenu />} />
          </Route>
        </Route>

        <Route element={<RoleGate allowed={['admin', 'staff']} />}>
          <Route path="/staff" element={<StaffLayout />}>
            <Route index element={<StaffMerchOrders />} />
            <Route path="booth-bookings" element={<StaffBoothBookings />} />
            <Route path="merch-orders" element={<StaffMerchOrders />} />
            <Route path="orders" element={<StaffAllOrders />} />
          </Route>
        </Route>

        <Route element={<RoleGate allowed={['customer', 'admin']} />}>
          <Route path="/account" element={<CustomerLayout />}>
            <Route index element={<AccountDashboard />} />
            <Route path="orders" element={<AccountOrders />} />
            <Route path="booth" element={<AccountBoothBookings />} />
            <Route path="vouchers" element={<AccountVouchers />} />
            <Route path="profile" element={<AccountProfile />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
