import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Code, ShieldCheck, Briefcase } from 'lucide-react';

const events = [
  {
    title: 'CodeCrux',
    icon: Zap,
    color: 'from-accent-500 to-orange-500',
    tags: ['DSA & CP', '300+ Participants', 'Placement Aligned'],
    desc: 'The ultimate DSA and Competitive Programming workshop. Two days of intense logic building and a placement-level coding contest.',
  },
  {
    title: 'WebWizards',
    icon: Code,
    color: 'from-brand-400 to-brand-600',
    tags: ['Full Stack Dev', 'Industry Experts', 'Projects'],
    desc: 'Powered by Coding Thinker. Learn full-stack development directly from mentors who cracked Microsoft, Stripe, and D.E. Shaw.',
  },
  {
    title: 'OWASP Events',
    icon: ShieldCheck,
    color: 'from-purple-500 to-pink-500',
    tags: ['Cyber Security', 'CTF Competitions', 'Network Sec'],
    desc: 'Raising security awareness through hands-on Capture The Flag (CTF) competitions and ethical hacking demonstrations.',
  },
  {
    title: 'Placement Guidance',
    icon: Briefcase,
    color: 'from-emerald-400 to-emerald-600',
    tags: ['Google', 'Microsoft', 'Uber', 'Qualcomm'],
    desc: 'Exclusive panel discussions featuring placed seniors. Get insider tips, resume insights, and exact strategies to crack top MNCs.',
  },
];

export default function ImpactSection() {
  return (
    <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Impact Showcase</h2>
          <p className="text-gray-400 text-lg">Massive events that have shaped the careers of hundreds of MANIT students.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {events.map((event, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="group relative overflow-hidden p-8 rounded-3xl bg-dark-800/50 border border-white/5 backdrop-blur-sm"
          >
            <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl ${event.color} opacity-10 blur-[60px] group-hover:opacity-20 transition-opacity`} />
            
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${event.color} flex items-center justify-center text-white mb-6 shadow-lg`}>
              <event.icon size={28} />
            </div>
            
            <h3 className="text-3xl font-display font-bold text-white mb-4">{event.title}</h3>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {event.tags.map(tag => (
                <span key={tag} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-gray-300">
                  {tag}
                </span>
              ))}
            </div>
            
            <p className="text-gray-400 leading-relaxed font-medium">
              {event.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
