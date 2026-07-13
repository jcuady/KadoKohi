import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import { ABOUT_EXPERIENCE } from '@/content/aboutPage';
import { AboutSectionShell } from './AboutUi';
import { AboutEditorialGrid, EditorialHeadline } from './AboutEditorial';

export default function AboutExperience() {
  return (
    <AboutSectionShell className="bg-kado-offwhite">
      <AboutEditorialGrid>
        <div className="mb-10 md:mb-12">
          <p className="kado-label mb-3 text-kado-red">{ABOUT_EXPERIENCE.eyebrow}</p>
          <EditorialHeadline
            as="h2"
            lines={[
              [{ text: 'More Than', accent: false }],
              [{ text: 'a Cup', accent: true }],
            ]}
            size="section"
          />
        </div>

        <div className="about-scroll-rail lg:grid lg:grid-cols-3 lg:gap-px lg:border lg:border-kado-dark/10 lg:bg-kado-dark/10 lg:overflow-visible lg:[scroll-snap-type:none]">
          {ABOUT_EXPERIENCE.items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.07 }}
              className="w-[min(88vw,20rem)] lg:w-auto"
            >
              <article className="flex h-full min-h-[200px] flex-col border border-kado-dark/10 bg-white p-6 lg:border-0 lg:p-8">
                <h3 className="font-display text-base font-bold uppercase tracking-tight text-kado-dark sm:text-lg">
                  {item.title}
                </h3>
                <p className="kado-body-sm mt-3 mb-6 flex-1 text-kado-dark/70">{item.body}</p>
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
      </AboutEditorialGrid>
    </AboutSectionShell>
  );
}
