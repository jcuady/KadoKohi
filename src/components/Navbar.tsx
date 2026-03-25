import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShoppingBag, Heart, User, Menu, X } from 'lucide-react';
import { useState } from 'react';

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'All Coffee', path: '/menu' },
  { label: 'About Us', path: '/about' },
  { label: 'Contact Us', path: '/contact' },
];

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="w-full px-6 py-6 flex items-center justify-between max-w-7xl mx-auto relative z-50">
      <Link to="/" className="flex items-center gap-2 group">
        <div className="w-10 h-10 bg-kado-red text-kado-cream flex items-center justify-center font-display font-bold text-xl rounded-sm group-hover:scale-105 transition-transform">
          角
        </div>
        <span className="font-display font-bold text-2xl tracking-tight text-kado-red">KADO KOHI</span>
      </Link>

      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-8 bg-white/50 backdrop-blur-sm px-8 py-3 rounded-full border border-kado-red/10">
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`text-sm font-medium transition-colors ${
              location.pathname === link.path
                ? 'bg-kado-dark text-kado-cream px-4 py-1.5 rounded-full'
                : 'hover:text-kado-red'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-6">
        <button className="flex items-center gap-2 hover:text-kado-red transition-colors">
          <ShoppingBag className="w-5 h-5" />
          <span className="text-sm font-medium hidden sm:block">Cart(0)</span>
        </button>
        <button className="hover:text-kado-red transition-colors hidden sm:block">
          <Heart className="w-5 h-5" />
        </button>
        <button className="hover:text-kado-red transition-colors hidden sm:block">
          <User className="w-5 h-5" />
        </button>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden hover:text-kado-red transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 w-full bg-kado-cream/95 backdrop-blur-md border-b border-kado-red/10 p-6 flex flex-col gap-4 md:hidden shadow-lg"
        >
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileOpen(false)}
              className={`text-base font-medium transition-colors py-2 px-4 rounded-lg ${
                location.pathname === link.path
                  ? 'bg-kado-dark text-kado-cream'
                  : 'hover:bg-kado-red/10 hover:text-kado-red'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </motion.div>
      )}
    </nav>
  );
}
