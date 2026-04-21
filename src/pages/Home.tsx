import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, Star, MapPin, Coffee, Bean, CalendarDays, Music, Ticket, ArrowUpRight, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="flex flex-col w-full bg-kado-cream font-sans">
      
      {/* =========================================
          1. URBAN TAMBAYAN HERO
          ========================================= */}
      <section className="relative w-full min-h-[95vh] flex items-center justify-center pt-28 pb-16 px-6 md:px-12 lg:px-24 overflow-hidden">
        
        {/* Deep, warm ambient background effects */}
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[#612821]/10 rounded-full blur-[120px] -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-[#9B2B2C]/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />
        
        <div className="max-w-[1400px] w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center z-10">
          
          {/* Typography & Narrative (Left Side) */}
          <div className="order-2 lg:order-1 lg:col-span-5 flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="flex items-center gap-2 text-kado-red font-bold tracking-[0.2em] uppercase text-xs mb-6 bg-kado-red/10 px-4 py-2 rounded-full border border-kado-red/20 shadow-sm backdrop-blur-sm">
              <MapPin className="w-3.5 h-3.5" />
              <span>Marikina City</span>
            </div>
            
            <h1 className="font-display text-5xl md:text-[5.5rem] lg:text-[6.5rem] font-bold tracking-tight text-[#2A2626] leading-[1.0] mb-6">
              Your Urban <br/>
              <span className="text-kado-red italic font-serif opacity-90 drop-shadow-sm">Tambayan.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-[#4A423C] font-medium leading-relaxed max-w-lg mb-10">
              Coffee shop by day. Chill social hub by night. A Japanese-inspired community sanctuary where extraordinary coffee meets genuine human connection.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link
                to="/menu"
                className="w-full sm:w-auto bg-[#2A2626] text-[#EFE6D5] px-8 py-4 rounded-full font-bold uppercase tracking-wider flex items-center justify-center gap-3 hover:bg-kado-red transition-all duration-300 shadow-xl shadow-black/10 hover:shadow-kado-red/20 hover:-translate-y-0.5"
              >
                Explore Menu
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/about"
                className="w-full sm:w-auto bg-transparent text-[#2A2626] px-8 py-4 rounded-full font-bold uppercase tracking-wider flex items-center justify-center gap-3 hover:bg-[#E3D8C3] transition-colors border-2 border-[#D8CABE]"
              >
                Visit Us
              </Link>
            </div>
          </div>

          {/* E-Commerce & Community Collage (Right Side) */}
          <div className="order-1 lg:order-2 lg:col-span-7 w-full relative min-h-[500px] lg:min-h-[700px] flex items-center justify-center lg:justify-end">
             
             {/* 1. Main Background Image - The Tambayan Atmosphere */}
             <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[85%] lg:w-[75%] aspect-[3/4] md:aspect-square lg:aspect-[4/5] rounded-[3rem] lg:rounded-[4rem] overflow-hidden shadow-2xl shadow-[#2A2626]/20">
               <img 
                 src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1200&auto=format&fit=crop" 
                 alt="Coffee shop interior night vibe"
                 className="object-cover w-full h-full opacity-90 hover:scale-105 transition-transform duration-1000 ease-out"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent mix-blend-multiply" />
             </div>

             {/* 2. Secondary Overlapping Image - The Coffee Focus */}
             <div className="absolute left-0 lg:left-8 bottom-[10%] lg:bottom-[20%] w-[55%] lg:w-[45%] aspect-square rounded-[2rem] lg:rounded-[3rem] overflow-hidden shadow-2xl border-8 border-kado-cream z-20">
               <img 
                 src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=800&auto=format&fit=crop" 
                 alt="Barista pouring coffee"
                 className="object-cover w-full h-full hover:scale-110 transition-transform duration-700 ease-out"
               />
             </div>

             {/* 3. Floating E-Commerce Tasting Card */}
             <div className="absolute top-[5%] lg:top-[15%] left-[5%] lg:left-[10%] bg-white/80 backdrop-blur-xl border border-white/40 p-5 rounded-3xl shadow-xl shadow-black/10 z-30 max-w-[240px] transform hover:-translate-y-1 transition-transform">
                <div className="flex justify-between items-start mb-3">
                  <div className="bg-[#612821]/10 p-2 rounded-xl">
                    <Coffee className="w-5 h-5 text-kado-red" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-kado-red bg-kado-red/10 px-2 py-1 rounded-full border border-kado-red/20 shadow-sm backdrop-blur-sm">Single Origin</span>
                </div>
                <h4 className="font-display font-bold text-[#2A2626] text-lg leading-tight mb-1">Ethiopia Yirgacheffe</h4>
                <p className="text-[10px] text-[#4A423C] font-semibold uppercase tracking-wider mb-3 flex items-center gap-1">
                   <Bean className="w-3 h-3"/> Light-Medium Roast
                </p>
                <div className="w-full h-px bg-[#D8CABE] mb-3" />
                <p className="text-xs text-[#2A2626] font-medium">Taste Notes:</p>
                <p className="text-xs text-[#4A423C] italic">Jasmine, Bergamot, Honey</p>
             </div>

          </div>

        </div>
      </section>

      {/* =========================================
          2. THE KADO EXPERIENCE (Horizontal Scroll)
          ========================================= */}
      <HorizontalScrollSection />

      {/* =========================================
          3. SIGNATURE SIPS PREVIEW
          ========================================= */}
      <SignatureSipsSection />

      {/* =========================================
          4. SOCIAL HUB & EVENTS (Instagram Style)
          ========================================= */}
      <EventsSection />

      {/* =========================================
          5. KADO CIRCLE (Newsletter/Loyalty)
          ========================================= */}
      <KadoCircleSection />

    </div>
  );
}

// =========================================
// Horizontal Scroll Sub-Component
// =========================================
function HorizontalScrollSection() {
  const targetRef = useRef<HTMLDivElement>(null);
  
  // Track this section's vertical scroll
  const { scrollYProgress } = useScroll({ 
    target: targetRef
  });

  // Map 0 -> 1 vertical scroll to 0% -> -66.66% horizontal slide
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-66.6666%"]);

  return (
    <section ref={targetRef} className="relative h-[400vh] bg-kado-dark">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <motion.div style={{ x }} className="flex w-[300vw] h-full will-change-transform">
          
          {/* Panel 1: Premium Beans (Cream) */}
          <div className="w-[100vw] h-full bg-kado-cream flex items-center justify-center p-8 md:p-24 shrink-0">
             <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="order-2 lg:order-1">
                   <span className="text-kado-red font-bold tracking-[0.2em] uppercase text-sm mb-4 block">Our Sourcing</span>
                   <h2 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-kado-dark mb-6 leading-tight">
                     Premium<br/><span className="text-kado-red italic">Beans.</span>
                   </h2>
                   <p className="text-xl md:text-2xl text-kado-dark/70 font-medium leading-relaxed max-w-xl">
                     We source the absolute finest 100% Arabica beans from sustainable, high-elevation farms across the Philippines. Everything starts here.
                   </p>
                </div>
                <div className="order-1 lg:order-2 h-[40vh] lg:h-[70vh] w-full rounded-[2rem] lg:rounded-[3rem] overflow-hidden shadow-2xl relative shadow-kado-dark/10">
                   <img src="https://images.unsplash.com/photo-1611162458324-aae1eb4129a4?q=80&w=800&auto=format&fit=crop" className="object-cover w-full h-full hover:scale-105 transition-transform duration-1000" alt="Coffee Beans" />
                </div>
             </div>
          </div>

          {/* Panel 2: Master Crafted (Dark) */}
          <div className="w-[100vw] h-full bg-kado-dark flex items-center justify-center p-8 md:p-24 shrink-0 relative">
             <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
                <div className="h-[40vh] lg:h-[70vh] w-full rounded-[2rem] lg:rounded-[3rem] overflow-hidden shadow-2xl relative shadow-black/50">
                   <img src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=800&auto=format&fit=crop" className="object-cover w-full h-full grayscale opacity-80 mix-blend-luminosity hover:scale-105 hover:grayscale-0 transition-all duration-1000" alt="Barista pouring coffee" />
                </div>
                <div>
                   <span className="text-kado-cream/50 font-bold tracking-[0.2em] uppercase text-sm mb-4 block">The Process</span>
                   <h2 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-kado-cream mb-6 leading-tight">
                     Master<br/><span className="text-kado-red italic">Crafted.</span>
                   </h2>
                   <p className="text-xl md:text-2xl text-kado-cream/70 font-medium leading-relaxed max-w-xl">
                     A great bean requires a great master. Every cup is painstakingly brewed with precision by baristas harboring over 15 years of industry experience.
                   </p>
                </div>
             </div>
             {/* Background watermark */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[30vw] font-bold text-white/5 font-display select-none pointer-events-none whitespace-nowrap">
               BREW
             </div>
          </div>

          {/* Panel 3: Cozy Atmosphere (Red) */}
          <div className="w-[100vw] h-full bg-[#8c2627] flex items-center justify-center p-8 md:p-24 shrink-0 relative overflow-hidden">
             
             {/* Abstract wave overlay */}
             <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_transparent_0%,_#000_100%)]"></div>

             <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
                <div className="order-2 lg:order-1 outline-none">
                   <span className="text-kado-cream/50 font-bold tracking-[0.2em] uppercase text-sm mb-4 block">Our Space</span>
                   <h2 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-kado-cream mb-6 leading-tight">
                     Quiet<br/><span className="text-kado-dark italic">Retreat.</span>
                   </h2>
                   <p className="text-xl md:text-2xl text-kado-cream/90 font-medium leading-relaxed max-w-xl mb-10">
                     A deeply warm, minimalist Japanese-inspired cafe designed for deep focus, calm relaxation, and genuine human connection.
                   </p>
                   {/* Clean closing CTA block to exit the page gracefully */}
                   <Link to="/about" className="inline-flex items-center gap-2 border-b-2 border-kado-cream pb-1 text-kado-cream font-bold uppercase tracking-widest hover:text-kado-dark hover:border-kado-dark transition-colors">
                     Discover Our Story <ArrowRight className="w-5 h-5"/>
                   </Link>
                </div>
                <div className="order-1 lg:order-2 h-[40vh] lg:h-[70vh] w-full rounded-[2rem] lg:rounded-[3rem] overflow-hidden shadow-2xl shadow-kado-dark/30 border border-kado-cream/10 relative">
                   <img src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800&auto=format&fit=crop" className="object-cover w-full h-full opacity-90 sepia-[.2] hover:scale-105 transition-transform duration-1000" alt="Coffee shop interior" />
                </div>
             </div>
          </div>

        </motion.div>
      </div>
    </section>
  );
}

// =========================================
// Signature Sips Drag-Carousel Component
// =========================================
const signatureDrinks = [
  { name: 'Kado Blend', desc: 'Notes of chocolate, caramel, citrus.', price: '₱140', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=400&auto=format&fit=crop' },
  { name: 'Matcha Latte', desc: 'Ceremonial grade pure matcha.', price: '₱170', image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=400&auto=format&fit=crop' },
  { name: 'Cold Brew', desc: '18-hour steep, ultra-smooth.', price: '₱160', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?q=80&w=400&auto=format&fit=crop' },
];

function SignatureSipsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  return (
    <section className="py-24 px-6 md:px-12 lg:px-24 w-full bg-[#FAF7F2] border-t border-[#D8CABE]">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-16">
          <div>
            <span className="text-kado-red font-bold tracking-[0.2em] uppercase text-xs mb-3 block">Bestsellers</span>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-[#2A2626]">
              Signature <span className="text-[#612821] italic font-serif">Sips.</span>
            </h2>
          </div>
          <p className="text-[#4A423C] font-medium max-w-sm hidden md:block">Explore our community's highest-rated daily rituals. Hand-crafted, every single time.</p>
        </div>

        {/* Lock Horizontal Completely with a Rigid 3-Column CSS Grid */}
        <div className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full pb-8">
            {signatureDrinks.map((drink, i) => (
              <motion.div 
                key={drink.name} 
                className="w-full bg-white rounded-[2.5rem] p-6 shadow-xl shadow-black/5 border border-[#E3D8C3] group"
                whileHover={{ y: -10 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="w-full aspect-[4/5] rounded-[2rem] overflow-hidden mb-6 relative bg-[#EFE6D5]">
                  <img src={drink.image} alt={drink.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-display font-bold text-xl text-[#2A2626]">{drink.name}</h3>
                    <p className="text-sm font-medium text-[#4A423C] opacity-80 mt-1">{drink.desc}</p>
                  </div>
                  <span className="font-bold text-kado-red">{drink.price}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        
        <div className="mt-16 flex justify-center">
            <Link to="/menu" className="inline-flex items-center gap-2 border-b-2 border-kado-red pb-1 text-[#2A2626] font-bold uppercase tracking-widest hover:text-kado-red transition-colors">
              View Full Menu <ArrowRight className="w-4 h-4"/>
            </Link>
        </div>
      </div>
    </section>
  );
}

// =========================================
// Events / Social Hub (Instagram Style)
// =========================================

// Custom hook for the event countdown
function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const difference = targetDate.getTime() - new Date().getTime();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
}

const events = [
  { date: '28 NOV', title: 'Kado After Dark: DJ Set', desc: 'The espresso machine shuts down. The subwoofers turn on. Neon lights, local underground DJs, and the absolute best urban hangout crowd in Marikina.', img: 'https://images.unsplash.com/photo-1545128485-c400e7702796?q=80&w=1200&auto=format&fit=crop', icon: <Music className="w-5 h-5"/>, full: true },
];

function EventsSection() {
  // A dynamic future date (e.g., 5 days from now) for the prototype
  const targetDate = new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000);
  const countdown = useCountdown(targetDate);

  const ev = events[0];

  return (
    <section className="py-24 px-6 md:px-12 lg:px-24 w-full bg-[#EFE6D5]">
      <div className="max-w-[1400px] mx-auto">
        
        <div className="text-center mb-16 md:mb-20">
          <span className="inline-flex items-center gap-2 text-kado-red font-bold tracking-[0.2em] uppercase text-xs mb-4 bg-kado-red/10 px-4 py-2 rounded-full border border-kado-red/20 shadow-sm">
            <CalendarDays className="w-4 h-4" /> Next Massive Event
          </span>
          <h2 className="font-display text-4xl md:text-6xl lg:text-8xl font-bold text-[#2A2626] leading-tight">
            More than a <span className="text-[#612821] italic font-serif opacity-90">Corner.</span>
          </h2>
          <p className="text-xl md:text-2xl text-[#4A423C] font-medium mx-auto max-w-3xl mt-6 px-4 md:px-0 leading-relaxed">
            Coffee shop by day. Club and hangout by night. The definitive Marikina social experience.
          </p>
        </div>

        {/* Massive Highlight Hub DJ Event */}
        <div className="w-full">
             <div className="relative rounded-[3rem] overflow-hidden group cursor-pointer border border-[#2A2626]/20 shadow-2xl shadow-black/40 min-h-[500px] lg:h-[750px] w-full">
               <img src={ev.img} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s] ease-out brightness-[0.7] contrast-[1.1]" />
               <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/95 opacity-90 transition-opacity" />
               
               {/* Event Details Card Layout */}
               <div className="absolute inset-0 p-8 lg:p-16 flex flex-col justify-between">
                 {/* Top Row: Date, Icon & Potential Countdown */}
                 <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="bg-[#EFE6D5] text-[#2A2626] font-display font-bold text-2xl lg:text-3xl px-6 py-4 rounded-[1.5rem] shadow-2xl leading-none text-center">
                       {ev.date.split(' ')[0]} <br/> <span className="text-xs font-sans uppercase tracking-widest text-kado-red mt-1 block">{ev.date.split(' ')[1]}</span>
                    </div>
                    {/* Live Countdown specifically for the main DJ event */}
                    <div className="flex gap-2 lg:gap-4 bg-black/60 backdrop-blur-2xl border border-white/20 px-6 py-4 lg:px-8 lg:py-5 rounded-[2rem] shadow-2xl">
                        <div className="text-center">
                          <span className="block font-display font-bold text-2xl lg:text-4xl text-kado-red leading-none">{String(countdown.days).padStart(2, '0')}</span>
                          <span className="text-[10px] lg:text-xs uppercase tracking-widest text-[#A09A90] font-bold mt-1 block">Days</span>
                        </div>
                        <span className="text-white/30 font-bold self-start mt-1 hidden sm:block">:</span>
                        <div className="text-center hidden sm:block">
                          <span className="block font-display font-bold text-2xl lg:text-4xl text-white leading-none">{String(countdown.hours).padStart(2, '0')}</span>
                          <span className="text-[10px] lg:text-xs uppercase tracking-widest text-[#A09A90] font-bold mt-1 block">Hrs</span>
                        </div>
                        <span className="text-white/30 font-bold self-start mt-1 hidden sm:block">:</span>
                        <div className="text-center hidden sm:block">
                          <span className="block font-display font-bold text-2xl lg:text-4xl text-white leading-none">{String(countdown.minutes).padStart(2, '0')}</span>
                          <span className="text-[10px] lg:text-xs uppercase tracking-widest text-[#A09A90] font-bold mt-1 block">Min</span>
                        </div>
                        <span className="text-white/30 font-bold self-start mt-1 hidden lg:block">:</span>
                        <div className="text-center hidden lg:block">
                          <span className="block font-display font-bold text-2xl lg:text-4xl text-white leading-none">{String(countdown.seconds).padStart(2, '0')}</span>
                          <span className="text-[10px] lg:text-xs uppercase tracking-widest text-[#A09A90] font-bold mt-1 block">Sec</span>
                        </div>
                    </div>
                 </div>

                 {/* Bottom Row: Content & CTA */}
                 <div className="transform transition-transform duration-700 w-full max-w-3xl">
                    <h3 className="font-display font-bold text-4xl lg:text-7xl text-white mb-4 lg:mb-6 leading-tight drop-shadow-2xl">{ev.title}</h3>
                    <p className="text-[#EFE6D5]/90 font-medium text-lg lg:text-2xl leading-relaxed mb-8 drop-shadow-md">{ev.desc}</p>
                    <div className="flex items-center gap-3 text-kado-cream hover:text-white font-bold text-sm lg:text-base uppercase tracking-[0.2em] bg-kado-red/90 hover:bg-kado-red w-max px-8 py-4 rounded-full backdrop-blur-md border border-red-500/50 shadow-[0_0_30px_rgba(155,43,44,0.4)] transition-all">
                       Secure VIP Tickets <ArrowUpRight className="w-5 h-5"/>
                    </div>
                 </div>
               </div>
             </div>
        </div>

      </div>
    </section>
  );
}

// =========================================
// Kado Circle Newsletter / Footer Hook
// =========================================
function KadoCircleSection() {
  return (
    <section className="px-6 md:px-12 lg:px-24 w-full bg-[#EFE6D5] pb-12">
      <div className="max-w-[1400px] mx-auto bg-[#1A1818] rounded-[3rem] p-10 md:p-20 relative overflow-hidden shadow-2xl">
        
        {/* Deep moody glow */}
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[#9B2B2C]/10 rounded-full blur-[140px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
           <div className="text-center lg:text-left max-w-xl">
             <span className="text-kado-red font-bold tracking-[0.2em] uppercase text-xs mb-4 block flex items-center justify-center lg:justify-start gap-2">
               <Mail className="w-4 h-4"/> The Inner Circle
             </span>
             <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-[#EFE6D5] leading-tight mb-4">
               Join the <span className="text-kado-red italic font-serif">Kado Circle.</span>
             </h2>
             <p className="text-[#A09A90] font-medium text-lg leading-relaxed">
               Dropping curated invites to private events, secret menu previews, and your trackable loyalty stamp card. Become a local.
             </p>
           </div>

           <div className="w-full lg:w-auto flex-1 max-w-md">
             <form className="relative flex flex-col gap-4">
               <input 
                 type="email" 
                 placeholder="Enter your email address"
                 className="w-full bg-[#2A2626] border border-[#4A423C] text-[#EFE6D5] placeholder:text-[#A09A90] px-6 py-5 rounded-2xl focus:outline-none focus:border-kado-red focus:ring-1 focus:ring-kado-red transition-all shadow-inner"
               />
               <button 
                 type="submit" 
                 className="w-full bg-[#EFE6D5] text-[#1A1818] font-bold uppercase tracking-widest text-sm px-6 py-5 rounded-2xl hover:bg-kado-red hover:text-white transition-colors flex items-center justify-center gap-2"
               >
                 Request Access <ArrowRight className="w-5 h-5"/>
               </button>
             </form>
           </div>
        </div>
      </div>
    </section>
  );
}
