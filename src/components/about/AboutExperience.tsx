import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import { ABOUT_EXPERIENCE } from '@/content/aboutPage';
import { AboutCard, AboutSectionHeader } from './AboutUi';

export default function AboutExperience() {
  return (
    <section className="border-b border-kado-dark/8 bg-[#FAF7F2] px-6 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12">
          <AboutSectionHeader
            eyebrow={ABOUT_EXPERIENCE.eyebrow}
            title={ABOUT_EXPERIENCE.title}
          />
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {ABOUT_EXPERIENCE.items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <AboutCard className="flex h-full flex-col bg-white p-7">
                <h3 className="kado-h3 mb-2 text-kado-dark">{item.title}</h3>
                <p className="kado-body-sm mb-6 flex-1 text-kado-dark/70">{item.body}</p>
                <Link
                  to={item.to}
                  className="kado-label inline-flex items-center gap-2 text-kado-red transition-colors hover:text-kado-red-hover"
                >
                  {item.label}
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </Link>
              </AboutCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
