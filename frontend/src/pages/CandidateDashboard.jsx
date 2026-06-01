import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAssessments } from '../store/slices/assessmentSlice';
import AppLayout from '../components/common/AppLayout';

const StatusBadge = ({ status }) => {
  const styles = {
    published: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_-2px_rgba(16,185,129,0.3)]',
    draft: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    archived: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    paused: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border ${styles[status] || styles.draft}`}>
      {status}
    </span>
  );
};

export default function CandidateDashboard() {
  const dispatch = useDispatch();
  const { user, token } = useSelector(s => s.auth);
  const { list: assessments, loading } = useSelector(s => s.assessment);
  
  const [results, setResults] = useState([]);
  const [fetchingResults, setFetchingResults] = useState(true);

  useEffect(() => {
    dispatch(fetchAssessments({ status: 'published' }));
    
    // Fetch candidate's past results for the dashboard
    if (user?._id) {
      fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/analytics/candidate/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) setResults(data.data);
      })
      .catch(console.error)
      .finally(() => setFetchingResults(false));
    }
  }, [dispatch, user, token]);

  const completed = results.length;
  const passed = results.filter(r => r.isPassed).length;
  const avgScore = completed > 0 
    ? Math.round(results.reduce((acc, curr) => acc + curr.percentage, 0) / completed)
    : 0;

  const stats = [
    { label: 'Available Tests', value: assessments.length, icon: '📋', color: 'from-brand-500 to-brand-700' },
    { label: 'Completed', value: completed, icon: '✅', color: 'from-emerald-500 to-emerald-700' },
    { label: 'Passed', value: passed, icon: '🏆', color: 'from-yellow-500 to-amber-700' },
    { label: 'Avg Score', value: `${avgScore}%`, icon: '📊', color: 'from-purple-500 to-purple-700' },
  ];

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-dark-800 to-dark-900 border border-white/5 p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/20 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs font-medium mb-4 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Candidate Portal
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">
                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-emerald-400">{user?.name}</span>
              </h1>
              <p className="text-gray-400 max-w-xl">
                Ready to showcase your technical skills? Browse the available assessments below and climb the leaderboards.
              </p>
            </div>
            <div className="shrink-0 w-24 h-24 rounded-full bg-gradient-to-br from-dark-700 to-dark-800 border border-white/10 flex items-center justify-center text-3xl font-display font-bold text-white shadow-inner">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-dark-800/50 backdrop-blur-sm border border-white/5 rounded-2xl p-5 hover:bg-dark-800/80 transition-colors">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-xl shadow-lg mb-4`}>
                {stat.icon}
              </div>
              <div className="text-3xl font-display font-bold text-white">{stat.value}</div>
              <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Assessment Feed */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-semibold text-white">Available Assessments</h2>
              <span className="text-xs text-brand-400 font-medium px-2 py-1 bg-brand-500/10 rounded-md">
                {assessments.length} active
              </span>
            </div>

            {loading ? (
              <div className="grid gap-4">
                {[1,2,3].map(i => (
                  <div key={i} className="h-32 bg-dark-800/40 rounded-2xl animate-pulse border border-white/5" />
                ))}
              </div>
            ) : assessments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 bg-dark-800/30 rounded-2xl border border-white/5 border-dashed">
                <div className="text-5xl mb-4 opacity-50">📭</div>
                <h3 className="text-lg font-medium text-white mb-1">No assessments available</h3>
                <p className="text-sm text-gray-500 text-center">There are no published assessments at the moment. Check back later!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {assessments.map((assessment) => (
                  <div
                    key={assessment._id}
                    className="relative overflow-hidden bg-dark-800/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:border-brand-500/30 transition-all group"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 blur-[50px] group-hover:bg-brand-500/10 transition-colors pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white group-hover:text-brand-300 transition-colors">
                            {assessment.title}
                          </h3>
                          <StatusBadge status={assessment.status} />
                        </div>
                        <p className="text-sm text-gray-400 mb-4 line-clamp-2">{assessment.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500">
                          <span className="flex items-center gap-1.5 bg-dark-900/50 px-2.5 py-1 rounded-md">
                            <span className="text-brand-400">⏱</span> {assessment.config?.duration} mins
                          </span>
                          <span className="flex items-center gap-1.5 bg-dark-900/50 px-2.5 py-1 rounded-md">
                            <span className="text-emerald-400">❓</span> {assessment.config?.totalQuestions} Qs
                          </span>
                          <span className="flex items-center gap-1.5 bg-dark-900/50 px-2.5 py-1 rounded-md">
                            <span className="text-purple-400">🎯</span> {assessment.config?.passingScore}% Pass
                          </span>
                          {assessment.config?.negativeMarking && (
                            <span className="flex items-center gap-1.5 bg-red-500/10 text-red-400 px-2.5 py-1 rounded-md border border-red-500/20">
                              <span>⚠️</span> Negative Marking
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <Link
                        to={`/assessment/${assessment._id}/start`}
                        className="shrink-0 flex items-center justify-center w-full sm:w-auto px-6 py-3 rounded-xl bg-white text-dark-900 hover:bg-brand-50 font-bold text-sm transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95"
                      >
                        Start Assessment
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar: Recent Results */}
          <div className="space-y-6">
            <h2 className="text-xl font-display font-semibold text-white">Recent Results</h2>
            <div className="bg-dark-800/50 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden">
              {fetchingResults ? (
                <div className="p-6 text-center text-sm text-gray-500">Loading results...</div>
              ) : results.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-3xl mb-3 opacity-50">📜</div>
                  <p className="text-sm text-gray-400">You haven't completed any assessments yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {results.slice(0, 5).map(result => (
                    <Link key={result._id} to={`/results/${result.attemptId}`} className="block p-5 hover:bg-white/5 transition-colors group">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-white text-sm group-hover:text-brand-300 transition-colors truncate pr-4">
                          {result.assessmentId?.title || 'Unknown Assessment'}
                        </h4>
                        <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                          result.isPassed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {result.percentage}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{new Date(result.evaluatedAt).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1 group-hover:text-white transition-colors">
                          View details <span className="text-[10px]">→</span>
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
