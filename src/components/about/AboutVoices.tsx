import { motion } from 'motion/react';
import { Star } from 'lucide-react';
import { ABOUT_VOICES } from '@/content/aboutPage';
import { KADO_GOOGLE_LISTING, googleReviewsToTestimonials } from '@/content/kadoGoogleReviews';
import { AboutSectionHeader, AboutSectionShell } from './AboutUi';

const REVIEWS = googleReviewsToTestimonials().slice(0, 4);

export default function AboutVoices() {
  return (
    <AboutSectionShell className="about-parchment bg-[#FAF7F2]">
      <div className="mb-8 flex flex-col items-center gap-2 md:mb-12">
        <AboutSectionHeader
          eyebrow={ABOUT_VOICES.eyebrow}
          title={ABOUT_VOICES.title}
          intro={ABOUT_VOICES.intro}
        />
        <p className="kado-body-sm flex items-center gap-1.5 text-kado-dark/60">
          <Star className="h-4 w-4 fill-kado-red text-kado-red" aria-hidden />
          {KADO_GOOGLE_LISTING.rating} · {KADO_GOOGLE_LISTING.reviewCount} Google reviews
        </p>
      </div>

      <div className="relative flex gap-4 md:gap-8">
        <div aria-hidden className="about-column-deco hidden shrink-0 md:block" />
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
          {REVIEWS.map((review, i) => (
            <motion.article
              key={review.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-2xl border border-kado-dark/8 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="mb-4 flex items-center gap-3">
                <img
                  src={review.avatar}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-kado-cream"
                />
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-semibold text-kado-dark">{review.name}</p>
                  <p className="kado-subtext text-kado-dark/45">{review.role}</p>
                </div>
              </div>
              <p className="kado-body-sm line-clamp-4 text-kado-dark/72">“{review.content}”</p>
            </motion.article>
          ))}
        </div>
        <div aria-hidden className="about-column-deco hidden shrink-0 md:block" />
      </div>
    </AboutSectionShell>
  );
}
