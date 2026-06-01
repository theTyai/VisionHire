import React from 'react';
import { motion } from 'framer-motion';

const steps = [
  { num: '01', title: 'Application Submission', desc: 'Fill out the form and choose your preferred domains.' },
  { num: '02', title: 'Online Assessment', desc: 'Take the domain-specific test on the VisionHire engine.' },
  { num: '03', title: 'Shortlisting', desc: 'Top performers are selected for the interview rounds.' },
  { num: '04', title: 'Interview Round', desc: 'Technical & HR interviews with domain heads.' },
  { num: '05', title: 'Onboarding', desc: 'Welcome to the elite Vision CSE community!' },
];

export default function TimelineSection() {
  return (
    <section className="relative z-10 max-w-4xl mx-auto px-6 py-24">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Recruitment Process</h2>
        <p className="text-gray-400 text-lg">Your journey to joining MANIT's top technical society.</p>
      </div>

      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-500 to-accent-500 rounded-full opacity-30" />

        <div className="space-y-12">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.2 }}
              className="relative pl-24"
            >
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-dark-900 border-4 border-brand-500 flex items-center justify-center font-bold text-xs text-white z-10 shadow-[0_0_15px_rgba(13,111,86,0.6)]">
                {step.num}
              </div>
              
              <div className="p-6 rounded-2xl bg-dark-800/40 border border-white/5 backdrop-blur-sm hover:border-brand-500/30 transition-colors">
                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-gray-400 font-medium">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
