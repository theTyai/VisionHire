import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAdminStats } from '../store/slices/adminSlice';
import { requestAdminData } from '../services/socket';
import AppLayout from '../components/common/AppLayout';

export default function AdminMonitor() {
  const dispatch = useDispatch();
  const { stats, activeCandidates } = useSelector(s => s.admin);
  const { notifications } = useSelector(s => s.ui);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    dispatch(fetchAdminStats());
    requestAdminData();
    const interval = setInterval(() => {
      dispatch(fetchAdminStats());
      requestAdminData();
    }, 10000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const violations = notifications.filter(n => n.message.includes('Violation'));
  const recentActivity = notifications.slice(0, 20);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-2xl font-display font-bold text-white">Live Monitor</h1>
          </div>
          <div className="text-sm text-gray-400">
            Auto-refresh every 10s
          </div>
        </div>

        {/* Live stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Active Candidates', value: stats?.activeCandidates ?? 0, icon: '🟢', highlight: true },
            { label: 'Total Submitted', value: stats?.submittedAttempts ?? 0, icon: '✅', highlight: false },
            { label: 'Violations (session)', value: violations.length, icon: '⚠️', highlight: violations.length > 0 },
            { label: 'Total Assessments', value: stats?.totalAssessments ?? 0, icon: '📋', highlight: false },
          ].map(({ label, value, icon, highlight }) => (
            <div key={label} className={`rounded-xl p-5 border ${highlight && value > 0 ? 'bg-brand-600/10 border-brand-600/30' : 'bg-dark-700/60 border-dark-500/50'}`}>
              <div className="text-2xl mb-2">{icon}</div>
              <div className={`text-3xl font-display font-bold ${highlight && value > 0 ? 'text-brand-400' : 'text-white'}`}>{value}</div>
              <div className="text-xs text-gray-400 mt-1">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Active candidates */}
          <div className="bg-dark-700/60 border border-dark-500/50 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-dark-600/50 flex items-center justify-between">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active Candidates ({activeCandidates.length})
              </h3>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-dark-600/30">
              {activeCandidates.length === 0 ? (
                <div className="px-5 py-8 text-center text-gray-500 text-sm">No candidates currently active.</div>
              ) : activeCandidates.map(c => (
                <div key={c.candidateId} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{c.candidateName}</p>
                    <p className="text-xs text-gray-500">Started {new Date(c.timestamp).toLocaleTimeString()}</p>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Live activity feed */}
          <div className="bg-dark-700/60 border border-dark-500/50 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-dark-600/50 flex items-center justify-between">
              <h3 className="font-semibold text-white">Live Activity Feed</h3>
              <div className="flex gap-2">
                {['all', 'violation', 'submit'].map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`text-xs px-2 py-0.5 rounded-full transition-colors ${filter === f ? 'bg-brand-600/20 text-brand-400 border border-brand-600/30' : 'text-gray-500 hover:text-gray-300'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-dark-600/30">
              {recentActivity.length === 0 ? (
                <div className="px-5 py-8 text-center text-gray-500 text-sm">No activity yet.</div>
              ) : recentActivity
                .filter(n => {
                  if (filter === 'violation') return n.message.includes('Violation') || n.message.includes('violation');
                  if (filter === 'submit') return n.message.includes('submitted');
                  return true;
                })
                .map(n => (
                  <div key={n.id} className="px-4 py-3 flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.type === 'error' ? 'bg-red-400' : n.type === 'success' ? 'bg-emerald-400' : 'bg-brand-400'}`} />
                    <div>
                      <p className={`text-xs ${n.type === 'error' ? 'text-red-300' : n.type === 'success' ? 'text-emerald-300' : 'text-gray-300'}`}>
                        {n.message}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">{new Date(n.id).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>

        {/* Violation summary */}
        {violations.length > 0 && (
          <div className="mt-6 bg-red-500/5 border border-red-500/20 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-red-500/10">
              <h3 className="font-semibold text-red-400">⚠️ Violations This Session ({violations.length})</h3>
            </div>
            <div className="divide-y divide-red-500/10 max-h-48 overflow-y-auto">
              {violations.map(v => (
                <div key={v.id} className="px-5 py-3">
                  <p className="text-xs text-red-300">{v.message}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{new Date(v.id).toLocaleTimeString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
