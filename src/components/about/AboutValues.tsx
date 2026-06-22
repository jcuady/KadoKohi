import { motion } from 'motion/react';
import { Coffee, Heart, Sparkles, Users } from 'lucide-react';
import { ABOUT_VALUES } from '@/content/aboutPage';
import { AboutSectionHeader } from './AboutUi';

const icons = [Coffee, Heart, Users, Sparkles] as const;

export default function AboutValues() {
  return (
    <section className="border-b border-kado-dark/8 px-6 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 md:mb-14">
          <AboutSectionHeader
            eyebrow={ABOUT_VALUES.eyebrow}
            title={ABOUT_VALUES.title}
            intro={ABOUT_VALUES.intro}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:gap-5">
          {ABOUT_VALUES.items.map((item, i) => {
            const Icon = icons[i] ?? Coffee;
            return (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-6%' }}
                transition={{ duration: 0.55, delay: i * 0.07 }}
                whileHover={{ y: -4 }}
                className="group relative overflow-hidden rounded-2xl border border-kado-dark/8 bg-white p-7 shadow-sm transition-shadow hover:shadow-[0_20px_45px_rgba(25,25,25,0.08)]"
              >
                <div
                  aria-hidden
                  className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-kado-red/5 transition-transform duration-500 group-hover:scale-125"
                />
                <div className="relative mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-kado-cream text-kado-red transition-colors group-hover:bg-kado-red group-hover:text-kado-cream">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="kado-h3 relative mb-2 text-kado-dark">{item.title}</h3>
                <p className="kado-body-sm relative text-kado-dark/70">{item.body}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
