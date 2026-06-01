import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Terminal } from 'lucide-react';

const terminalLines = [
  { prefix: 'vision@manit:~$', command: 'learn --topic="Data Structures"', output: 'Loading Arrays, Linked Lists, Trees, Graphs...', color: 'text-brand-300' },
  { prefix: 'vision@manit:~$', command: 'practice --mode="Competitive Programming"', output: 'Status: Accepted (0.01s). Rating +120!', color: 'text-emerald-400' },
  { prefix: 'vision@manit:~$', command: 'build --stack="MERN"', output: 'Deploying full-stack web application... success.', color: 'text-accent-400' },
  { prefix: 'vision@manit:~$', command: 'crack --company="MAANG"', output: 'System Design cleared. Offer letter received 🚀', color: 'text-purple-400' },
];

export default function HeroSection() {
  const [currentLine, setCurrentLine] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLine((prev) => (prev + 1) % terminalLines.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center pt-32 pb-20 px-6 overflow-hidden">
      {/* Animated Particles / Background Elements */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-brand-500/10 to-accent-500/10 rounded-full blur-[100px] pointer-events-none"
      />

      <div className="relative z-10 max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Column: Copy & CTA */}
        <div className="flex flex-col items-start text-left">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 backdrop-blur-md text-brand-300 text-sm font-semibold mb-8 cursor-default"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-500"></span>
            </span>
            MANIT's Largest Technical Community
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl md:text-7xl lg:text-8xl font-display font-extrabold tracking-tight mb-8 leading-[1.1]"
          >
            Build. Learn. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-300 to-accent-400">
              Lead.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 max-w-xl mb-10 leading-relaxed font-medium"
          >
            Join MANIT's fastest-growing community helping students crack internships, placements, hackathons, and real-world engineering challenges.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <Link to="/apply" className="group w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold transition-all shadow-[0_0_30px_-5px_rgba(13,111,86,0.5)] hover:shadow-[0_0_40px_-5px_rgba(13,111,86,0.7)] hover:-translate-y-1">
              Apply Now
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/login" className="group w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-dark-800/50 hover:bg-dark-800 border border-white/10 text-white font-bold transition-all backdrop-blur-md hover:border-white/20">
              Admin Portal
            </Link>
          </motion.div>
        </div>

        {/* Right Column: Animated Terminal Mockup */}
        <motion.div
          initial={{ opacity: 0, x: 50, rotateY: -10 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
          className="relative w-full max-w-xl mx-auto lg:mx-0 perspective-[2000px] group"
        >
          <div className="absolute inset-0 bg-brand-500/20 blur-[80px] rounded-full group-hover:bg-brand-500/30 transition-colors duration-700" />
          
          <div className="relative transform rotateX-[5deg] lg:-rotate-y-6 lg:group-hover:-rotate-y-0 transition-transform duration-700 bg-[#0A0D14] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(13,111,86,0.15)] overflow-hidden">
            {/* Terminal Header */}
            <div className="bg-dark-800/80 border-b border-white/5 p-4 flex items-center gap-3 backdrop-blur-sm">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/90 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                <div className="w-3 h-3 rounded-full bg-accent-500/90 shadow-[0_0_10px_rgba(242,169,0,0.5)]" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/90 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              </div>
              <div className="flex items-center gap-2 ml-4 text-xs font-mono text-gray-500">
                <Terminal size={12} />
                <span>vision-core.exe</span>
              </div>
            </div>

            {/* Terminal Body */}
            <div className="p-6 h-[250px] font-mono text-sm">
              <div className="space-y-4">
                {/* Past lines (static context) */}
                <div className="opacity-40">
                  <span className="text-gray-500">vision@manit:~$</span>{' '}
                  <span className="text-gray-300">init --society="Vision CSE"</span>
                  <div className="text-brand-400 mt-1">Initializing environment... OK</div>
                </div>

                {/* Animated active line */}
                <div className="min-h-[60px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentLine}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <span className="text-gray-500">{terminalLines[currentLine].prefix}</span>{' '}
                      <span className="text-gray-200">
                        {terminalLines[currentLine].command}
                      </span>
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className={`mt-1 font-semibold ${terminalLines[currentLine].color}`}
                      >
                        {terminalLines[currentLine].output}
                      </motion.div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Blinking cursor */}
                <div className="flex items-center mt-2">
                  <span className="text-gray-500">vision@manit:~$</span>
                  <motion.div 
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="w-2 h-4 bg-brand-400 ml-2"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
