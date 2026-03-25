import { motion } from 'motion/react';
import { Heart, Coffee, Users, Award } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';

const values = [
  {
    icon: <Coffee className="w-6 h-6" />,
    title: 'Quality First',
    desc: 'We never compromise on the quality of our beans, our process, or the experience we create for every guest.',
  },
  {
    icon: <Heart className="w-6 h-6" />,
    title: 'Community',
    desc: 'Kado Kohi is more than a coffee shop — it\'s a gathering place for Marikina\'s creatives, students, and dreamers.',
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Sustainability',
    desc: 'We partner with local farmers, use eco-friendly packaging, and strive to minimize our environmental footprint.',
  },
  {
    icon: <Award className="w-6 h-6" />,
    title: 'Craftsmanship',
    desc: 'Every cup is a product of meticulous attention — from bean sourcing and roasting to the final pour.',
  },
];

const timeline = [
  { year: '2010', event: 'The dream begins — our founder starts experimenting with coffee roasting at home in Marikina.' },
  { year: '2014', event: 'The first Kado Kohi pop-up launches at a local community market, serving just three drinks.' },
  { year: '2017', event: 'We open our permanent home at J.P. Laurel St. Corner Mt. Everest, Marikina City.' },
  { year: '2020', event: 'Kado Kohi survives the pandemic by launching delivery and building a loyal online community.' },
  { year: '2024', event: 'We expand our menu, introduce specialty seasonal drinks, and begin sourcing directly from Benguet farms.' },
  { year: '2026', event: 'Over 15 years of brewing experience — Kado Kohi continues to grow, one cup at a time.' },
];

export default function About() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="pt-12 pb-8 px-6">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            label="Our Story"
            title="Where Coffee Meets Craft"
            subtitle="Kado Kohi was born from a simple belief — that great coffee, a warm space, and genuine hospitality can transform an ordinary day into something worth savoring."
          />
        </div>
      </section>

      {/* Story Image + Text */}
      <section className="px-6 pb-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="rounded-2xl overflow-hidden border-4 border-kado-red/10">
              <img
                src="https://images.unsplash.com/photo-1559305616-3f99cd43e353?q=80&w=800&auto=format&fit=crop"
                alt="Inside Kado Kohi coffee shop"
                className="w-full aspect-[4/3] object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="absolute -bottom-6 -right-6 bg-white p-5 rounded-2xl shadow-xl border border-kado-red/10 z-10"
            >
              <p className="font-display font-bold text-3xl text-kado-dark">15<span className="text-kado-red">+</span></p>
              <p className="text-xs text-kado-dark/60 font-medium">Years of Brewing</p>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col gap-6"
          >
            <h3 className="font-display text-2xl md:text-3xl font-bold text-kado-dark">
              The <span className="text-kado-red italic font-serif">Kado Kohi</span> Story
            </h3>
            <div className="space-y-4 text-sm text-kado-dark/70 leading-relaxed">
              <p>
                "Kado" (角) means "corner" in Japanese — and that's exactly what we wanted to create: a warm corner where people feel at home. Tucked along J.P. Laurel Street in the heart of Marikina City, our shop is a haven for anyone who appreciates the ritual of a carefully brewed cup.
              </p>
              <p>
                From hand-selecting 100% Arabica beans to mastering the art of the pour-over, we pour intention into every step. Our baristas aren't just making coffee — they're crafting an experience. A sip. A pause. A moment of calm in a busy world.
              </p>
              <p>
                Whether you're a student studying for exams, a remote worker seeking focus, or friends catching up over pastries, Kado Kohi welcomes you. This is your corner. Pull up a chair.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="px-6 pb-24 bg-white/40">
        <div className="max-w-7xl mx-auto pt-24">
          <SectionHeader
            label="Our Values"
            title="What We Stand For"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/80 backdrop-blur-sm border border-kado-red/10 rounded-2xl p-6 hover:shadow-lg hover:border-kado-red/20 transition-all group text-center"
              >
                <div className="w-14 h-14 mx-auto bg-kado-red/10 rounded-2xl flex items-center justify-center text-kado-red mb-4 group-hover:bg-kado-red group-hover:text-kado-cream transition-colors">
                  {v.icon}
                </div>
                <h3 className="font-display font-bold text-kado-dark mb-2">{v.title}</h3>
                <p className="text-xs text-kado-dark/60 leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="px-6 pb-24">
        <div className="max-w-3xl mx-auto pt-24">
          <SectionHeader
            label="Our Journey"
            title="A Timeline of Growth"
          />
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-kado-red/20"></div>

            <div className="flex flex-col gap-8">
              {timeline.map((item, i) => (
                <motion.div
                  key={item.year}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex gap-6 items-start"
                >
                  <div className="w-12 h-12 shrink-0 bg-kado-red text-kado-cream rounded-full flex items-center justify-center font-display font-bold text-sm z-10">
                    {item.year.slice(-2)}
                  </div>
                  <div className="bg-white/60 border border-kado-red/10 rounded-xl p-5 flex-1">
                    <span className="text-xs font-bold text-kado-red uppercase tracking-wider">{item.year}</span>
                    <p className="text-sm text-kado-dark/70 mt-1 leading-relaxed">{item.event}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
