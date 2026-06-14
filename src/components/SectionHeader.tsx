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
      <span className="inline-block kado-label text-kado-red bg-kado-red/10 px-4 py-2 rounded-full mb-4">
        {label}
      </span>
      <h2 className="kado-h2 text-kado-dark">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 kado-body text-kado-dark/60 max-w-lg mx-auto">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
