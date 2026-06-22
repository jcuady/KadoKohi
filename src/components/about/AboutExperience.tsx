import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import { ABOUT_EXPERIENCE } from '@/content/aboutPage';
import { AboutSectionHeader, AboutSectionShell } from './AboutUi';

export default function AboutExperience() {
  return (
    <AboutSectionShell className="bg-[#FAF7F2]">
      <div className="mb-10 md:mb-12">
        <AboutSectionHeader
          eyebrow={ABOUT_EXPERIENCE.eyebrow}
          title={ABOUT_EXPERIENCE.title}
        />
      </div>

      <div className="about-scroll-rail about-scroll-rail--desktop-stack lg:grid lg:grid-cols-3 lg:gap-5">
        {ABOUT_EXPERIENCE.items.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="w-[min(88vw,20rem)] lg:w-auto"
          >
            <article className="flex h-full min-h-[200px] flex-col rounded-2xl border border-kado-dark/8 bg-white p-6 shadow-sm sm:p-7">
              <h3 className="kado-h3 mb-2 text-kado-dark">{item.title}</h3>
              <p className="kado-body-sm mb-6 flex-1 text-kado-dark/70">{item.body}</p>
              <Link
                to={item.to}
                className="kado-label inline-flex min-h-[44px] items-center gap-2 text-kado-red transition-colors hover:text-kado-red-hover"
              >
                {item.label}
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
            </article>
          </motion.div>
        ))}
      </div>
    </AboutSectionShell>
  );
}
