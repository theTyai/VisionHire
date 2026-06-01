import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Code, Users, Rocket, Target } from 'lucide-react';

const timeline = [
  { icon: BookOpen, label: 'Learn', desc: 'Master fundamentals' },
  { icon: Code, label: 'Build', desc: 'Real-world projects' },
  { icon: Users, label: 'Collaborate', desc: 'Work in elite teams' },
  { icon: Target, label: 'Lead', desc: 'Mentor juniors' },
  { icon: Rocket, label: 'Succeed', desc: 'Top placements' },
];

export default function AboutSection() {
  return (
    <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center max-w-3xl mx-auto mb-20"
      >
        <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">More Than Just a Club.</h2>
        <p className="text-xl text-gray-400">
          Vision CSE is a powerhouse of Technical Growth, Career Guidance, Industry Mentorship, and Innovation.
        </p>
      </motion.div>

      <div className="relative">
        {/* Connecting line */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-brand-500/0 via-brand-500/30 to-brand-500/0 -translate-y-1/2 hidden md:block" />
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-4 relative z-10">
          {timeline.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="flex flex-col items-center text-center group"
            >
              <div className="w-16 h-16 rounded-2xl bg-dark-800 border border-white/10 flex items-center justify-center text-brand-400 mb-4 group-hover:bg-brand-500 group-hover:text-white group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(13,111,86,0.4)] transition-all duration-300">
                <step.icon size={28} />
              </div>
              <h4 className="text-lg font-bold text-gray-200 mb-1 group-hover:text-brand-300 transition-colors">{step.label}</h4>
              <p className="text-xs text-gray-500 font-medium">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
