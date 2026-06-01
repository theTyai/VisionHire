import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAssessments } from '../store/slices/assessmentSlice';
import AppLayout from '../components/common/AppLayout';

export default function AssessmentListPage() {
  const dispatch = useDispatch();
  const { list, loading } = useSelector(s => s.assessment);

  useEffect(() => { dispatch(fetchAssessments({ status: 'published' })); }, [dispatch]);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-display font-bold text-white mb-6">Available Assessments</h1>
        {loading ? (
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-28 bg-dark-700/40 rounded-xl animate-pulse" />)}</div>
        ) : list.length === 0 ? (
          <div className="text-center py-16 text-gray-500"><div className="text-4xl mb-3">📭</div><p>No assessments available.</p></div>
        ) : (
          <div className="space-y-4">
            {list.map(a => (
              <div key={a._id} className="bg-dark-700/60 border border-dark-500/50 rounded-xl p-5 hover:border-brand-600/40 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-white mb-1">{a.title}</h3>
                    <p className="text-sm text-gray-400 mb-3">{a.description}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <span>⏱ {a.config?.duration} mins</span>
                      <span>❓ {a.config?.totalQuestions} questions</span>
                      <span>🎯 Pass: {a.config?.passingScore}%</span>
                      <span>🏷 {a.category}</span>
                    </div>
                  </div>
                  <Link to={`/assessment/${a._id}/start`} className="shrink-0 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium">
                    Start Test
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
