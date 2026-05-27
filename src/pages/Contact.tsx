import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { MapPin, Clock, Phone, Mail, Send } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import {
  CONTACT_PURPOSES,
  buildContactMailto,
  type ContactPurpose,
} from '../lib/contactEmail';
import ContactSocialLinks from '../components/ContactSocialLinks';
import { cn } from '../lib/utils';

function hasSocialLinks(s: ReturnType<typeof useSettingsStore.getState>['settings']) {
  return !!(s.socialInstagram?.trim() || s.socialFacebook?.trim() || s.socialTiktok?.trim());
}

export default function Contact() {
  const contact = useSettingsStore((s) => s.settings);
  const showSocial = hasSocialLinks(contact);
  const [purpose, setPurpose] = useState<ContactPurpose>('collaboration');
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const mailto = buildContactMailto({
      to: contact.contactEmail,
      purpose,
      name: formData.name,
      fromEmail: formData.email,
      message: formData.message,
    });
    window.location.href = mailto;
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  const mailHref = `mailto:${contact.contactEmail}`;

  return (
    <div className="flex flex-col w-full bg-white font-sans min-h-screen">
      <section className="pt-28 pb-12 px-6 border-b border-kado-dark/5 bg-[#FAF7F2]">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-kado-red mb-2 text-center">
            Contact
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-black text-kado-dark mb-4 text-center uppercase tracking-tighter">
            We'd Love to Hear From You
          </h1>
          <p className="text-kado-dark/60 text-sm md:text-base max-w-xl mx-auto leading-relaxed text-center font-medium">
            Choose why you're reaching out — we'll open your email app with a formatted message to{' '}
            <a href={mailHref} className="text-kado-red font-bold hover:underline">
              {contact.contactEmail}
            </a>
            .
          </p>
        </div>
      </section>

      <section className="px-6 py-16 md:py-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <form
              onSubmit={handleSubmit}
              className="bg-white border border-kado-dark/10 rounded-[1.5rem] p-8 md:p-10 space-y-6 shadow-[0_20px_40px_rgba(0,0,0,0.04)]"
            >
              <div>
                <h3 className="font-display font-black text-2xl text-kado-dark">Get in touch</h3>
                <p className="text-sm text-kado-dark/55 mt-1">Select a purpose, then send via your email app.</p>
              </div>

              <fieldset className="space-y-3">
                <legend className="block text-[10px] font-black uppercase tracking-widest text-kado-dark/60 mb-2">
                  I'm reaching out about
                </legend>
                <div className="grid sm:grid-cols-2 gap-2">
                  {CONTACT_PURPOSES.map((opt) => {
                    const selected = purpose === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPurpose(opt.id)}
                        className={cn(
                          'text-left rounded-xl border px-4 py-3 transition-all',
                          selected
                            ? 'border-kado-red bg-kado-red/5 shadow-[0_4px_20px_rgba(158,24,29,0.08)]'
                            : 'border-kado-dark/12 hover:border-kado-dark/25 bg-white',
                        )}
                      >
                        <p
                          className={cn(
                            'text-xs font-black uppercase tracking-wider',
                            selected ? 'text-kado-red' : 'text-kado-dark',
                          )}
                        >
                          {opt.label}
                        </p>
                        <p className="text-[11px] text-kado-dark/50 mt-0.5 leading-snug">{opt.description}</p>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-[10px] font-black uppercase tracking-widest text-kado-dark/60 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-xl border border-kado-dark/15 bg-white text-sm text-kado-dark placeholder:text-kado-dark/30 font-medium focus:outline-none focus:ring-2 focus:ring-kado-red/20 focus:border-kado-red/50 transition-all"
                    placeholder="Juan Dela Cruz"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-[10px] font-black uppercase tracking-widest text-kado-dark/60 mb-2">
                    Your Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-xl border border-kado-dark/15 bg-white text-sm text-kado-dark placeholder:text-kado-dark/30 font-medium focus:outline-none focus:ring-2 focus:ring-kado-red/20 focus:border-kado-red/50 transition-all"
                    placeholder="you@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-[10px] font-black uppercase tracking-widest text-kado-dark/60 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-xl border border-kado-dark/15 bg-white text-sm text-kado-dark placeholder:text-kado-dark/30 font-medium focus:outline-none focus:ring-2 focus:ring-kado-red/20 focus:border-kado-red/50 transition-all resize-none"
                    placeholder="Share details — dates, scope, links, or questions..."
                  />
                </div>
              </div>

              <button
                type="submit"
                className="group w-full bg-kado-red text-white py-4 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#8A1519] shadow-lg shadow-kado-red/20 transition-all"
              >
                <Send className="w-4 h-4" />
                Send via Email
              </button>

              <p className="text-center text-[11px] text-kado-dark/45 leading-relaxed">
                Opens your mail app to{' '}
                <a href={mailHref} className="font-bold text-kado-red hover:underline">
                  {contact.contactEmail}
                </a>{' '}
                with subject and body pre-filled for your selected purpose.
              </p>

              {submitted && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-[11px] font-bold uppercase tracking-widest text-kado-dark bg-kado-cream border border-kado-dark/10 py-3 rounded-xl"
                >
                  Opening your email app…
                </motion.p>
              )}
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col gap-8"
          >
            <div className="rounded-[1.5rem] overflow-hidden border border-kado-dark/10 aspect-video bg-kado-dark/5 shadow-md">
              <iframe
                title="Kado Kohi Location"
                src={contact.mapsEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: <MapPin className="w-5 h-5" />, label: 'Address', value: contact.contactAddress },
                { icon: <Clock className="w-5 h-5" />, label: 'Hours', value: contact.contactHours },
                {
                  icon: <Phone className="w-5 h-5" />,
                  label: 'Phone',
                  value: contact.contactPhone,
                  href: `tel:${contact.contactPhone.replace(/\s/g, '')}`,
                },
                {
                  icon: <Mail className="w-5 h-5" />,
                  label: 'Email',
                  value: contact.contactEmail,
                  href: mailHref,
                },
              ].map((info) => (
                <div
                  key={info.label}
                  className="bg-white border border-kado-dark/10 rounded-xl p-5 flex items-start gap-4 hover:border-kado-red/30 hover:shadow-lg hover:shadow-kado-red/5 transition-all group"
                >
                  <div className="w-10 h-10 bg-[#FAF7F2] rounded-xl flex items-center justify-center text-kado-dark group-hover:text-kado-red group-hover:bg-kado-red/10 transition-colors shrink-0">
                    {info.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-kado-dark/40 mb-1">{info.label}</p>
                    {info.href ? (
                      <a
                        href={info.href}
                        className="text-sm font-bold text-kado-dark hover:text-kado-red transition-colors break-all"
                      >
                        {info.value}
                      </a>
                    ) : (
                      <p className="text-sm font-bold text-kado-dark">{info.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {showSocial ? (
              <div className="flex items-center gap-4 bg-[#FAF7F2] p-5 rounded-xl border border-kado-dark/5">
                <span className="text-[10px] font-black uppercase tracking-widest text-kado-dark shrink-0">
                  Follow us
                </span>
                <ContactSocialLinks />
              </div>
            ) : null}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
