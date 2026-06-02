import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import AppLayout from '../components/common/AppLayout';

export default function ResultPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pollingCount, setPollingCount] = useState(0);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const { data } = await api.get(`/attempt/results/${attemptId}`);
        if (data.success) {
          setResult(data.data);
          setLoading(false);
        }
      } catch (err) {
        if (err.response?.status === 404 && pollingCount < 12) {
          // Results not ready yet — poll every 5 seconds (max 1 minute)
          setTimeout(() => setPollingCount(c => c + 1), 5000);
        } else {
          setLoading(false);
        }
      }
    };
    fetchResult();
  }, [attemptId, pollingCount]);

  if (loading) return (
    <AppLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Evaluating your answers...</h3>
          <p className="text-gray-400 text-sm">This usually takes a few seconds. Please wait.</p>
          {pollingCount > 3 && <p className="text-gray-500 text-xs mt-2">Still processing ({pollingCount * 5}s)</p>}
        </div>
      </div>
    </AppLayout>
  );

  if (!result) return (
    <AppLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">😕</div>
          <h3 className="text-lg font-semibold text-white mb-2">Results not available</h3>
          <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-brand-600 text-white rounded-lg">Back to Dashboard</button>
        </div>
      </div>
    </AppLayout>
  );

  const donutData = [
    { name: 'Correct', value: result.correct, color: '#10b981' },
    { name: 'Wrong', value: result.wrong, color: '#ef4444' },
    { name: 'Skipped', value: result.skipped, color: '#6b7280' },
  ];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Result header */}
        <div className={`rounded-2xl p-8 mb-6 text-center border ${result.isPassed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
          <div className={`text-5xl mb-3 ${result.isPassed ? '' : 'grayscale'}`}>
            {result.isPassed ? '🎉' : '📚'}
          </div>
          <h2 className="text-3xl font-display font-bold text-white mb-1">
            {result.isPassed ? 'Congratulations!' : 'Better luck next time!'}
          </h2>
          <p className="text-gray-400 mb-4">{result.assessmentId?.title}</p>

          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-dark-700/60 border border-dark-500">
            <div className="text-center">
              <div className={`text-3xl font-display font-bold ${result.isPassed ? 'text-emerald-400' : 'text-red-400'}`}>
                {result.percentage?.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-400">Score</div>
            </div>
            <div className="w-px h-10 bg-dark-500" />
            <div className="text-center">
              <div className="text-3xl font-display font-bold text-white">
                {result.score}/{result.totalMarks}
              </div>
              <div className="text-xs text-gray-400">Marks</div>
            </div>
            {result.rank && <>
              <div className="w-px h-10 bg-dark-500" />
              <div className="text-center">
                <div className="text-3xl font-display font-bold text-brand-400">#{result.rank}</div>
                <div className="text-xs text-gray-400">Rank</div>
              </div>
            </>}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Donut chart */}
          <div className="bg-dark-700/60 border border-dark-500/50 rounded-xl p-5">
            <h3 className="font-semibold text-white mb-4">Answer Summary</h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={150} height={150}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                    {donutData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: '#1c1f38', border: '1px solid #2e3358', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {donutData.map(d => (
                  <div key={d.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-sm" style={{ background: d.color }} />
                    <span className="text-gray-400">{d.name}:</span>
                    <span className="text-white font-medium">{d.value}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 text-sm pt-1 border-t border-dark-500">
                  <span className="text-gray-400">Time taken:</span>
                  <span className="text-white">{Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="bg-dark-700/60 border border-dark-500/50 rounded-xl p-5">
            <h3 className="font-semibold text-white mb-4">Performance Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Questions', value: result.totalQuestions },
                { label: 'Attempted', value: result.attempted },
                { label: 'Correct', value: result.correct, color: 'text-emerald-400' },
                { label: 'Wrong', value: result.wrong, color: 'text-red-400' },
                { label: 'Skipped', value: result.skipped, color: 'text-gray-400' },
                { label: 'Accuracy', value: result.attempted > 0 ? `${((result.correct / result.attempted) * 100).toFixed(1)}%` : 'N/A', color: 'text-brand-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-dark-800/60 rounded-lg p-3">
                  <div className={`text-lg font-bold ${color || 'text-white'}`}>{value}</div>
                  <div className="text-xs text-gray-500">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Topic-wise */}
        {result.topicWise?.length > 0 && (
          <div className="bg-dark-700/60 border border-dark-500/50 rounded-xl p-5 mb-6">
            <h3 className="font-semibold text-white mb-4">Topic-wise Performance</h3>
            <div className="space-y-3">
              {result.topicWise.map(t => (
                <div key={t.topic}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">{t.topic}</span>
                    <span className="text-gray-400">{t.correct}/{t.total} ({t.accuracy}%)</span>
                  </div>
                  <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${t.accuracy}%`,
                        background: t.accuracy >= 70 ? '#10b981' : t.accuracy >= 40 ? '#f59e0b' : '#ef4444',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shortlist status */}
        {result.shortlistedStatus && result.shortlistedStatus !== 'pending' && (
          <div className={`rounded-xl p-4 mb-6 border text-center ${
            result.shortlistedStatus === 'shortlisted' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
            result.shortlistedStatus === 'rejected' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
            'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
          }`}>
            <p className="font-medium">
              {result.shortlistedStatus === 'shortlisted' ? '🎊 Congratulations! You have been shortlisted!' :
               result.shortlistedStatus === 'rejected' ? '📩 Thank you for your attempt.' :
               '⏳ Your application is on hold.'}
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/dashboard')} className="px-6 py-2.5 rounded-lg border border-dark-500 text-gray-300 hover:text-white hover:border-gray-400 transition-colors text-sm">
            Back to Dashboard
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
