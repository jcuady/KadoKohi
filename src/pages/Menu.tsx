import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Coffee, Leaf, IceCreamCone, CakeSlice } from 'lucide-react';
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
    <div className="flex flex-col">
      {/* Page Hero */}
      <section className="pt-12 pb-8 px-6">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            label="Our Menu"
            title="Crafted With Passion"
            subtitle="Every drink is hand-prepared with premium ingredients and served with care. Explore our full menu below."
          />
        </div>
      </section>

      {/* Category Tabs */}
      <section className="px-6 pb-8">
        <div className="max-w-7xl mx-auto flex justify-center">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.key
                    ? 'bg-kado-dark text-kado-cream shadow-lg'
                    : 'bg-white/60 border border-kado-red/10 hover:border-kado-red/30 hover:bg-white'
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="group bg-white/70 backdrop-blur-sm border border-kado-red/10 rounded-2xl overflow-hidden hover:shadow-xl hover:border-kado-red/20 transition-all"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  {item.tag && (
                    <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider bg-kado-red text-kado-cream px-3 py-1 rounded-full">
                      {item.tag}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-display font-bold text-kado-dark group-hover:text-kado-red transition-colors">
                      {item.name}
                    </h3>
                    <span className="font-display font-bold text-kado-red whitespace-nowrap">
                      {item.price}
                    </span>
                  </div>
                  <p className="text-xs text-kado-dark/60 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
