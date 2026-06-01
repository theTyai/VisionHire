import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAdminStats } from '../store/slices/adminSlice';
import { fetchAssessments } from '../store/slices/assessmentSlice';
import { requestAdminData } from '../services/socket';
import AppLayout from '../components/common/AppLayout';

const StatCard = ({ label, value, icon, color, sublabel }) => (
  <div className={`bg-dark-700/60 border border-dark-500/50 rounded-xl p-5`}>
    <div className="flex items-start justify-between mb-3">
      <span className="text-2xl">{icon}</span>
      <span className={`text-xs px-2 py-0.5 rounded-full bg-${color}-500/10 text-${color}-400 border border-${color}-500/20`}>Live</span>
    </div>
    <div className="text-3xl font-display font-bold text-white">{value ?? '—'}</div>
    <div className="text-sm text-gray-400 mt-1">{label}</div>
    {sublabel && <div className="text-xs text-gray-500 mt-0.5">{sublabel}</div>}
  </div>
);

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

  const recentNotifications = notifications.slice(0, 5);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400 mt-1">Monitor assessments in real-time</p>
          </div>
          <Link
            to="/admin/monitor"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Live Monitor
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Active Candidates" value={stats?.activeCandidates ?? 0} icon="👥" color="emerald" sublabel="Taking tests now" />
          <StatCard label="Total Candidates" value={stats?.totalCandidates} icon="🎓" color="brand" />
          <StatCard label="Assessments" value={stats?.totalAssessments} icon="📋" color="purple" />
          <StatCard label="Submissions Today" value={stats?.submittedAttempts} icon="✅" color="yellow" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Assessments */}
          <div className="lg:col-span-2 bg-dark-700/60 border border-dark-500/50 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-dark-600/50 flex items-center justify-between">
              <h3 className="font-semibold text-white">Assessments</h3>
              <Link to="/admin/assessments" className="text-xs text-brand-400 hover:text-brand-300">View all →</Link>
            </div>
            <div className="divide-y divide-dark-600/30">
              {assessments.slice(0, 5).map(a => (
                <div key={a._id} className="px-5 py-3 flex items-center justify-between hover:bg-dark-600/20 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-white">{a.title}</p>
                    <p className="text-xs text-gray-400">{a.config?.totalQuestions} questions • {a.config?.duration} mins</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      a.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      'bg-gray-500/10 text-gray-400 border-gray-500/20'
                    }`}>{a.status}</span>
                    <Link to={`/admin/leaderboard/${a._id}`} className="text-xs text-brand-400 hover:underline">Leaderboard</Link>
                  </div>
                </div>
              ))}
              {assessments.length === 0 && (
                <div className="px-5 py-8 text-center text-gray-500 text-sm">No assessments yet.</div>
              )}
            </div>
          </div>

          {/* Live Activity */}
          <div className="bg-dark-700/60 border border-dark-500/50 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-dark-600/50">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Activity
              </h3>
            </div>
            <div className="divide-y divide-dark-600/30 max-h-72 overflow-y-auto">
              {recentNotifications.length === 0 ? (
                <div className="px-5 py-8 text-center text-gray-500 text-sm">No recent activity.</div>
              ) : (
                recentNotifications.map(n => (
                  <div key={n.id} className="px-4 py-3">
                    <p className={`text-xs ${n.type === 'error' ? 'text-red-400' : n.type === 'success' ? 'text-emerald-400' : 'text-gray-300'}`}>
                      {n.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{new Date(n.id).toLocaleTimeString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
