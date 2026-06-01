import React from 'react';

export default function SubmitModal({ progress, onConfirm, onCancel, isSubmitting }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-700 border border-dark-500 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fade-in">
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-full bg-brand-600/15 border border-brand-600/30 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-display font-semibold text-white">Submit Assessment?</h3>
          <p className="text-sm text-gray-400 mt-1">This action cannot be undone.</p>
        </div>

        {/* Summary */}
        <div className="bg-dark-800/60 rounded-xl p-4 mb-5 space-y-2">
          {[
            { label: 'Total Questions', value: progress.total },
            { label: 'Answered', value: progress.answered, color: 'text-emerald-400' },
            { label: 'Marked for Review', value: progress.marked, color: 'text-purple-400' },
            { label: 'Unanswered', value: progress.unanswered, color: progress.unanswered > 0 ? 'text-yellow-400' : 'text-gray-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray-400">{label}</span>
              <span className={`font-medium ${color || 'text-white'}`}>{value}</span>
            </div>
          ))}
        </div>

        {progress.unanswered > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs">
            ⚠️ You have {progress.unanswered} unanswered question{progress.unanswered !== 1 ? 's' : ''}.
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-lg border border-dark-400 text-gray-300 hover:border-gray-500 transition-colors text-sm"
          >
            Continue
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
