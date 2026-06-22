import { motion } from 'motion/react';
import { ABOUT_STATS } from '@/content/aboutPage';

export default function AboutStats() {
  return (
    <section className="border-b border-kado-dark/8 bg-kado-dark px-6 py-10 text-kado-cream md:py-12">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
        {ABOUT_STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="text-center md:text-left"
          >
            <p className="font-display text-2xl font-bold text-kado-cream md:text-3xl">{stat.value}</p>
            <p className="kado-label mt-2 text-kado-cream/70">{stat.label}</p>
            <p className="kado-body-sm mt-1 text-kado-cream/50">{stat.detail}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
