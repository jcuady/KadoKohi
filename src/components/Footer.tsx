import { MapPin, Clock, Phone, Instagram, Facebook } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="w-full mt-auto">
      {/* Main footer */}
      <div className="bg-kado-dark text-kado-cream py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-kado-red text-kado-cream flex items-center justify-center font-display font-bold text-xl rounded-sm">
                角
              </div>
              <img
                src="/logo/Logo1.png"
                alt="Kado Kohi"
                className="h-6 w-auto object-contain invert"
              />
            </Link>
            <p className="text-sm text-kado-cream/70 leading-relaxed max-w-xs">
              Handcrafted specialty coffee made from carefully selected 100% Arabica beans in the heart of Marikina City.
            </p>
            <div className="flex items-center gap-4 mt-2">
              <a href="#" className="hover:text-kado-red transition-colors" aria-label="Instagram">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-kado-red transition-colors" aria-label="Facebook">
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-4">
            <h3 className="font-display font-bold text-lg">Quick Links</h3>
            <div className="flex flex-col gap-2">
              <Link to="/menu" className="text-sm text-kado-cream/70 hover:text-kado-red transition-colors">Coffee</Link>
              <Link to="/book/booth" className="text-sm text-kado-cream/70 hover:text-kado-red transition-colors">Events Bookings</Link>
              <Link to="/events" className="text-sm text-kado-cream/70 hover:text-kado-red transition-colors">Kado Booth</Link>
              <Link to="/about" className="text-sm text-kado-cream/70 hover:text-kado-red transition-colors">About Us</Link>
              <Link to="/contact" className="text-sm text-kado-cream/70 hover:text-kado-red transition-colors">Contact Us</Link>
            </div>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col gap-4">
            <h3 className="font-display font-bold text-lg">Visit Us</h3>
            <div className="flex flex-col gap-3 text-sm text-kado-cream/70">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-kado-red" />
                <span>J.P. Laurel St. Corner Mt. Everest, Marikina City</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0 text-kado-red" />
                <span>Mon – Sun: 7 AM – 11 PM</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0 text-kado-red" />
                <span>+63 920 948 2934</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-kado-red text-kado-cream py-4">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-medium">
          <span>© 2026 Kado Kohi. All rights reserved.</span>
          <span>Specialty Coffee · Marikina City</span>
        </div>
      </div>
    </footer>
  );
}
