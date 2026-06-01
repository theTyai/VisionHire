// QuestionNavigator.jsx
import React from 'react';

export default function QuestionNavigator({ questions, answers, currentIndex, onNavigate, progress }) {
  const getQuestionStatus = (question, index) => {
    const ans = answers[question.id];
    if (index === currentIndex) return 'current';
    if (ans?.isMarkedForReview) return 'marked';
    if (ans?.selectedOptions?.length > 0) return 'answered';
    if (ans?.isVisited) return 'visited';
    return 'unattempted';
  };

  const statusStyles = {
    current: 'bg-brand-600 border-brand-500 text-white ring-2 ring-brand-600/30',
    answered: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
    marked: 'bg-purple-500/20 border-purple-500/40 text-purple-400',
    visited: 'bg-dark-500 border-dark-400 text-gray-400',
    unattempted: 'bg-dark-600/50 border-dark-500/50 text-gray-500',
  };

  return (
    <div className="p-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Questions</h3>

      {/* Legend */}
      <div className="space-y-1.5 mb-4">
        {[
          { status: 'answered', label: `Answered (${progress.answered})`, color: 'bg-emerald-500' },
          { status: 'marked', label: `Marked (${progress.marked})`, color: 'bg-purple-500' },
          { status: 'visited', label: 'Visited', color: 'bg-dark-400' },
          { status: 'unattempted', label: `Unanswered (${progress.unanswered})`, color: 'bg-dark-500' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2 text-xs text-gray-500">
            <div className={`w-2 h-2 rounded-sm ${color}`} />
            {label}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-5 gap-1.5">
        {questions.map((q, index) => {
          const status = getQuestionStatus(q, index);
          return (
            <button
              key={q.id}
              onClick={() => onNavigate(index)}
              className={`h-8 w-full rounded-md border text-xs font-medium transition-all hover:scale-105 ${statusStyles[status]}`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
