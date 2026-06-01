import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAdminStats } from '../store/slices/adminSlice';
import { fetchAssessments } from '../store/slices/assessmentSlice';
import { requestAdminData } from '../services/socket';
import AppLayout from '../components/common/AppLayout';

const StatCard = ({ label, value, icon, color, sublabel }) => {
  const colorMap = {
    emerald: 'from-emerald-500 to-emerald-700 text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    brand: 'from-brand-500 to-brand-700 text-brand-400 bg-brand-500/10 border-brand-500/20',
    purple: 'from-purple-500 to-purple-700 text-purple-400 bg-purple-500/10 border-purple-500/20',
    yellow: 'from-yellow-500 to-amber-700 text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  };

  const style = colorMap[color] || colorMap.brand;
  const gradient = style.split(' ').find(s => s.startsWith('from-'));
  const toGradient = style.split(' ').find(s => s.startsWith('to-'));
  const textColor = style.split(' ').find(s => s.startsWith('text-'));
  const bgColor = style.split(' ').find(s => s.startsWith('bg-'));
  const borderColor = style.split(' ').find(s => s.startsWith('border-'));

  return (
    <div className="relative overflow-hidden bg-dark-800/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 group hover:bg-dark-800/80 transition-all">
      <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full ${bgColor} blur-[40px] group-hover:scale-150 transition-transform duration-700`} />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} ${toGradient} flex items-center justify-center text-2xl shadow-lg`}>
            {icon}
          </div>
          {sublabel && (
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${bgColor} ${textColor} ${borderColor}`}>
              {sublabel}
            </span>
          )}
        </div>
        <div className="text-4xl font-display font-bold text-white tracking-tight">{value ?? '—'}</div>
        <div className="text-sm text-gray-400 mt-1 font-medium">{label}</div>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const { stats } = useSelector(s => s.admin);
  const { list: assessments } = useSelector(s => s.assessment);
  const { notifications } = useSelector(s => s.ui);

  useEffect(() => {
    dispatch(fetchAdminStats());
    dispatch(fetchAssessments());
    requestAdminData();

    const interval = setInterval(() => {
      dispatch(fetchAdminStats());
      requestAdminData();
    }, 30000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const recentNotifications = notifications.slice(0, 10);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
              Admin Command Center
            </h1>
            <p className="text-gray-400 mt-1">Manage assessments, monitor candidates, and analyze results.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/admin/assessments"
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-colors backdrop-blur-sm"
            >
              Manage Assessments
            </Link>
            <Link
              to="/admin/monitor"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-all shadow-[0_0_20px_-5px_rgba(79,70,229,0.4)]"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Monitor
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Active Candidates" value={stats?.activeCandidates ?? 0} icon="👥" color="emerald" sublabel="Live" />
          <StatCard label="Total Candidates" value={stats?.totalCandidates} icon="🎓" color="brand" />
          <StatCard label="Assessments" value={stats?.totalAssessments} icon="📋" color="purple" />
          <StatCard label="Submissions Today" value={stats?.submittedAttempts} icon="✅" color="yellow" />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Content: Assessments */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-semibold text-white">Recent Assessments</h2>
              <Link to="/admin/assessments" className="text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors">
                View all inventory →
              </Link>
            </div>
            
            <div className="bg-dark-800/50 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden">
              <div className="divide-y divide-white/5">
                {assessments.slice(0, 5).map(a => (
                  <div key={a._id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors group">
                    <div>
                      <h3 className="text-base font-semibold text-white group-hover:text-brand-300 transition-colors mb-1">
                        {a.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                        <span className="flex items-center gap-1"><span className="text-emerald-400">❓</span> {a.config?.totalQuestions} Qs</span>
                        <span className="flex items-center gap-1"><span className="text-brand-400">⏱</span> {a.config?.duration} mins</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${
                        a.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_-2px_rgba(16,185,129,0.3)]' :
                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      }`}>
                        {a.status}
                      </span>
                      <Link 
                        to={`/admin/leaderboard/${a._id}`} 
                        className="px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-white text-xs font-semibold transition-colors border border-white/5"
                      >
                        Leaderboard
                      </Link>
                    </div>
                  </div>
                ))}
                {assessments.length === 0 && (
                  <div className="p-12 text-center">
                    <div className="text-4xl mb-4 opacity-50">📂</div>
                    <p className="text-gray-400">No assessments created yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar: Live Activity */}
          <div className="space-y-6">
            <h2 className="text-xl font-display font-semibold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
              Live Activity Feed
            </h2>
            
            <div className="bg-dark-800/50 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden flex flex-col h-[400px]">
              <div className="flex-1 overflow-y-auto divide-y divide-white/5 scrollbar-thin scrollbar-thumb-dark-600 scrollbar-track-transparent">
                {recentNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-500">
                    <div className="text-3xl mb-2 opacity-50">📡</div>
                    <p className="text-sm">Listening for activity...</p>
                  </div>
                ) : (
                  recentNotifications.map(n => {
                    const isError = n.type === 'error';
                    const isSuccess = n.type === 'success';
                    return (
                      <div key={n.id} className="p-4 flex items-start gap-3 hover:bg-white/5 transition-colors">
                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 shadow-lg ${
                          isError ? 'bg-red-500 shadow-red-500/50' : 
                          isSuccess ? 'bg-emerald-500 shadow-emerald-500/50' : 
                          'bg-brand-500 shadow-brand-500/50'
                        }`} />
                        <div>
                          <p className={`text-sm font-medium ${
                            isError ? 'text-red-300' : 
                            isSuccess ? 'text-emerald-300' : 
                            'text-gray-200'
                          }`}>
                            {n.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{new Date(n.id).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="p-3 bg-dark-900/50 border-t border-white/5 text-center">
                <Link to="/admin/monitor" className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors uppercase tracking-wider">
                  Open Full Monitor
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
