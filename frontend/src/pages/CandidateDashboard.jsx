import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAssessments } from '../store/slices/assessmentSlice';
import AppLayout from '../components/common/AppLayout';

const StatusBadge = ({ status }) => {
  const styles = {
    published: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    draft: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    archived: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    paused: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.draft}`}>
      {status}
    </span>
  );
};

export default function CandidateDashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { list: assessments, loading } = useSelector(s => s.assessment);

  useEffect(() => {
    dispatch(fetchAssessments({ status: 'published' }));
  }, [dispatch]);

  const stats = [
    { label: 'Available Tests', value: assessments.length, icon: '📋', color: 'brand' },
    { label: 'Completed', value: 0, icon: '✅', color: 'emerald' },
    { label: 'In Progress', value: 0, icon: '⏱️', color: 'yellow' },
    { label: 'Score Avg', value: 'N/A', icon: '📊', color: 'purple' },
  ];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-white mb-1">
            Welcome back, <span className="text-brand-400">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-gray-400">Ready to showcase your skills? Pick an assessment below.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-dark-700/60 border border-dark-500/50 rounded-xl p-4">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-display font-bold text-white">{stat.value}</div>
              <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Assessments */}
        <div>
          <h2 className="text-lg font-display font-semibold text-white mb-4">Available Assessments</h2>

          {loading ? (
            <div className="grid gap-4">
              {[1,2,3].map(i => (
                <div key={i} className="h-28 bg-dark-700/40 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : assessments.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="text-4xl mb-3">📭</div>
              <p>No assessments available at the moment.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {assessments.map((assessment) => (
                <div
                  key={assessment._id}
                  className="bg-dark-700/60 border border-dark-500/50 rounded-xl p-5 hover:border-brand-600/40 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white group-hover:text-brand-300 transition-colors">
                          {assessment.title}
                        </h3>
                        <StatusBadge status={assessment.status} />
                      </div>
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">{assessment.description}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <span>⏱</span> {assessment.config?.duration} mins
                        </span>
                        <span className="flex items-center gap-1">
                          <span>❓</span> {assessment.config?.totalQuestions} questions
                        </span>
                        <span className="flex items-center gap-1">
                          <span>🎯</span> Pass: {assessment.config?.passingScore}%
                        </span>
                        {assessment.config?.negativeMarking && (
                          <span className="flex items-center gap-1 text-orange-400">
                            <span>⚠️</span> Negative marking
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <span>🏷</span> {assessment.category}
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/assessment/${assessment._id}/start`}
                      className="shrink-0 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-all shadow-lg shadow-brand-600/20"
                    >
                      Start Test
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
