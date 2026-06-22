import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import ResilientImage from '@/components/ui/ResilientImage';
import { ABOUT_SIGNATURE } from '@/content/aboutPage';
import { AboutArchFrame } from './AboutArchFrame';
import { AboutSectionHeader, AboutSectionShell } from './AboutUi';

export default function AboutSignatureGallery() {
  return (
    <AboutSectionShell className="about-parchment bg-[#FAF7F2]">
      <div className="mb-10 md:mb-14">
        <AboutSectionHeader
          eyebrow={ABOUT_SIGNATURE.eyebrow}
          title={ABOUT_SIGNATURE.title}
          intro={ABOUT_SIGNATURE.intro}
        />
      </div>

      <div className="about-scroll-rail about-scroll-rail--desktop-stack lg:grid lg:grid-cols-3 lg:gap-8">
        {ABOUT_SIGNATURE.drinks.map((drink, i) => (
          <motion.div
            key={drink.name}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-8%' }}
            transition={{ duration: 0.55, delay: i * 0.1 }}
            className="w-[min(78vw,17rem)] lg:w-auto"
          >
            <Link to={drink.to} className="group block">
              <AboutArchFrame>
                <ResilientImage
                  src={drink.image}
                  fallbackSrc="/social/cafe-latte.png"
                  alt={drink.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </AboutArchFrame>
              <div className="mt-5 text-center lg:text-left">
                <p className="kado-label text-kado-red">{drink.tag}</p>
                <h3 className="kado-h3 mt-1 text-kado-dark">{drink.name}</h3>
                <p className="kado-body-sm mt-1 text-kado-dark/55">{drink.price}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </AboutSectionShell>
  );
}
