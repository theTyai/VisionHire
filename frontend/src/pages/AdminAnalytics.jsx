import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAnalytics } from '../store/slices/adminSlice';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AppLayout from '../components/common/AppLayout';


export default function AdminAnalytics() {
  const { assessmentId } = useParams();
  const dispatch = useDispatch();
  const { analytics } = useSelector(s => s.admin);

  useEffect(() => { dispatch(fetchAnalytics(assessmentId)); }, [assessmentId, dispatch]);

  if (!analytics) return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </AppLayout>
  );

  const distData = Object.entries(analytics.scoreDistribution || {}).map(([range, count]) => ({ range, count }));
  const topicData = (analytics.topicWise || []).slice(0, 8);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-display font-bold text-white mb-6">Analytics Dashboard</h1>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Attempts', value: analytics.totalAttempts, icon: '👥' },
            { label: 'Average Score', value: `${analytics.avgScore}%`, icon: '📊' },
            { label: 'Pass Rate', value: `${analytics.passRate}%`, icon: '✅' },
            { label: 'Topics Covered', value: analytics.topicWise?.length || 0, icon: '📚' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-dark-700/60 border border-dark-500/50 rounded-xl p-4">
              <div className="text-xl mb-2">{icon}</div>
              <div className="text-2xl font-display font-bold text-white">{value}</div>
              <div className="text-xs text-gray-400 mt-1">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Score distribution */}
          <div className="bg-dark-700/60 border border-dark-500/50 rounded-xl p-5">
            <h3 className="font-semibold text-white mb-4">Score Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={distData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e3358" />
                <XAxis dataKey="range" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1c1f38', border: '1px solid #2e3358', borderRadius: 8, color: '#fff' }} />
                <Bar dataKey="count" fill="#4a63ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Topic accuracy */}
          <div className="bg-dark-700/60 border border-dark-500/50 rounded-xl p-5">
            <h3 className="font-semibold text-white mb-4">Topic-wise Accuracy</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topicData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#2e3358" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis type="category" dataKey="topic" tick={{ fill: '#9ca3af', fontSize: 10 }} width={80} />
                <Tooltip contentStyle={{ background: '#1c1f38', border: '1px solid #2e3358', borderRadius: 8, color: '#fff' }} formatter={(v) => [`${v}%`, 'Accuracy']} />
                <Bar dataKey="accuracy" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Topic table */}
        {topicData.length > 0 && (
          <div className="bg-dark-700/60 border border-dark-500/50 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-dark-600/50">
              <h3 className="font-semibold text-white">Topic Performance Breakdown</h3>
            </div>
            <table className="w-full">
              <thead className="bg-dark-800/40">
                <tr>
                  {['Topic', 'Questions', 'Correct', 'Accuracy'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-600/30">
                {topicData.map(t => (
                  <tr key={t.topic} className="hover:bg-dark-600/20">
                    <td className="px-4 py-3 text-sm text-white">{t.topic}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{t.total}</td>
                    <td className="px-4 py-3 text-sm text-emerald-400">{t.correct}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-dark-600 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${t.accuracy}%`, background: t.accuracy >= 70 ? '#10b981' : t.accuracy >= 40 ? '#f59e0b' : '#ef4444' }} />
                        </div>
                        <span className="text-xs text-gray-400 w-10">{t.accuracy}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
