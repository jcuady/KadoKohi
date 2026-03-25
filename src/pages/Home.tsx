import { motion } from 'motion/react';
import { Star, ArrowRight, Coffee } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-7xl mx-auto w-full relative">

        <div className="text-center z-10 relative mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-kado-dark leading-[1.1]"
          >
            Your Daily Ritual
            <br />
            <span className="text-kado-red italic font-serif">Perfectly Brewed</span>
          </motion.h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center w-full relative">

          {/* Left Stats */}
          <div className="flex flex-col gap-12 order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col gap-2"
            >
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-display font-bold">100</span>
                <span className="text-xl text-kado-red font-bold">%</span>
              </div>
              <span className="text-sm font-medium text-kado-dark/70">Arabica Beans</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col gap-2"
            >
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-display font-bold">15</span>
                <span className="text-xl text-kado-red font-bold">+</span>
              </div>
              <span className="text-sm font-medium text-kado-dark/70">Years Of Brewing Experience</span>
            </motion.div>
          </div>

          {/* Center Image/Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="relative order-1 lg:order-2 flex justify-center items-center"
          >
            <div className="relative w-full max-w-md aspect-square">
              {/* Decorative elements */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-0 right-10 text-kado-red/40 z-0"
              >
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 0L22.5 17.5L40 20L22.5 22.5L20 40L17.5 22.5L0 20L17.5 17.5L20 0Z" fill="currentColor"/>
                </svg>
              </motion.div>
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-10 left-0 text-kado-red/40 z-0"
              >
                <svg width="30" height="30" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 0L22.5 17.5L40 20L22.5 22.5L20 40L17.5 22.5L0 20L17.5 17.5L20 0Z" fill="currentColor"/>
                </svg>
              </motion.div>
              <motion.div
                animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/4 -left-8 text-kado-dark/60 z-0"
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
                  <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                  <line x1="6" x2="6" y1="2" y2="4" />
                  <line x1="10" x2="10" y1="2" y2="4" />
                  <line x1="14" x2="14" y1="2" y2="4" />
                </svg>
              </motion.div>

              {/* Main Image */}
              <div className="w-full h-full rounded-full overflow-hidden border-4 border-kado-red/20 p-2 relative z-10">
                <div className="w-full h-full rounded-full overflow-hidden relative bg-kado-dark/5">
                  <img
                    src="https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=1000&auto=format&fit=crop"
                    alt="Perfectly brewed coffee"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-kado-red/10 mix-blend-overlay"></div>
                </div>
              </div>

              {/* Floating badge */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute -bottom-4 -right-4 bg-white p-4 rounded-2xl shadow-xl border border-kado-red/10 flex items-center gap-3 z-20"
              >
                <div className="w-10 h-10 bg-kado-red/10 rounded-full flex items-center justify-center text-kado-red">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-kado-dark uppercase tracking-wider">Signature</p>
                  <p className="text-sm font-medium text-kado-red">Kado Blend</p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right Content */}
          <div className="flex flex-col gap-12 order-3 lg:order-3">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col gap-6"
            >
              <p className="text-sm font-medium text-kado-dark/80 leading-relaxed max-w-xs">
                Handcrafted Coffee Made From Carefully Selected Beans in Marikina City.
              </p>

              <Link
                to="/menu"
                className="group bg-kado-dark text-kado-cream px-6 py-4 rounded-full font-medium flex items-center justify-between w-fit gap-4 hover:bg-kado-red transition-colors"
              >
                Order Your Coffee
                <span className="bg-white/20 p-1 rounded-full group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col gap-3"
            >
              <div className="flex -space-x-3">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop" alt="Customer" className="w-10 h-10 rounded-full border-2 border-kado-cream object-cover" />
                <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=100&auto=format&fit=crop" alt="Customer" className="w-10 h-10 rounded-full border-2 border-kado-cream object-cover" />
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop" alt="Customer" className="w-10 h-10 rounded-full border-2 border-kado-cream object-cover" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-display font-bold">4.9</span>
                <Star className="w-5 h-5 fill-kado-red text-kado-red" />
              </div>
              <span className="text-sm font-medium text-kado-dark/70">Customer Rating</span>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Featured Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-kado-red bg-kado-red/10 px-4 py-2 rounded-full mb-4">
              Featured
            </span>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-kado-dark">
              Why Choose Kado Kohi?
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Premium Beans',
                desc: 'We source the finest 100% Arabica beans from sustainable farms across the Philippines and beyond.',
                icon: '☕',
              },
              {
                title: 'Master Crafted',
                desc: 'Every cup is brewed with precision and care by baristas with over 15 years of combined experience.',
                icon: '✨',
              },
              {
                title: 'Cozy Atmosphere',
                desc: 'A warm, Japanese-inspired space designed for relaxation, focus, and meaningful conversations.',
                icon: '🏠',
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/60 backdrop-blur-sm border border-kado-red/10 rounded-2xl p-8 hover:shadow-lg hover:border-kado-red/20 transition-all group"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-display text-xl font-bold text-kado-dark mb-3 group-hover:text-kado-red transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-kado-dark/60 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto bg-kado-dark rounded-3xl p-12 md:p-16 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-8 text-6xl">角</div>
            <div className="absolute bottom-4 right-8 text-6xl">角</div>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-kado-cream mb-4 relative z-10">
            Ready for Your Daily Ritual?
          </h2>
          <p className="text-kado-cream/70 mb-8 max-w-md mx-auto relative z-10">
            Explore our full menu of handcrafted coffees, pastries, and seasonal specials.
          </p>
          <Link
            to="/menu"
            className="group inline-flex items-center gap-3 bg-kado-red text-kado-cream px-8 py-4 rounded-full font-medium hover:bg-kado-red/90 transition-colors relative z-10"
          >
            View Full Menu
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
