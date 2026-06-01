import React from 'react';
import { motion } from 'framer-motion';
import { Code2, Globe, Shield, Cpu, GitPullRequest, Trophy, Compass, Mic2 } from 'lucide-react';

const domains = [
  { icon: Code2, title: 'DSA & CP', desc: 'Master competitive programming and core algorithms.', color: 'emerald' },
  { icon: Globe, title: 'Web Development', desc: 'Build scalable full-stack applications.', color: 'brand' },
  { icon: Shield, title: 'Cyber Security', desc: 'Learn ethical hacking and network security.', color: 'purple' },
  { icon: Cpu, title: 'Artificial Intelligence', desc: 'Dive into machine learning and neural networks.', color: 'accent' },
  { icon: GitPullRequest, title: 'Open Source', desc: 'Contribute to global real-world projects.', color: 'gray' },
  { icon: Trophy, title: 'Hackathons', desc: 'Compete in nationwide coding marathons.', color: 'brand' },
  { icon: Compass, title: 'Career Guidance', desc: 'Resume reviews, mock interviews, and strategy.', color: 'emerald' },
  { icon: Mic2, title: 'Industry Talks', desc: 'Learn directly from FAANG/MAANG engineers.', color: 'accent' },
];

export default function WhatWeDoSection() {
  return (
    <section className="relative z-10 max-w-7xl mx-auto px-6 py-24 bg-dark-900/30">
      <div className="text-center mb-20">
        <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">What We Do</h2>
        <p className="text-gray-400 text-lg">A diverse range of tech stacks and career-building initiatives.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {domains.map((domain, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className="p-6 rounded-2xl bg-dark-800/40 border border-white/5 backdrop-blur-sm hover:bg-dark-800 hover:border-brand-500/30 group transition-all"
          >
            <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform ${
              domain.color === 'emerald' ? 'text-emerald-400 group-hover:bg-emerald-500/20' :
              domain.color === 'accent' ? 'text-accent-400 group-hover:bg-accent-500/20' :
              domain.color === 'purple' ? 'text-purple-400 group-hover:bg-purple-500/20' :
              domain.color === 'gray' ? 'text-gray-300 group-hover:bg-gray-500/20' :
              'text-brand-400 group-hover:bg-brand-500/20'
            }`}>
              <domain.icon size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{domain.title}</h3>
            <p className="text-sm text-gray-400 mb-6">{domain.desc}</p>
            <button className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
              Learn More <span>→</span>
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
