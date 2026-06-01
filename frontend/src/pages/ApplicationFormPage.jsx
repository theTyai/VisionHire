import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function ApplicationFormPage() {
  const [formData, setFormData] = useState({
    name: '',
    scholarNo: '',
    section: '',
    branch: 'CSE',
    email: '',
    primaryDomain: 'Technical',
    secondaryDomain: 'Graphics Designer'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [isApplicationOpen, setIsApplicationOpen] = useState(true);
  const [checkingPhase, setCheckingPhase] = useState(true);

  useEffect(() => {
    const checkPhase = async () => {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.success && data.data) {
          setIsApplicationOpen(data.data.isApplicationOpen);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingPhase(false);
      }
    };
    checkPhase();
  }, []);

  const WHATSAPP_LINK = "https://chat.whatsapp.com/visioncsehiring2026";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit application');
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06080F] text-white selection:bg-brand-500/30 flex flex-col font-body">
      {/* Simple Nav */}
      <nav className="p-6 border-b border-white/5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center font-display font-bold text-sm text-white">V</div>
          <span className="font-display font-bold tracking-tight text-white text-xl">VISION CSE</span>
        </Link>
      </nav>

      <main className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="w-full max-w-xl relative z-10">
          {checkingPhase ? (
            <div className="flex justify-center p-8"><Loader2 size={32} className="animate-spin text-brand-500" /></div>
          ) : !isApplicationOpen ? (
            <div className="bg-dark-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-10 shadow-2xl text-center">
              <div className="w-20 h-20 bg-gray-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🔒</span>
              </div>
              <h2 className="text-3xl font-display font-bold mb-4 text-white">Applications Closed</h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                The recruitment application phase has officially ended. Stay tuned to our social channels or WhatsApp group for updates on the next recruitment drive.
              </p>
              <Link to="/" className="px-6 py-3 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-bold transition-colors">
                Return to Home
              </Link>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {!success ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-dark-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl"
              >
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-display font-bold mb-2">Join Vision CSE</h1>
                  <p className="text-gray-400 text-sm">
                    Fill out the recruitment form. Make sure to use a <strong className="text-white">working email</strong> as details about the recruitment process will be sent there.
                  </p>
                </div>

                {error && (
                  <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Full Name</label>
                      <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-dark-800 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 transition-colors" placeholder="John Doe" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Scholar No</label>
                      <input required type="text" name="scholarNo" value={formData.scholarNo} onChange={handleChange} className="w-full bg-dark-800 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 transition-colors" placeholder="221112233" />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Branch</label>
                      <select name="branch" value={formData.branch} onChange={handleChange} className="w-full bg-dark-800 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 transition-colors appearance-none">
                        <option value="CSE">CSE</option>
                        <option value="MDS">MDS</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Section</label>
                      <input required type="text" name="section" value={formData.section} onChange={handleChange} className="w-full bg-dark-800 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 transition-colors" placeholder="e.g. CSE-1" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Working Email</label>
                    <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-dark-800 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 transition-colors" placeholder="name@example.com" />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5 pt-2 border-t border-white/5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-brand-300 uppercase tracking-wider">Primary Domain</label>
                      <select name="primaryDomain" value={formData.primaryDomain} onChange={handleChange} className="w-full bg-dark-800 border border-brand-500/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 transition-colors appearance-none text-brand-100">
                        <option value="Technical">Technical</option>
                        <option value="Executive">Executive</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-accent-300 uppercase tracking-wider">Secondary Domain</label>
                      <select name="secondaryDomain" value={formData.secondaryDomain} onChange={handleChange} className="w-full bg-dark-800 border border-accent-500/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-500 transition-colors appearance-none text-accent-100">
                        <option value="Graphics Designer">Graphics Designer</option>
                        <option value="Sponsorship">Sponsorship</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full mt-6 py-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold transition-all shadow-[0_0_20px_rgba(13,111,86,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 size={18} className="animate-spin" />}
                    Submit Application
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-dark-900/50 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-10 shadow-[0_0_50px_rgba(16,185,129,0.1)] text-center"
              >
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={40} className="text-emerald-500" />
                </div>
                <h2 className="text-3xl font-display font-bold mb-4 text-emerald-400">Application Submitted!</h2>
                <p className="text-gray-300 mb-8 max-w-md mx-auto">
                  Thank you for applying to Vision CSE, {formData.name}. We will communicate the next steps to <strong className="text-white">{formData.email}</strong>.
                </p>
                <div className="p-6 bg-dark-800 rounded-xl border border-white/5 mb-8">
                  <h3 className="font-bold text-lg mb-2">Crucial Next Step</h3>
                  <p className="text-gray-400 text-sm mb-4">You must join our official recruitment WhatsApp group to stay updated on test links and schedules.</p>
                  <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="inline-block w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors">
                    Join WhatsApp Group
                  </a>
                </div>
                <Link to="/" className="text-brand-400 hover:text-brand-300 font-semibold text-sm">
                  Return to Home
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}
