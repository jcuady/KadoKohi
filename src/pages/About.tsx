import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Heart, Coffee, Users, Award, MapPin } from 'lucide-react';
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
    desc: 'We treat every day like day one. Mastery is a journey, never a destination.',
  },
];

const timeline = [
  { year: '2024', title: 'The Concept', desc: 'The vision for Kado Kohi is born — a modern, minimalist sanctuary blending Japanese aesthetics with local warmth.' },
  { year: '2025', title: 'The Sourcing', desc: 'Months spent cupping, profiling, and selecting the perfect beans and matcha to define our signature menu.' },
  { year: '2026 Jan', title: 'The Buildout', desc: 'We discover our true corner at J.P. Laurel St. Construction begins on our permanent physical haven.' },
  { year: '2026 Mar', title: 'The Launch', desc: 'Kado Kohi officially opens its doors to the Marikina community. The start of a new daily ritual.' },
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
    <div className="relative flex flex-col w-full font-sans bg-white min-h-screen" ref={pageRef}>
      
      {/* ==============================================
          1. IMMERSIVE HERO
          ============================================== */}
      <section className="relative w-full h-[75vh] flex items-center justify-center overflow-hidden pt-20 border-b border-kado-dark/5 bg-[#FAF7F2]">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(250,247,242,1)_80%)] z-10" />
        
        <motion.div 
          style={{ y: heroTextY, opacity: heroOpacity }}
          className="z-20 text-center flex flex-col items-center px-6"
        >
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-kado-red mb-6 bg-white px-5 py-2 rounded-full border border-kado-red/20 shadow-sm">
            Est. 2026 March
          </span>
          <h1 className="font-display text-6xl md:text-[8rem] lg:text-[10rem] font-black text-kado-dark tracking-tighter leading-[0.8] mb-8 uppercase">
            <span className="relative inline-block">KADO</span> <br/>
            <span className="text-kado-red">KOHI.</span>
          </h1>
          <p className="text-sm md:text-lg font-bold text-kado-dark/60 max-w-2xl leading-relaxed uppercase tracking-widest">
            The architects of your daily ritual.
          </p>
        </motion.div>
      </section>

      {/* ==============================================
          2. VALUES (THE "NIGHT" VIBE Hub)
          ============================================== */}
      <section className="py-24 md:py-32 px-6 md:px-12 w-full bg-[#FAF7F2] border-y border-kado-dark/5">
        <div className="max-w-[1200px] mx-auto z-10 relative">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-kado-dark mb-6 tracking-tighter uppercase">
              Our <span className="text-kado-red">Philosophy</span>
            </h2>
            <p className="text-kado-dark/60 max-w-2xl mx-auto text-sm md:text-base font-medium">
              The absolute standards that dictate every roast, every pour, and every conversation we have.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="bg-white border border-kado-dark/10 rounded-[1.5rem] p-8 hover:shadow-[0_20px_40px_rgba(158,24,29,0.06)] hover:-translate-y-2 hover:border-kado-red/20 transition-all duration-300 group"
              >
                <div className="w-14 h-14 bg-[#FAF7F2] rounded-2xl flex items-center justify-center text-kado-dark mb-6 group-hover:scale-110 group-hover:bg-kado-red/10 group-hover:text-kado-red transition-all duration-300 shrink-0">
                  {v.icon}
                </div>
                <h3 className="font-display font-black text-kado-dark text-xl mb-3 leading-tight group-hover:text-kado-red transition-colors">{v.title}</h3>
                <p className="text-kado-dark/60 font-medium leading-relaxed text-sm">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==============================================
          4. SCROLLING TIMELINE
          ============================================== */}
      <section className="py-24 md:py-32 px-6 md:px-12 w-full bg-white relative">
        <div className="max-w-[1000px] mx-auto">
          <div className="mb-20 text-center md:text-left border-b border-kado-dark/10 pb-12">
            <span className="text-kado-red font-black tracking-[0.2em] uppercase text-[10px] mb-4 block">The Journey</span>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-kado-dark tracking-tighter uppercase">
              Evolution of <br className="hidden md:block"/>a <span className="text-kado-red">Tambayan.</span>
            </h2>
          </div>

          <div className="relative">
            {/* The structural spine */}
            <div className="absolute left-[27px] md:left-[39px] top-4 bottom-4 w-[2px] bg-kado-dark/10"></div>

            <div className="flex flex-col gap-12 md:gap-16 relative z-10">
              {timeline.map((item, i) => (
                 <TimelineItem key={item.year} item={item} index={i} />
              ))}
            </div>
          </div>
          
          {/* Final Call to Action */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-24 pt-16 border-t border-kado-dark/10 flex flex-col md:flex-row items-center justify-between gap-8 bg-[#FAF7F2] p-8 md:p-12 rounded-[2rem]"
          >
            <div className="text-center md:text-left">
              <h3 className="font-display text-3xl font-black text-kado-dark mb-2 tracking-tight uppercase">Ready to find your corner?</h3>
              <p className="text-kado-dark/60 font-medium text-sm md:text-base">Join us at the shop for your daily ritual.</p>
            </div>
            <Link
                to="/contact"
                className="w-full md:w-auto bg-kado-dark text-white px-8 py-4 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-kado-red transition-all duration-300 shadow-lg"
              >
                <MapPin className="w-4 h-4" />
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
      className="flex gap-6 md:gap-10 items-start group"
    >
      {/* Node pin */}
      <div className="w-14 h-14 md:w-20 md:h-20 shrink-0 bg-white border-[3px] border-kado-dark/20 text-kado-dark group-hover:border-kado-red group-hover:text-kado-red rounded-full flex flex-col items-center justify-center font-display font-black transition-colors duration-300 z-10 shadow-sm relative">
        <span className="text-[7px] md:text-[9px] uppercase tracking-widest font-sans opacity-60">Est</span>
        <span className="text-xs md:text-sm leading-none mt-0.5">{item.year.includes(' ') ? item.year.split(' ')[0].slice(-2) : item.year.slice(-2)}</span>
      </div>
      
      {/* Content */}
      <div className="pt-2 md:pt-3 pb-6 border-b border-kado-dark/5 w-full">
        <h4 className="text-kado-red font-black uppercase tracking-widest text-[9px] md:text-[11px] mb-2">{item.year}</h4>
        <h3 className="font-display text-xl md:text-3xl font-black text-kado-dark mb-3 leading-tight uppercase group-hover:text-kado-red transition-colors">{item.title}</h3>
        <p className="text-kado-dark/65 font-medium text-sm md:text-base leading-relaxed max-w-xl">
          {item.desc}
        </p>
      </div>
    </motion.div>
  )
}
