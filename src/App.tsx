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
import BaristaBoard from './pages/barista/BaristaBoard';
import BaristaQueue from './pages/barista/BaristaQueue';
import BaristaPOS from './pages/barista/BaristaPOS';
import BaristaMenu from './pages/barista/BaristaMenu';
import AccountDashboard from './pages/account/AccountDashboard';
import AccountOrders from './pages/account/AccountOrders';
import AccountProfile from './pages/account/AccountProfile';
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
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/signup" element={<Signup />} />

        <Route element={<RoleGate allowed={['admin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="branches" element={<AdminBranches />} />
            <Route path="pos" element={<AdminPOS />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="menu" element={<AdminMenu />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="tables" element={<AdminTables />} />
            <Route path="sections" element={<AdminSections />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Route>

        <Route element={<RoleGate allowed={['admin', 'barista']} />}>
          <Route path="/barista" element={<BaristaLayout />}>
            <Route index element={<BaristaBoard />} />
            <Route path="queue" element={<BaristaQueue />} />
            <Route path="pos" element={<BaristaPOS />} />
            <Route path="menu" element={<BaristaMenu />} />
          </Route>
        </Route>

        <Route element={<RoleGate allowed={['customer', 'admin']} />}>
          <Route path="/account" element={<CustomerLayout />}>
            <Route index element={<AccountDashboard />} />
            <Route path="orders" element={<AccountOrders />} />
            <Route path="profile" element={<AccountProfile />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
