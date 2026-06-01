import React from 'react';

export default function TimerDisplay({ time, state, remainingMs }) {
  const styles = {
    normal: 'text-white bg-dark-700 border-dark-500',
    warning: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30 animate-pulse',
    critical: 'text-red-400 bg-red-500/10 border-red-500/30 animate-pulse',
    expired: 'text-red-500 bg-red-500/20 border-red-500/50',
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border font-mono text-sm font-bold transition-all ${styles[state] || styles.normal}`}>
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <circle cx="12" cy="12" r="10" strokeWidth="2"/>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2"/>
      </svg>
      {time}
    </div>
  );
}
