import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { MapPin, Clock, Phone, Mail, Send, ExternalLink } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import {
  CONTACT_PURPOSES,
  KADO_INBOUND_EMAIL,
  type ContactPurpose,
} from '../lib/contactEmail';
import { sendInboundEmail, validateContactForm } from '../lib/sendInboundEmail';
import ContactSocialLinks from '../components/ContactSocialLinks';
import PageSeoBlurb from '../components/seo/PageSeoBlurb';
import CollagePageHero from '../components/seo/CollagePageHero';
import { cn } from '../lib/utils';
import { kadoMapsSearchUrl, isStaleMapsEmbedUrl, kadoMapsEmbedUrl } from '../content/kadoLocation';
import {
  CONTACT_HERO_POLAROIDS,
  CONTACT_HERO_STICKERS,
} from '../data/collageHeroMedia';

function hasSocialLinks(s: ReturnType<typeof useSettingsStore.getState>['settings']) {
  return !!(s.socialInstagram?.trim() || s.socialFacebook?.trim() || s.socialTiktok?.trim());
}

export default function Contact() {
  const contact = useSettingsStore((s) => s.settings);
  const showSocial = hasSocialLinks(contact);
  const [purpose, setPurpose] = useState<ContactPurpose>('collaboration');
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<'idle' | 'sent' | 'error'>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const inboundEmail = contact.contactEmail?.trim() || KADO_INBOUND_EMAIL;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationError = validateContactForm(formData);
    if (validationError) {
      setFeedback('error');
      setFeedbackMessage(validationError);
      return;
    }

    setSubmitting(true);
    setFeedback('idle');
    setFeedbackMessage('');

    const result = await sendInboundEmail({
      kind: 'contact',
      purpose,
      name: formData.name,
      email: formData.email,
      message: formData.message,
    });

    setSubmitting(false);

    if (result.ok === false) {
      setFeedback('error');
      setFeedbackMessage(result.message);
      return;
    }

    if (result.via === 'mailto') {
      window.location.href = result.mailto;
      setFeedback('sent');
      setFeedbackMessage('Opening your email app with your message pre-filled…');
      return;
    }

    setFeedback('sent');
    setFormData({ name: '', email: '', message: '' });
    setFeedbackMessage(`Message sent to ${inboundEmail}. We'll reply soon.`);
  };

  const mailHref = `mailto:${inboundEmail}`;
  const mapsHref = kadoMapsSearchUrl();
  const mapsEmbedSrc = isStaleMapsEmbedUrl(contact.mapsEmbedUrl)
    ? kadoMapsEmbedUrl()
    : contact.mapsEmbedUrl;

  return (
    <div className="flex min-h-screen w-full flex-col bg-white font-sans">
      <CollagePageHero
        titleId="contact-page-title"
        eyebrow="Contact"
        title="We'd Love to Hear From You"
        description={
          <>
            Choose why you&apos;re reaching out — your message goes to{' '}
            <a href={mailHref} className="font-bold text-kado-red underline-offset-2 hover:underline">
              {inboundEmail}
            </a>
            .
          </>
        }
        polaroids={CONTACT_HERO_POLAROIDS}
        stickers={CONTACT_HERO_STICKERS}
      />

      <section className="px-6 py-16 md:py-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <form
              onSubmit={handleSubmit}
              className="bg-white border border-kado-dark/10 rounded-[1.5rem] p-8 md:p-10 space-y-6 shadow-[0_20px_40px_rgba(0,0,0,0.04)]"
            >
              <div>
                <h3 className="font-display font-black text-2xl text-kado-dark">Get in touch</h3>
                <p className="text-sm text-kado-dark/55 mt-1">Select a purpose and send — we deliver to {inboundEmail}.</p>
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
                    minLength={2}
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
                    minLength={10}
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-xl border border-kado-dark/15 bg-white text-sm text-kado-dark placeholder:text-kado-dark/30 font-medium focus:outline-none focus:ring-2 focus:ring-kado-red/20 focus:border-kado-red/50 transition-all resize-none"
                    placeholder="Share details — dates, scope, links, or questions (at least 10 characters)..."
                  />
                  <p className="mt-1 text-[10px] text-kado-dark/40">{formData.message.trim().length}/10 min characters</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="group w-full bg-kado-red text-white py-4 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-kado-red-hover shadow-lg shadow-kado-red/20 transition-all disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Sending…' : 'Send message'}
              </button>

              <p className="text-center text-[11px] text-kado-dark/45 leading-relaxed">
                Delivered to{' '}
                <a href={mailHref} className="font-bold text-kado-red hover:underline">
                  {inboundEmail}
                </a>
                . If email delivery is unavailable, your mail app opens with a pre-filled message.
              </p>

              {feedback !== 'idle' && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'text-center text-[11px] font-bold uppercase tracking-widest py-3 rounded-xl border',
                    feedback === 'sent'
                      ? 'text-kado-dark bg-kado-cream border-kado-dark/10'
                      : 'text-red-800 bg-red-50 border-red-200',
                  )}
                >
                  {feedbackMessage}
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
            <div className="relative rounded-[1.5rem] overflow-hidden border border-kado-dark/10 aspect-video bg-kado-dark/5 shadow-md">
              <iframe
                title="Kado Kohi Location"
                src={mapsEmbedSrc}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-kado-dark/75 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm transition-colors hover:bg-kado-red"
              >
                Open in Maps
                <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: <MapPin className="w-5 h-5" />,
                  label: 'Address',
                  value: contact.contactAddress,
                  href: mapsHref,
                  external: true,
                },
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
                  <div className="w-10 h-10 bg-kado-offwhite rounded-xl flex items-center justify-center text-kado-dark group-hover:text-kado-red group-hover:bg-kado-red/10 transition-colors shrink-0">
                    {info.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-kado-dark/40 mb-1">{info.label}</p>
                    {info.href ? (
                      <a
                        href={info.href}
                        target={info.external ? '_blank' : undefined}
                        rel={info.external ? 'noopener noreferrer' : undefined}
                        className="text-sm font-bold text-kado-dark hover:text-kado-red transition-colors break-words [overflow-wrap:anywhere]"
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
              <div className="flex items-center gap-4 bg-kado-offwhite p-5 rounded-xl border border-kado-dark/5">
                <span className="text-[10px] font-black uppercase tracking-widest text-kado-dark shrink-0">
                  Follow us
                </span>
                <ContactSocialLinks />
              </div>
            ) : null}
          </motion.div>
        </div>
      </section>

      <PageSeoBlurb />
    </div>
  );
}
