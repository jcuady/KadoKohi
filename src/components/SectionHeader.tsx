import { motion } from 'motion/react';

interface SectionHeaderProps {
  label: string;
  title: string;
  subtitle?: string;
}

export default function SectionHeader({ label, title, subtitle }: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-center mb-16"
    >
      <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-kado-red bg-kado-red/10 px-4 py-2 rounded-full mb-4">
        {label}
      </span>
      <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-kado-dark leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-kado-dark/60 max-w-lg mx-auto leading-relaxed">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
