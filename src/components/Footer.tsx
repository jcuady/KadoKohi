import { MapPin, Clock, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettingsStore } from '../store/settingsStore';
import { FooterSocialLinks } from './ContactSocialLinks';

export default function Footer() {
  const contact = useSettingsStore((s) => s.settings);
  const mailHref = `mailto:${contact.contactEmail}`;
  const phoneHref = `tel:${contact.contactPhone.replace(/\s/g, '')}`;

  return (
    <footer className="w-full mt-auto">
      <div className="bg-kado-dark text-kado-cream py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-kado-red text-kado-cream flex items-center justify-center font-display font-bold text-xl rounded-sm">
                角
              </div>
              <img src="/logo/Logo1.png" alt="Kado Kohi" className="h-6 w-auto object-contain invert" />
            </Link>
            <p className="text-sm text-kado-cream/70 leading-relaxed max-w-xs">
              Handcrafted specialty coffee made from carefully selected 100% Arabica beans in the heart of Marikina
              City.
            </p>
            <FooterSocialLinks className="mt-2" />
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="font-display font-bold text-lg">Quick Links</h3>
            <div className="flex flex-col gap-2">
              <Link to="/menu" className="text-sm text-kado-cream/70 hover:text-kado-red transition-colors">
                Coffee
              </Link>
              <Link to="/book/booth" className="text-sm text-kado-cream/70 hover:text-kado-red transition-colors">
                Events Bookings
              </Link>
              <Link to="/events" className="text-sm text-kado-cream/70 hover:text-kado-red transition-colors">
                Kado Booth
              </Link>
              <Link to="/about" className="text-sm text-kado-cream/70 hover:text-kado-red transition-colors">
                About Us
              </Link>
              <Link to="/contact" className="text-sm text-kado-cream/70 hover:text-kado-red transition-colors">
                Contact Us
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="font-display font-bold text-lg">Visit Us</h3>
            <div className="flex flex-col gap-3 text-sm text-kado-cream/70">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-kado-red" />
                <span>{contact.contactAddress}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0 text-kado-red" />
                <span>{contact.contactHours}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0 text-kado-red" />
                <a href={phoneHref} className="hover:text-kado-red transition-colors">
                  {contact.contactPhone}
                </a>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 shrink-0 text-kado-red" />
                <a href={mailHref} className="hover:text-kado-red transition-colors break-all font-medium">
                  {contact.contactEmail}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-kado-red text-kado-cream py-4">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-medium">
          <span>© 2026 Kado Kohi. All rights reserved.</span>
          <span>Specialty Coffee · Marikina City</span>
        </div>
      </div>
    </footer>
  );
}
