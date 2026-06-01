import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import HeroSection from '../components/landing/HeroSection';
import StatsSection from '../components/landing/StatsSection';
import AboutSection from '../components/landing/AboutSection';
import WhatWeDoSection from '../components/landing/WhatWeDoSection';
import BenefitsSection from '../components/landing/BenefitsSection';
import TimelineSection from '../components/landing/TimelineSection';
import GalleryAndFAQSection from '../components/landing/GalleryAndFAQSection';

export default function LandingPage() {
  
  // Smooth scroll behavior
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#06080F] text-white selection:bg-brand-500/30 font-body relative overflow-hidden">
      
      {/* Global Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#06080F]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Vision Logo" className="h-8 object-contain drop-shadow-xl" onError={(e) => {
              e.target.style.display = 'none';
              document.getElementById('logo-fallback-nav').style.display = 'flex';
            }} />
            <div id="logo-fallback-nav" className="hidden items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center font-display font-bold text-sm shadow-lg">
                V
              </div>
              <span className="font-display font-extrabold text-xl tracking-tight text-white">VISION CSE</span>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/login" className="text-gray-300 hover:text-white transition-colors font-semibold text-sm">
              Sign In
            </Link>
            <Link to="/apply" className="px-5 py-2 rounded-full bg-white text-dark-900 hover:bg-gray-200 font-bold text-sm transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95">
              Apply Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Sections */}
      <HeroSection />
      <StatsSection />
      <AboutSection />
      <WhatWeDoSection />
      <BenefitsSection />
      <TimelineSection />
      <GalleryAndFAQSection />

      {/* Final CTA */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-32 text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-brand-500/10 blur-[100px] pointer-events-none rounded-full" />
        <h2 className="text-5xl md:text-7xl font-display font-extrabold mb-8 relative z-10 tracking-tight">
          Ready to Shape the <br /> Future of Tech?
        </h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 relative z-10">
          <Link to="/apply" className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold text-lg transition-all shadow-[0_0_40px_-10px_rgba(13,111,86,0.8)] hover:-translate-y-1">
            Apply Now
          </Link>
          <a href="mailto:contact@visionmanit.in" className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-dark-800/50 hover:bg-dark-800 border border-white/10 text-white font-bold text-lg transition-all backdrop-blur-md">
            Contact Team
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 pt-16 pb-8 bg-dark-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center font-display font-bold text-sm text-white">V</div>
                <span className="font-display font-bold tracking-tight text-white text-xl">VISION CSE MANIT</span>
              </div>
              <p className="text-gray-400 max-w-sm mb-6">
                The largest student-led technical and career development community at MANIT Bhopal. First Learn. Then Teach.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link to="/apply" className="hover:text-brand-400 transition-colors">Apply Now</Link></li>
                <li><Link to="/login" className="hover:text-brand-400 transition-colors">Admin Portal</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Connect</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="https://visionmanit.in" target="_blank" rel="noreferrer" className="hover:text-brand-400 transition-colors">Website</a></li>
                <li><a href="https://instagram.com/vision_nitb" target="_blank" rel="noreferrer" className="hover:text-brand-400 transition-colors">Instagram</a></li>
                <li><a href="https://linkedin.com/company/vision-manit" target="_blank" rel="noreferrer" className="hover:text-brand-400 transition-colors">LinkedIn</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 text-center text-sm font-medium text-gray-600">
            © {new Date().getFullYear()} Vision CSE MANIT. Powered by VisionHire Engine.
          </div>
        </div>
      </footer>
    </div>
  );
}
