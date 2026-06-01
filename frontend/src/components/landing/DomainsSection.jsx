import React from 'react';
import { motion } from 'framer-motion';

const domains = [
  {
    name: 'Technical Team',
    skills: ['DSA', 'Competitive Programming', 'Logic Building'],
    color: 'emerald',
  },
  {
    name: 'Development Team',
    skills: ['React', 'Node.js', 'System Design'],
    color: 'brand',
  },
  {
    name: 'Cyber Security Team',
    skills: ['CTFs', 'Ethical Hacking', 'OWASP'],
    color: 'purple',
  },
  {
    name: 'Design Team',
    skills: ['UI/UX', 'Figma', 'Graphic Design'],
    color: 'accent',
  },
  {
    name: 'Content & Marketing',
    skills: ['Copywriting', 'SEO', 'Social Media Strategy'],
    color: 'gray',
  },
  {
    name: 'Management Team',
    skills: ['Event Planning', 'Leadership', 'Sponsorships'],
    color: 'brand',
  },
];

export default function DomainsSection() {
  return (
    <section id="domains" className="relative z-10 max-w-7xl mx-auto px-6 py-24">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Recruitment Domains</h2>
        <p className="text-gray-400 text-lg">Find your niche and master it with elite peers.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {domains.map((domain, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="p-8 rounded-3xl bg-dark-800/50 border border-white/5 backdrop-blur-md hover:-translate-y-2 transition-transform duration-300"
          >
            <h3 className="text-2xl font-display font-bold text-white mb-6">{domain.name}</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-3">Skills You'll Master</h4>
                <div className="flex flex-wrap gap-2">
                  {domain.skills.map(skill => (
                    <span key={skill} className="px-3 py-1.5 rounded-lg bg-dark-900/80 border border-white/5 text-sm font-medium text-gray-300">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
