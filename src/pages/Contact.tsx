import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Clock, Phone, Mail, Send, Instagram, Facebook } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would send to an API / email service
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div className="flex flex-col w-full bg-white font-sans min-h-screen">
      {/* Hero */}
      <section className="pt-28 pb-12 px-6 border-b border-kado-dark/5 bg-[#FAF7F2]">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-kado-red mb-2 text-center">
            Get in touch
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-black text-kado-dark mb-4 text-center uppercase tracking-tighter">
            We'd Love to Hear From You
          </h1>
          <p className="text-kado-dark/60 text-sm md:text-base max-w-xl mx-auto leading-relaxed text-center font-medium">
            Whether you have a question, feedback, or just want to say hello — drop us a message or visit us at our shop.
          </p>
        </div>
      </section>

      {/* Contact Grid */}
      <section className="px-6 py-16 md:py-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <form onSubmit={handleSubmit} className="bg-white border border-kado-dark/10 rounded-[1.5rem] p-8 md:p-10 space-y-6 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
              <h3 className="font-display font-black text-2xl text-kado-dark">Send a Message</h3>

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
                    Email Address
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
                    placeholder="Tell us what's on your mind..."
                  />
                </div>
              </div>

              <button
                type="submit"
                className="group w-full bg-kado-red text-white py-4 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#8A1519] shadow-lg shadow-kado-red/20 transition-all"
              >
                <Send className="w-4 h-4" />
                Send Message
              </button>

              {submitted && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-[11px] font-bold uppercase tracking-widest text-green-700 bg-green-50 border border-green-200 py-3 rounded-xl"
                >
                  ✓ Message Sent
                </motion.p>
              )}
            </form>
          </motion.div>

          {/* Info + Map */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col gap-8"
          >
            {/* Map */}
            <div className="rounded-[1.5rem] overflow-hidden border border-kado-dark/10 aspect-video bg-kado-dark/5 shadow-md">
              <iframe
                title="Kado Kohi Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3860.6!2d121.1!3d14.65!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDM5JzAwLjAiTiAxMjHCsDA2JzAwLjAiRQ!5e0!3m2!1sen!2sph!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            {/* Contact Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: <MapPin className="w-5 h-5" />,
                  label: 'Address',
                  value: 'J.P. Laurel St. Corner Mt. Everest, Marikina',
                },
                {
                  icon: <Clock className="w-5 h-5" />,
                  label: 'Hours',
                  value: 'Mon – Sun: 7 AM – 11 PM',
                },
                {
                  icon: <Phone className="w-5 h-5" />,
                  label: 'Phone',
                  value: '+63 920 948 2934',
                },
                {
                  icon: <Mail className="w-5 h-5" />,
                  label: 'Email',
                  value: 'hello@kadokohi.ph',
                },
              ].map((info) => (
                <div
                  key={info.label}
                  className="bg-white border border-kado-dark/10 rounded-xl p-5 flex items-start gap-4 hover:border-kado-red/30 hover:shadow-lg hover:shadow-kado-red/5 transition-all group"
                >
                  <div className="w-10 h-10 bg-[#FAF7F2] rounded-xl flex items-center justify-center text-kado-dark group-hover:text-kado-red group-hover:bg-kado-red/10 transition-colors shrink-0">
                    {info.icon}
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-kado-dark/40 mb-1">{info.label}</p>
                    <p className="text-sm font-bold text-kado-dark">{info.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Social */}
            <div className="flex items-center gap-4 bg-[#FAF7F2] p-5 rounded-xl border border-kado-dark/5">
              <span className="text-[10px] font-black uppercase tracking-widest text-kado-dark">Follow us</span>
              <div className="flex gap-2">
                <a
                  href="#"
                  className="w-9 h-9 bg-white border border-kado-dark/10 text-kado-dark rounded-full flex items-center justify-center hover:bg-kado-red hover:text-white hover:border-kado-red transition-all shadow-sm"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="#"
                  className="w-9 h-9 bg-white border border-kado-dark/10 text-kado-dark rounded-full flex items-center justify-center hover:bg-kado-red hover:text-white hover:border-kado-red transition-all shadow-sm"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
