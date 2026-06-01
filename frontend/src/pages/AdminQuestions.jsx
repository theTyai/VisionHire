import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToast } from '../store/slices/uiSlice';
import api from '../services/api';
import AppLayout from '../components/common/AppLayout';

const defaultForm = {
  text: '', type: 'single', difficulty: 'medium', section: 'General', topic: '', marks: 1,
  options: [{ id: 'A', text: '', isCorrect: false }, { id: 'B', text: '', isCorrect: false }, { id: 'C', text: '', isCorrect: false }, { id: 'D', text: '', isCorrect: false }],
};

export default function AdminQuestions() {
  const { id: assessmentId } = useParams();
  const dispatch = useDispatch();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/questions', { params: { assessmentId } });
      setQuestions(data.data || []);
    } catch (e) {
      dispatch(addToast({ type: 'error', message: 'Failed to fetch questions.' }));
    }
    setLoading(false);
  };

  useEffect(() => { fetchQuestions(); }, [assessmentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hasCorrect = form.options.some(o => o.isCorrect && o.text);
    if (!hasCorrect) return dispatch(addToast({ type: 'error', message: 'At least one option must be marked correct.' }));
    try {
      await api.post('/questions', { ...form, assessmentId });
      dispatch(addToast({ type: 'success', message: 'Question added!' }));
      setShowModal(false);
      setForm(defaultForm);
      fetchQuestions();
    } catch (e) {
      dispatch(addToast({ type: 'error', message: 'Failed to add question.' }));
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/questions/${id}`);
      setQuestions(q => q.filter(x => x._id !== id));
      dispatch(addToast({ type: 'success', message: 'Question removed.' }));
    } catch (e) {
      dispatch(addToast({ type: 'error', message: 'Failed to delete.' }));
    }
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('assessmentId', assessmentId);
    try {
      const { data } = await api.post('/upload/questions-csv', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      dispatch(addToast({ type: 'success', message: `${data.data.inserted} questions uploaded!` }));
      fetchQuestions();
    } catch (e) {
      dispatch(addToast({ type: 'error', message: 'CSV upload failed.' }));
    }
    setUploading(false);
    e.target.value = '';
  };

  const updateOption = (idx, field, value) => {
    setForm(p => {
      const opts = [...p.options];
      if (field === 'isCorrect' && p.type === 'single') {
        opts.forEach((o, i) => { opts[i] = { ...o, isCorrect: i === idx ? value : false }; });
      } else {
        opts[idx] = { ...opts[idx], [field]: value };
      }
      return { ...p, options: opts };
    });
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-display font-bold text-white">Question Bank</h1>
          <div className="flex gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 rounded-lg border border-dark-400 text-gray-300 hover:border-brand-600/50 hover:text-white text-sm transition-colors disabled:opacity-50"
            >
              {uploading ? '⏳ Uploading...' : '📤 CSV Upload'}
            </button>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
            <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-medium">+ Add Question</button>
          </div>
        </div>

        {/* CSV format hint */}
        <div className="mb-4 p-3 rounded-lg bg-brand-600/10 border border-brand-600/20 text-xs text-brand-300">
          CSV format: <code className="font-mono">text, type, difficulty, section, topic, marks, optionA, optionB, optionC, optionD, correct</code> (correct = A/B/C/D or combinations like "AB")
        </div>

        <div className="text-sm text-gray-400 mb-3">{questions.length} questions</div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-dark-700/40 rounded-xl animate-pulse" />)}</div>
        ) : questions.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-4xl mb-3">📝</div>
            <p>No questions yet. Add one or upload a CSV.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((q, i) => (
              <div key={q._id} className="bg-dark-700/60 border border-dark-500/50 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono text-gray-500">Q{i+1}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${q.difficulty === 'easy' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : q.difficulty === 'hard' ? 'text-red-400 border-red-500/20 bg-red-500/10' : 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10'}`}>{q.difficulty}</span>
                      <span className="text-xs text-gray-500">{q.section}</span>
                      {q.type === 'multiple' && <span className="text-xs text-brand-400 bg-brand-600/10 border border-brand-600/20 px-1.5 py-0.5 rounded">multi</span>}
                      <span className="text-xs text-gray-500">{q.marks}m</span>
                    </div>
                    <p className="text-sm text-white mb-2">{q.text}</p>
                    <div className="grid grid-cols-2 gap-1">
                      {q.options?.map(o => (
                        <div key={o.id} className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${o.isCorrect ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-400'}`}>
                          <span className="font-bold">{o.id}.</span> {o.text}
                          {o.isCorrect && <span className="ml-auto">✓</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(q._id)} className="shrink-0 w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs flex items-center justify-center transition-colors">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Question Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-dark-700 border border-dark-500 rounded-2xl p-6 w-full max-w-lg my-4">
            <h3 className="text-lg font-display font-semibold text-white mb-5">Add Question</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Question Text *</label>
                <textarea required rows={3} className="w-full px-3 py-2 bg-dark-600 border border-dark-400 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  value={form.text} onChange={e => setForm(p => ({ ...p, text: e.target.value }))} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Type</label>
                  <select className="w-full px-2 py-2 bg-dark-600 border border-dark-400 rounded-lg text-white text-sm focus:outline-none"
                    value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                    <option value="single">Single</option>
                    <option value="multiple">Multiple</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Difficulty</label>
                  <select className="w-full px-2 py-2 bg-dark-600 border border-dark-400 rounded-lg text-white text-sm focus:outline-none"
                    value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Marks</label>
                  <input type="number" min="0.5" step="0.5" className="w-full px-2 py-2 bg-dark-600 border border-dark-400 rounded-lg text-white text-sm focus:outline-none"
                    value={form.marks} onChange={e => setForm(p => ({ ...p, marks: parseFloat(e.target.value) }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Section</label>
                  <input className="w-full px-2 py-2 bg-dark-600 border border-dark-400 rounded-lg text-white text-sm focus:outline-none"
                    value={form.section} onChange={e => setForm(p => ({ ...p, section: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Topic</label>
                  <input className="w-full px-2 py-2 bg-dark-600 border border-dark-400 rounded-lg text-white text-sm focus:outline-none"
                    value={form.topic} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Options (check correct answer{form.type === 'multiple' ? 's' : ''})</label>
                <div className="space-y-2">
                  {form.options.map((opt, idx) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <span className="w-5 text-xs text-gray-400 font-bold">{opt.id}.</span>
                      <input required className="flex-1 px-3 py-1.5 bg-dark-600 border border-dark-400 rounded-lg text-white text-sm focus:outline-none"
                        placeholder={`Option ${opt.id}`} value={opt.text} onChange={e => updateOption(idx, 'text', e.target.value)} />
                      <input type="checkbox" checked={opt.isCorrect} onChange={e => updateOption(idx, 'isCorrect', e.target.checked)}
                        className="w-4 h-4 rounded text-brand-600 bg-dark-600 border-dark-400 focus:ring-brand-500" />
                      <span className="text-xs text-emerald-400">{opt.isCorrect ? '✓' : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border border-dark-400 rounded-lg text-gray-300 text-sm">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-white font-medium text-sm">Add Question</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
