import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { toggleDarkMode, removeToast } from '../../store/slices/uiSlice';

export default function AppLayout({ children }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector(s => s.auth);
  const { darkMode } = useSelector(s => s.ui);

  const isAdmin = ['admin', 'superadmin'].includes(user?.role);

  const candidateNav = [
    { label: 'Dashboard', path: '/dashboard', icon: '🏠' },
    { label: 'Assessments', path: '/assessments', icon: '📋' },
  ];

  const adminNav = [
    { label: 'Dashboard', path: '/admin', icon: '🏠' },
    { label: 'Assessments', path: '/admin/assessments', icon: '📋' },
    { label: 'Monitor', path: '/admin/monitor', icon: '👁️' },
  ];

  const navItems = isAdmin ? adminNav : candidateNav;

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-900">
      {/* Navbar */}
      <nav className="h-14 bg-dark-800 border-b border-dark-600/50 flex items-center justify-between px-4 md:px-6 shrink-0">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <span className="font-display font-bold text-white text-sm hidden sm:block">VisionHire</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ label, path, icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  location.pathname === path
                    ? 'bg-brand-600/15 text-brand-400'
                    : 'text-gray-400 hover:text-white hover:bg-dark-700'
                }`}
              >
                <span>{icon}</span>
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch(toggleDarkMode())}
            className="w-8 h-8 rounded-lg bg-dark-700 hover:bg-dark-600 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-brand-600/30 border border-brand-600/40 flex items-center justify-center text-brand-400 text-xs font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <span className="text-sm text-gray-300 hidden sm:block">{user?.name}</span>
          </div>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg border border-dark-500 text-gray-400 hover:border-red-500/30 hover:text-red-400 text-sm transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="flex-1">{children}</main>
    </div>
  );
}
