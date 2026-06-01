import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  { q: 'Who can apply?', a: 'Any student enrolled at MANIT Bhopal with a passion for tech can apply during our induction cycles.' },
  { q: 'Do I need prior experience?', a: 'Not necessarily! We look for passion, learning agility, and basic logic. We will teach you the rest.' },
  { q: 'How much time commitment is required?', a: 'Expect around 5-8 hours a week, mostly during event preparations or project builds.' },
  { q: 'How are selections done?', a: 'Selections are strictly merit-based via the VisionHire assessment portal and technical interviews.' },
];

export default function GalleryAndFAQSection() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <section className="relative z-10 max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-16">
      
      {/* Gallery */}
      <div>
        <h2 className="text-3xl md:text-5xl font-display font-bold mb-8">Life at Vision</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="w-full h-48 rounded-2xl bg-dark-800 border border-white/5 flex items-center justify-center overflow-hidden relative group">
              <img src="https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=800" alt="Hackathon" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-110" />
            </div>
            <div className="w-full h-64 rounded-2xl bg-dark-800 border border-white/5 flex items-center justify-center overflow-hidden relative group">
              <img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800" alt="Conference" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-110" />
            </div>
          </div>
          <div className="space-y-4 pt-12">
            <div className="w-full h-64 rounded-2xl bg-dark-800 border border-white/5 flex items-center justify-center overflow-hidden relative group">
               <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800" alt="Collaboration" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-110" />
            </div>
            <div className="w-full h-48 rounded-2xl bg-dark-800 border border-white/5 flex items-center justify-center overflow-hidden relative group">
              <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800" alt="Team" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-110" />
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-3xl md:text-5xl font-display font-bold mb-8">FAQs</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-2xl bg-dark-800/40 border border-white/5 overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
              >
                <span className="font-bold text-white">{faq.q}</span>
                <ChevronDown className={`transform transition-transform ${openFaq === i ? 'rotate-180 text-brand-400' : 'text-gray-500'}`} />
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-6 pb-6 text-gray-400 font-medium"
                  >
                    {faq.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}
