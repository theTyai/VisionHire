import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAssessments, createAssessment, updateAssessment } from '../store/slices/assessmentSlice';
import AppLayout from '../components/common/AppLayout';

const defaultForm = {
  title: '', description: '', category: 'General',
  config: { duration: 60, totalQuestions: 0, passingScore: 50, maxAttempts: 1, shuffleQuestions: true, shuffleOptions: true, negativeMarking: false, negativeMarkValue: 0.25, tabSwitchLimit: 3, fullScreenRequired: true },
  status: 'draft',
};

export default function AdminAssessments() {
  const dispatch = useDispatch();
  const { list: assessments, loading } = useSelector(s => s.assessment);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editing, setEditing] = useState(null);

  useEffect(() => { dispatch(fetchAssessments()); }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await dispatch(updateAssessment({ id: editing, data: form }));
    } else {
      await dispatch(createAssessment(form));
    }
    setShowModal(false);
    setForm(defaultForm);
    setEditing(null);
  };

  const handleEdit = (a) => {
    setForm({ title: a.title, description: a.description, category: a.category, config: a.config, status: a.status });
    setEditing(a._id);
    setShowModal(true);
  };

  const toggleStatus = (a) => {
    const newStatus = a.status === 'published' ? 'paused' : 'published';
    dispatch(updateAssessment({ id: a._id, data: { status: newStatus } }));
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-display font-bold text-white">Assessments</h1>
          <button onClick={() => { setForm(defaultForm); setEditing(null); setShowModal(true); }}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-medium transition-colors">
            + New Assessment
          </button>
        </div>

        {loading ? (
          <div className="grid gap-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-dark-700/40 rounded-xl animate-pulse" />)}</div>
        ) : (
          <div className="bg-dark-700/60 border border-dark-500/50 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-dark-800/60 border-b border-dark-600/50">
                <tr>
                  {['Title', 'Duration', 'Questions', 'Pass%', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-600/30">
                {assessments.map(a => (
                  <tr key={a._id} className="hover:bg-dark-600/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-white">{a.title}</p>
                      <p className="text-xs text-gray-500">{a.category}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{a.config?.duration}m</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{a.config?.totalQuestions}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{a.config?.passingScore}%</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        a.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        a.status === 'paused' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      }`}>{a.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(a)} className="text-xs text-brand-400 hover:text-brand-300">Edit</button>
                        <button onClick={() => toggleStatus(a)} className="text-xs text-gray-400 hover:text-white">
                          {a.status === 'published' ? 'Pause' : 'Publish'}
                        </button>
                        <Link to={`/admin/assessments/${a._id}/questions`} className="text-xs text-purple-400 hover:text-purple-300">Questions</Link>
                        <Link to={`/admin/leaderboard/${a._id}`} className="text-xs text-emerald-400 hover:text-emerald-300">Leaderboard</Link>
                        <Link to={`/admin/analytics/${a._id}`} className="text-xs text-yellow-400 hover:text-yellow-300">Analytics</Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {assessments.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 text-sm">No assessments yet. Create one!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-dark-700 border border-dark-500 rounded-2xl p-6 w-full max-w-lg my-4">
            <h3 className="text-lg font-display font-semibold text-white mb-5">{editing ? 'Edit' : 'New'} Assessment</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Title *</label>
                <input required className="w-full px-3 py-2 bg-dark-600 border border-dark-400 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Description</label>
                <textarea className="w-full px-3 py-2 bg-dark-600 border border-dark-400 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none h-20"
                  value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Duration (mins)', field: 'duration', type: 'number' },
                  { label: 'Pass Score (%)', field: 'passingScore', type: 'number' },
                  { label: 'Tab Switch Limit', field: 'tabSwitchLimit', type: 'number' },
                  { label: 'Max Attempts', field: 'maxAttempts', type: 'number' },
                ].map(({ label, field, type }) => (
                  <div key={field}>
                    <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                    <input type={type} className="w-full px-3 py-2 bg-dark-600 border border-dark-400 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={form.config[field]} onChange={e => setForm(p => ({ ...p, config: { ...p.config, [field]: parseFloat(e.target.value) } }))} />
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'Shuffle Questions', field: 'shuffleQuestions' },
                  { label: 'Shuffle Options', field: 'shuffleOptions' },
                  { label: 'Negative Marking', field: 'negativeMarking' },
                  { label: 'Fullscreen Required', field: 'fullScreenRequired' },
                ].map(({ label, field }) => (
                  <label key={field} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.config[field]}
                      onChange={e => setForm(p => ({ ...p, config: { ...p.config, [field]: e.target.checked } }))}
                      className="w-4 h-4 rounded border-dark-400 bg-dark-600 text-brand-600 focus:ring-brand-500" />
                    <span className="text-xs text-gray-300">{label}</span>
                  </label>
                ))}
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Status</label>
                <select className="w-full px-3 py-2 bg-dark-600 border border-dark-400 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border border-dark-400 rounded-lg text-gray-300 hover:text-white text-sm">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-white font-medium text-sm">
                  {editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
