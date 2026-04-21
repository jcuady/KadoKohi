import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Heart, Coffee, Users, Award, ArrowRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const values = [
  {
    icon: <Coffee className="w-6 h-6" />,
    title: 'Uncompromised Quality',
    desc: 'From farm selection to the precise temperature of the pour, we manipulate variables to pursue the perfect cup.',
  },
  {
    icon: <Heart className="w-6 h-6" />,
    title: 'Community First',
    desc: 'Kado Kohi functions as Marikina\'s living room. A gathering place for creatives, dreamers, and early risers.',
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Radical Empathy',
    desc: 'Coffee is just a bridge. Our fundamental product is genuine, warm-blooded human connection and hospitality.',
  },
  {
    icon: <Award className="w-6 h-6" />,
    title: 'Constant Refinement',
    desc: '15 years of brewing, and we still treat every day like day one. Mastery is a journey, never a destination.',
  },
];

const timeline = [
  { year: '2010', title: 'The Experiment', desc: 'Our founder begins experimenting with coffee roasting at home in Marikina, mastering the fragile art of the bean.' },
  { year: '2014', title: 'The First Spark', desc: 'The first Kado Kohi pop-up launches at a local community market, serving just three meticulously crafted drinks.' },
  { year: '2017', title: 'Our Permanent Haven', desc: 'We discover our true corner at J.P. Laurel St. A minimalistic physical sanctuary is finally born.' },
  { year: '2020', title: 'Digital Survival', desc: 'Surviving the pandemic by pivoting to delivery and bottling, strengthening our community bond.' },
  { year: '2026', title: 'The Urban Tambayan', desc: '15 years later, Kado Kohi stands as Marikina\'s iconic hub for creatives, professionals, and coffee purists alike.' },
];

export default function About() {
  const pageRef = useRef<HTMLDivElement>(null);
  
  // Parallax for the main hero text
  const { scrollYProgress: heroScroll } = useScroll({
    target: pageRef,
    offset: ["start start", "center start"]
  });
  
  const heroTextY = useTransform(heroScroll, [0, 1], ["0%", "50%"]);
  const heroOpacity = useTransform(heroScroll, [0, 1], [1, 0]);

  return (
    <div className="flex flex-col w-full font-sans bg-[#EFE6D5]" ref={pageRef}>
      
      {/* ==============================================
          1. IMMERSIVE HERO
          ============================================== */}
      <section className="relative w-full h-[85vh] flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(239,230,213,1)_80%)] z-10" />
        <div className="absolute inset-0 bg-[#D8CABE]/20 opacity-50 block mix-blend-multiply" />
        
        <motion.div 
          style={{ y: heroTextY, opacity: heroOpacity }}
          className="z-20 text-center flex flex-col items-center px-6"
        >
          <span className="text-kado-red font-bold tracking-[0.3em] uppercase text-xs mb-6 bg-kado-red/5 px-5 py-2 rounded-full border border-kado-red/10 backdrop-blur-sm">
            Est. 2010
          </span>
          <h1 className="font-display text-7xl md:text-[8rem] lg:text-[10rem] font-bold text-[#2A2626] tracking-tighter leading-[0.8] mb-8">
            <span className="relative inline-block">KADO</span> <br/>
            <span className="italic font-serif opacity-90 text-[#612821]">KOHI.</span>
          </h1>
          <p className="text-xl md:text-2xl font-medium text-[#4A423C] max-w-2xl leading-relaxed">
            More than just coffee. We are the architects of your daily ritual, building sanctuaries in the heart of the city.
          </p>
        </motion.div>
      </section>

      {/* ==============================================
          2. THE "CORNER" NARRATIVE
          ============================================== */}
      <section className="py-24 px-6 md:px-12 lg:px-24 w-full">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 items-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-5 order-2 lg:order-1"
          >
            <h2 className="font-display text-4xl md:text-6xl font-bold text-[#2A2626] mb-8 leading-tight">
              Finding <br/> Your <span className="text-[#612821] italic font-serif opacity-90">Corner.</span>
            </h2>
            <div className="space-y-6 text-lg text-[#4A423C] leading-relaxed font-medium">
              <p>
                "Kado" (角) translates to "corner" in Japanese. In a world full of noise, rushing, and endless scrolling, we built a physical corner where time deliberately slows down.
              </p>
              <p>
                Tucked away along J.P. Laurel Street, our architecture isn't just about coffee. It's about engineering space for human connection. A place to write your novel, close a deal, or simply stare out the window and breathe.
              </p>
              <p>
                This isn't just a transaction. This is your personal tambayan.
              </p>
            </div>
          </motion.div>

          <div className="lg:col-span-7 order-1 lg:order-2 relative h-[500px] md:h-[700px] w-full flex justify-end">
             {/* Main Frame */}
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               transition={{ duration: 1 }}
               className="absolute right-0 top-0 w-[90%] md:w-[80%] h-[90%] rounded-[3rem] md:rounded-[4rem] overflow-hidden shadow-2xl shadow-[#2A2626]/10 border-[12px] border-white/50"
             >
                <img 
                  src="https://images.unsplash.com/photo-1559305616-3f99cd43e353?q=80&w=1200&auto=format&fit=crop" 
                  alt="Inside Kado Kohi"
                  className="w-full h-full object-cover sepia-[0.1] hover:scale-105 transition-transform duration-[2s] ease-out"
                />
             </motion.div>
             {/* Secondary Overlapping Frame (15+ Years) */}
             <motion.div 
               initial={{ opacity: 0, x: -50 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.8, delay: 0.3 }}
               className="absolute left-0 bottom-0 w-48 md:w-64 aspect-square bg-[#2A2626] rounded-[2rem] p-8 text-[#EFE6D5] flex flex-col justify-center items-start shadow-xl border border-[#4A423C]"
             >
                <Coffee className="w-8 h-8 text-kado-red mb-4" />
                <p className="font-display font-bold text-5xl md:text-6xl mb-2 leading-none">15<span className="text-kado-red">+</span></p>
                <p className="font-sans font-bold text-sm uppercase tracking-widest text-[#A09A90]">Years of Brewing</p>
             </motion.div>
          </div>
          
        </div>
      </section>

      {/* ==============================================
          3. VALUES (THE "NIGHT" VIBE Hub)
          ============================================== */}
      <section className="py-24 px-6 md:px-12 w-full bg-[#1A1818] relative overflow-hidden mt-12 rounded-t-[3rem] md:rounded-t-[5rem]">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-1/4 w-[40vw] h-[40vw] bg-[#9B2B2C]/10 rounded-full blur-[140px] pointer-events-none" />
        
        <div className="max-w-[1400px] mx-auto z-10 relative">
          <div className="text-center mb-16 md:mb-24">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-[#EFE6D5] mb-6">
              Our <span className="text-kado-red italic font-serif">Philosophy</span>
            </h2>
            <p className="text-[#A09A90] max-w-2xl mx-auto text-lg">The absolute standards that dictate every roast, every pour, and every conversation we have.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] p-8 hover:bg-white/10 hover:-translate-y-2 transition-all duration-300 group"
              >
                <div className="w-14 h-14 bg-[#2A2626] border border-[#4A423C] rounded-2xl flex items-center justify-center text-kado-red mb-6 shadow-inner group-hover:scale-110 group-hover:bg-[#9B2B2C] group-hover:text-white transition-all duration-300">
                  {v.icon}
                </div>
                <h3 className="font-display font-bold text-[#EFE6D5] text-xl mb-3">{v.title}</h3>
                <p className="text-[#A09A90] font-medium leading-relaxed text-sm">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==============================================
          4. SCROLLING TIMELINE
          ============================================== */}
      <section className="py-32 px-6 md:px-12 w-full bg-[#1A1818] relative border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="mb-20">
            <span className="text-kado-red font-bold tracking-[0.2em] uppercase text-sm mb-4 block">The Journey</span>
            <h2 className="font-display text-5xl md:text-6xl font-bold text-[#EFE6D5]">
              Evolution of <br/>a <span className="text-[#612821] italic font-serif">Tambayan.</span>
            </h2>
          </div>

          <div className="relative">
            {/* The structural spine */}
            <div className="absolute left-[27px] md:left-[39px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-kado-red via-[#A09A90]/20 to-transparent"></div>

            <div className="flex flex-col gap-16 md:gap-24 relative z-10">
              {timeline.map((item, i) => (
                 <TimelineItem key={item.year} item={item} index={i} />
              ))}
            </div>
          </div>
          
          {/* Final Call to Action inside the dark timeline block */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-32 pt-16 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-8"
          >
            <div>
              <h3 className="font-display text-3xl font-bold text-[#EFE6D5] mb-2">Ready to find your corner?</h3>
              <p className="text-[#A09A90] font-medium">Join us at the shop for your daily ritual.</p>
            </div>
            <Link
                to="/contact"
                className="w-full md:w-auto bg-[#EFE6D5] text-[#1A1818] px-8 py-4 rounded-full font-bold uppercase tracking-wider flex items-center justify-center gap-3 hover:bg-kado-red hover:text-[#EFE6D5] transition-all duration-300"
              >
                <MapPin className="w-5 h-5" />
                Visit The Shop
            </Link>
          </motion.div>

        </div>
      </section>

    </div>
  );
}

// Sub-component to manage individual scroll reveals for the timeline
interface TimelineItemProps {
  item: { year: string; title: string; desc: string };
  index: number;
  key?: string | number;
}

function TimelineItem({ item, index }: TimelineItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-15% 0px -15% 0px" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="flex gap-6 md:gap-12 items-start"
    >
      {/* Node pin */}
      <div className="w-14 h-14 md:w-20 md:h-20 shrink-0 bg-[#2A2626] border-2 border-kado-red text-[#EFE6D5] rounded-full flex flex-col items-center justify-center font-display font-bold shadow-[0_0_20px_rgba(155,43,44,0.3)] z-10">
        <span className="text-[10px] md:text-xs uppercase tracking-widest text-kado-red font-sans">Est</span>
        <span className="text-sm md:text-xl leading-none">{item.year.slice(-2)}</span>
      </div>
      
      {/* Content */}
      <div className="pt-2 md:pt-4">
        <h4 className="text-kado-red font-bold uppercase tracking-widest text-xs md:text-sm mb-2">{item.year}</h4>
        <h3 className="font-display text-2xl md:text-4xl font-bold text-[#EFE6D5] mb-4">{item.title}</h3>
        <p className="text-[#A09A90] font-medium text-sm md:text-lg leading-relaxed max-w-xl">
          {item.desc}
        </p>
      </div>
    </motion.div>
  )
}
