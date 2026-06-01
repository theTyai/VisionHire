import React from 'react';
import { motion } from 'framer-motion';

const stats = [
  { value: '5000+', label: 'Students Impacted' },
  { value: '1000+', label: 'Workshop Participants' },
  { value: '50+', label: 'Events Organized' },
  { value: '100+', label: 'Placement Successes' },
];

export default function StatsSection() {
  return (
    <section className="relative z-20 max-w-7xl mx-auto px-6 py-12 -mt-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="flex flex-col items-center justify-center p-6 md:p-8 rounded-3xl bg-dark-900/60 border border-white/5 backdrop-blur-xl hover:border-brand-500/30 transition-colors group"
          >
            <div className="text-3xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 group-hover:from-brand-300 group-hover:to-accent-300 transition-all duration-500 mb-2">
              {stat.value}
            </div>
            <div className="text-xs md:text-sm text-gray-500 font-medium text-center uppercase tracking-wider">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
