import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearError } from '../store/slices/authSlice';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(s => s.auth);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [localError, setLocalError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError('');
    dispatch(clearError());
    if (form.password !== form.confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }
    dispatch(register({ name: form.name, email: form.email, password: form.password }));
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700 px-4">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(74,99,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(74,99,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/30">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <span className="text-2xl font-display font-bold text-white">VisionHire</span>
          </div>
          <p className="text-gray-400 text-sm">Create your candidate account</p>
        </div>

        <div className="bg-dark-700/80 backdrop-blur-sm border border-dark-500/50 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-display font-semibold text-white mb-6">Create account</h2>

          {displayError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{displayError}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Full Name', field: 'name', type: 'text', placeholder: 'John Doe' },
              { label: 'Email address', field: 'email', type: 'email', placeholder: 'you@example.com' },
              { label: 'Password', field: 'password', type: 'password', placeholder: '••••••••' },
              { label: 'Confirm Password', field: 'confirmPassword', type: 'password', placeholder: '••••••••' },
            ].map(({ label, field, type, placeholder }) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
                <input
                  type={type}
                  required
                  value={form[field]}
                  onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg bg-dark-600 border border-dark-400 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm"
                  placeholder={placeholder}
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-brand-600/20 mt-2"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
