import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLeaderboard, updateShortlist } from '../store/slices/adminSlice';
import AppLayout from '../components/common/AppLayout';

const statusStyles = {
  pending: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  shortlisted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  on_hold: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
};

export function AdminLeaderboard() {
  const { assessmentId } = useParams();
  const dispatch = useDispatch();
  const { leaderboard } = useSelector(s => s.admin);

  useEffect(() => { dispatch(fetchLeaderboard(assessmentId)); }, [assessmentId, dispatch]);

  const handleShortlist = (resultId, status) => {
    dispatch(updateShortlist({ resultId, status }));
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-display font-bold text-white mb-6">Leaderboard</h1>
        <div className="bg-dark-700/60 border border-dark-500/50 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-dark-800/60 border-b border-dark-600/50">
              <tr>
                {['Rank', 'Candidate', 'Score', '%', 'Correct', 'Time', 'Status', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-600/30">
              {leaderboard.map((r, i) => (
                <tr key={r._id} className={`hover:bg-dark-600/20 ${i < 3 ? 'bg-brand-600/3' : ''}`}>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${i === 0 ? 'text-yellow-400 text-lg' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-500'}`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-white">{r.candidateId?.name}</p>
                    <p className="text-xs text-gray-500">{r.candidateId?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-white">{r.score}/{r.totalMarks}</td>
                  <td className="px-4 py-3 text-sm font-bold text-brand-400">{r.percentage?.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-sm text-emerald-400">{r.correct}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{Math.floor(r.timeTaken/60)}m {r.timeTaken%60}s</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${statusStyles[r.shortlistedStatus]}`}>
                      {r.shortlistedStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={r.shortlistedStatus}
                      onChange={e => handleShortlist(r._id, e.target.value)}
                      className="text-xs px-2 py-1 bg-dark-600 border border-dark-400 rounded text-white focus:outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="shortlisted">Shortlist</option>
                      <option value="on_hold">On Hold</option>
                      <option value="rejected">Reject</option>
                    </select>
                  </td>
                </tr>
              ))}
              {leaderboard.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500 text-sm">No results yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}

export default AdminLeaderboard;
