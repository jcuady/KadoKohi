import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Coffee, Leaf, IceCreamCone, CakeSlice, Star } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';

type Category = 'hot' | 'cold' | 'specialty' | 'pastries';

interface MenuItem {
  name: string;
  desc: string;
  price: string;
  tag?: string;
  image: string;
}

const categories: { key: Category; label: string; icon: React.ReactNode }[] = [
  { key: 'hot', label: 'Hot Coffee', icon: <Coffee className="w-4 h-4" /> },
  { key: 'cold', label: 'Iced Drinks', icon: <IceCreamCone className="w-4 h-4" /> },
  { key: 'specialty', label: 'Specialty', icon: <Leaf className="w-4 h-4" /> },
  { key: 'pastries', label: 'Pastries', icon: <CakeSlice className="w-4 h-4" /> },
];

const menuItems: Record<Category, MenuItem[]> = {
  hot: [
    {
      name: 'Kado Blend',
      desc: 'Our signature house blend — a medium roast with notes of chocolate, caramel, and a hint of citrus.',
      price: '₱140',
      tag: 'Bestseller',
      image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=400&auto=format&fit=crop',
    },
    {
      name: 'Cappuccino',
      desc: 'Classic espresso with velvety steamed milk and a thick layer of micro-foam.',
      price: '₱150',
      image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?q=80&w=400&auto=format&fit=crop',
    },
    {
      name: 'Pour Over',
      desc: 'Single-origin beans hand-poured for a clean, bright, and nuanced cup.',
      price: '₱180',
      tag: 'Premium',
      image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=400&auto=format&fit=crop',
    },
    {
      name: 'Flat White',
      desc: 'Double ristretto with silky steamed milk — bold yet smooth.',
      price: '₱160',
      image: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?q=80&w=400&auto=format&fit=crop',
    },
  ],
  cold: [
    {
      name: 'Iced Americano',
      desc: 'Bold espresso over ice with cold water — crisp and refreshing.',
      price: '₱130',
      image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=400&auto=format&fit=crop',
    },
    {
      name: 'Cold Brew',
      desc: 'Slow-steeped for 18 hours for an ultra-smooth, low-acid finish.',
      price: '₱160',
      tag: 'Popular',
      image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?q=80&w=400&auto=format&fit=crop',
    },
    {
      name: 'Iced Latte',
      desc: 'Espresso and cold milk over ice — simple, creamy, and classic.',
      price: '₱150',
      image: 'https://images.unsplash.com/photo-1592663527359-cf6642f54cff?q=80&w=400&auto=format&fit=crop',
    },
    {
      name: 'Matcha Latte',
      desc: 'Ceremonial-grade Japanese matcha whisked with your choice of milk.',
      price: '₱170',
      image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=400&auto=format&fit=crop',
    },
  ],
  specialty: [
    {
      name: 'Kado Sunset',
      desc: 'A layered iced drink with espresso, passion fruit, and coconut cream.',
      price: '₱190',
      tag: 'Limited',
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?q=80&w=400&auto=format&fit=crop',
    },
    {
      name: 'Brown Sugar Oat Latte',
      desc: 'Caramelized brown sugar with espresso and creamy oat milk.',
      price: '₱180',
      tag: 'Popular',
      image: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?q=80&w=400&auto=format&fit=crop',
    },
    {
      name: 'Spanish Latte',
      desc: 'Concentrated espresso with sweetened condensed milk — rich and indulgent.',
      price: '₱170',
      image: 'https://images.unsplash.com/photo-1534687941688-651ccaafbff8?q=80&w=400&auto=format&fit=crop',
    },
    {
      name: 'Affogato',
      desc: 'A scoop of vanilla gelato drowned in a shot of hot espresso.',
      price: '₱200',
      image: 'https://images.unsplash.com/photo-1579888944880-d98341245702?q=80&w=400&auto=format&fit=crop',
    },
  ],
  pastries: [
    {
      name: 'Butter Croissant',
      desc: 'Flaky, golden, and made fresh daily with French butter.',
      price: '₱95',
      image: 'https://images.unsplash.com/photo-1555507036-ab1f4038024a?q=80&w=400&auto=format&fit=crop',
    },
    {
      name: 'Matcha Cheesecake',
      desc: 'Creamy Japanese cheesecake with a subtle matcha flavor.',
      price: '₱180',
      tag: 'New',
      image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=400&auto=format&fit=crop',
    },
    {
      name: 'Cinnamon Roll',
      desc: 'Soft, warm, and drizzled with cream cheese glaze.',
      price: '₱120',
      image: 'https://images.unsplash.com/photo-1509365390695-33aee754301f?q=80&w=400&auto=format&fit=crop',
    },
    {
      name: 'Banana Bread',
      desc: 'Moist, nutty, and lightly spiced — a perfect coffee companion.',
      price: '₱100',
      image: 'https://images.unsplash.com/photo-1605090930601-47d2f425a888?q=80&w=400&auto=format&fit=crop',
    },
  ],
};

export default function Menu() {
  const [activeCategory, setActiveCategory] = useState<Category>('hot');

  return (
    <div className="flex flex-col w-full bg-kado-cream font-sans min-h-screen">
      {/* Page Hero */}
      <section className="pt-28 pb-8 px-6">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            label="Daily Rituals"
            title="Our Menu"
            subtitle="Carefully sourced beans, masterful techniques, and a touch of Japanese minimalism. Discover your new favorite sip."
          />
        </div>
      </section>

      {/* Category Tabs */}
      <section className="px-6 pb-12">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          
          <LoyaltyCard />

          <div className="flex flex-wrap items-center justify-center gap-3 w-full">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                  activeCategory === cat.key
                    ? 'bg-[#2A2626] text-[#EFE6D5] shadow-xl shadow-[#2A2626]/20 -translate-y-1'
                    : 'bg-transparent border-2 border-[#D8CABE] text-[#4A423C] hover:border-[#2A2626]/50 hover:text-[#2A2626]'
                }`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Menu Grid */}
      <section className="px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {menuItems[activeCategory].map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, ease: "easeOut" }}
                className="group bg-[#FAF7F2] border border-[#E3D8C3] rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:shadow-[#2A2626]/10 hover:-translate-y-1.5 transition-all duration-500"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[#E3D8C3]/30">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    referrerPolicy="no-referrer"
                  />
                  {/* Subtle inner shadow for premium feel */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {item.tag && (
                    <span className="absolute top-4 left-4 text-[9px] font-bold uppercase tracking-widest bg-[#9B2B2C] text-[#EFE6D5] px-3 py-1.5 rounded-full shadow-lg shadow-black/20">
                      {item.tag}
                    </span>
                  )}
                </div>
                <div className="p-6 md:p-8">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-display font-bold text-xl md:text-2xl text-[#2A2626] group-hover:text-kado-red transition-colors leading-tight">
                      {item.name}
                    </h3>
                    <span className="font-sans font-bold text-lg md:text-xl text-kado-red whitespace-nowrap">
                      {item.price}
                    </span>
                  </div>
                  <p className="text-sm md:text-base font-medium text-[#4A423C]/80 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}

// =========================================
// Loyalty Card UI Sub-Component
// =========================================
function LoyaltyCard() {
  return (
    <div className="w-full max-w-4xl mx-auto mb-16 relative">
      {/* Decorative shadow layer */}
      <div className="absolute inset-0 bg-[#612821]/10 translate-x-3 translate-y-3 rounded-[2.5rem]" />
      
      <div className="relative bg-[#2A2626] border border-[#4A423C] p-8 md:p-12 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden shadow-2xl">
        
        {/* Abstract watermark */}
        <div className="absolute -right-16 -bottom-16 opacity-5 pointer-events-none">
          <Coffee className="w-64 h-64 text-white" />
        </div>
        
        <div className="flex flex-col text-center md:text-left z-10 max-w-sm">
          <p className="text-kado-red font-bold tracking-[0.2em] uppercase text-[10px] mb-3 flex items-center justify-center md:justify-start gap-2">
            <Star className="w-3.5 h-3.5 fill-current"/> Member Rewards
          </p>
          <h3 className="font-display text-3xl md:text-4xl text-[#EFE6D5] font-bold mb-4 leading-tight">
            Earn Your <br className="hidden md:block"/>Free Cup.
          </h3>
          <p className="text-[#A09A90] text-sm md:text-base font-medium leading-relaxed">
            Every coffee brings you closer to your next reward. Buy 9, get your 10th cup completely on us.
          </p>
        </div>

        <div className="relative bg-[#FAF7F2]/5 p-6 md:p-8 rounded-3xl border border-white/5 z-10 w-full md:w-auto backdrop-blur-sm">
           <div className="grid grid-cols-5 gap-3 md:gap-4">
             {Array.from({ length: 10 }).map((_, i) => (
               <div key={i} className="relative flex items-center justify-center">
                 {/* The stamp circle */}
                 <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full border-2 flex items-center justify-center transition-all ${
                   i < 3 
                     ? 'border-kado-red bg-kado-red/10 text-kado-red shadow-[0_0_15px_rgba(155,43,44,0.3)]' 
                     : 'border-white/10 bg-transparent text-white/20 border-dashed'
                 }`}>
                   {i === 9 ? (
                     <Star className={`w-5 h-5 md:w-6 md:h-6 ${i < 3 ? 'fill-current' : ''}`} />
                   ) : (
                     <Coffee className="w-5 h-5 md:w-6 md:h-6" />
                   )}
                 </div>
                 
                 {/* Simulated "stamp" physical overlay */}
                 {i < 3 && (
                   <motion.div 
                     initial={{ scale: 0, opacity: 0, rotate: -30 }}
                     animate={{ scale: 1, opacity: 1, rotate: [-15, 5, -5] }}
                     transition={{ duration: 0.5, delay: i * 0.15, type: 'spring', stiffness: 200 }}
                     className="absolute inset-0 flex items-center justify-center pointer-events-none"
                   >
                      <div className="w-8 h-8 md:w-10 md:h-10 border-[3px] border-kado-red rounded-full opacity-40 mix-blend-color-dodge flex items-center justify-center">
                         <span className="text-[8px] font-bold text-kado-red uppercase tracking-widest rotate-12">Kado</span>
                      </div>
                   </motion.div>
                 )}
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  )
}
