import { motion } from 'motion/react';
import { Coffee, Clock } from 'lucide-react';

export default function Merch() {
  return (
    <div className="relative w-full min-h-screen bg-white font-sans flex flex-col items-center justify-center overflow-hidden px-6">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-kado-red/5" />
        <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full bg-kado-red/5" />
        <div
          className="hidden md:flex absolute right-0 top-0 bottom-0 w-40 lg:w-52 items-center justify-center bg-kado-red/8"
          aria-hidden
        >
          <h2 className="font-display font-black text-kado-red/20 text-[11rem] lg:text-[14rem] leading-none -rotate-90 tracking-tighter whitespace-nowrap select-none">
            MERCH
          </h2>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="relative z-10 text-center max-w-lg"
      >
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-kado-red/10 mb-8">
          <Coffee className="w-9 h-9 text-kado-red" />
        </div>

        {/* Label */}
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-kado-red mb-4">
          Shop / Merch
        </p>

        {/* Headline */}
        <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-black text-kado-dark tracking-tighter uppercase leading-none mb-6">
          Coming
          <br />
          Soon.
        </h1>

        {/* Body */}
        <p className="text-kado-dark/60 text-base md:text-lg leading-relaxed mb-10 max-w-sm mx-auto">
          We're putting together something special — premium merchandise straight from your
          favorite café. Check back soon.
        </p>

        {/* Divider with icon */}
        <div className="flex items-center justify-center gap-3 text-kado-dark/30">
          <div className="h-px w-16 bg-current" />
          <Clock className="w-4 h-4" />
          <div className="h-px w-16 bg-current" />
        </div>

        <p className="mt-4 text-xs text-kado-dark/40 font-medium tracking-wide">
          Launching later this year
        </p>
      </motion.div>
    </div>
  );
}
