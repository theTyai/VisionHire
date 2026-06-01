import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { removeToast } from '../../store/slices/uiSlice';

const Toast = ({ toast }) => {
  const dispatch = useDispatch();
  useEffect(() => {
    const t = setTimeout(() => dispatch(removeToast(toast.id)), toast.duration || 4000);
    return () => clearTimeout(t);
  }, [toast.id, toast.duration, dispatch]);

  const styles = {
    success: 'bg-emerald-900/90 border-emerald-500/40 text-emerald-100',
    error: 'bg-red-900/90 border-red-500/40 text-red-100',
    warning: 'bg-yellow-900/90 border-yellow-500/40 text-yellow-100',
    info: 'bg-brand-900/90 border-brand-500/40 text-brand-100',
  };
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm shadow-2xl text-sm animate-fade-in ${styles[toast.type] || styles.info}`}>
      <span>{icons[toast.type] || icons.info}</span>
      <p>{toast.message}</p>
      <button onClick={() => dispatch(removeToast(toast.id))} className="ml-auto opacity-60 hover:opacity-100">✕</button>
    </div>
  );
};

export default function ToastContainer() {
  const toasts = useSelector(s => s.ui.toasts);
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(t => <div key={t.id} className="pointer-events-auto"><Toast toast={t} /></div>)}
    </div>
  );
}
