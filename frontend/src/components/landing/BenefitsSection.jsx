import React from 'react';
import { motion } from 'framer-motion';
import { Layers, Star, Users, Navigation, FileText, CheckCircle2 } from 'lucide-react';

const benefits = [
  { icon: Layers, title: 'Build Real Projects', desc: 'Work on production-level apps and open-source contributions.' },
  { icon: Star, title: 'Gain Leadership Experience', desc: 'Organize massive workshops, hackathons, and lead teams.' },
  { icon: Users, title: 'Learn from Experts', desc: 'Direct mentorship from alumni at Microsoft, Google, and Stripe.' },
  { icon: Navigation, title: 'Expand Network', desc: 'Connect with driven peers and an elite alumni network.' },
  { icon: FileText, title: 'Improve Resume', desc: 'Add serious weight to your portfolio with impactful work.' },
  { icon: CheckCircle2, title: 'Placement Prep', desc: 'Rigorous mock interviews and DSA & CP rounds.' },
];

export default function BenefitsSection() {
  return (
    <section className="relative z-10 max-w-7xl mx-auto px-6 py-24 bg-dark-900/30">
      <div className="text-center mb-20">
        <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Why Join Vision CSE?</h2>
        <p className="text-gray-400 text-lg">More than a club. We are an ecosystem for top-tier engineers.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {benefits.map((benefit, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="flex items-start gap-4 p-6 rounded-2xl bg-dark-800/40 border border-white/5 hover:border-brand-500/30 transition-colors"
          >
            <div className="w-12 h-12 shrink-0 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <benefit.icon size={24} />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white mb-2">{benefit.title}</h4>
              <p className="text-sm text-gray-400 leading-relaxed">{benefit.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
