import React from 'react';

const difficultyColors = {
  easy: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  hard: 'text-red-400 bg-red-400/10 border-red-400/20',
};

export default function QuestionPanel({
  question, answer, questionNumber, totalQuestions,
  onOptionSelect, onMarkForReview,
}) {
  if (!question) return null;

  const selectedOptions = answer?.selectedOptions || [];
  const isMarked = answer?.isMarkedForReview || false;

  const isSelected = (optionId) => selectedOptions.includes(optionId);

  return (
    <div className="max-w-3xl animate-fade-in">
      {/* Question header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-gray-500 bg-dark-700 border border-dark-500 px-2 py-0.5 rounded">
            Q{questionNumber}/{totalQuestions}
          </span>
          {question.difficulty && (
            <span className={`text-xs px-2 py-0.5 rounded border font-medium ${difficultyColors[question.difficulty]}`}>
              {question.difficulty}
            </span>
          )}
          {question.section && question.section !== 'General' && (
            <span className="text-xs text-gray-500 bg-dark-700 border border-dark-500 px-2 py-0.5 rounded">
              {question.section}
            </span>
          )}
          {question.type === 'multiple' && (
            <span className="text-xs text-brand-400 bg-brand-600/10 border border-brand-600/20 px-2 py-0.5 rounded">
              Multiple correct
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{question.marks} mark{question.marks !== 1 ? 's' : ''}</span>
          <button
            onClick={() => onMarkForReview(question.id)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
              isMarked
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                : 'bg-dark-700 border-dark-500 text-gray-400 hover:border-purple-500/30 hover:text-purple-400'
            }`}
          >
            <span>{isMarked ? '🔖' : '📌'}</span>
            {isMarked ? 'Marked' : 'Mark for review'}
          </button>
        </div>
      </div>

      {/* Question text */}
      <div className="bg-dark-700/60 border border-dark-500/50 rounded-xl p-5 mb-5">
        <p className="text-white leading-relaxed text-base">{question.text}</p>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {question.options?.map((option) => {
          const selected = isSelected(option.id);
          return (
            <button
              key={option.id}
              onClick={() => onOptionSelect(question.id, option.id, question.type)}
              className={`w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-150 group ${
                selected
                  ? 'bg-brand-600/15 border-brand-500/60 text-white'
                  : 'bg-dark-700/40 border-dark-500/50 text-gray-300 hover:bg-dark-600/60 hover:border-dark-400'
              }`}
            >
              {/* Selector indicator */}
              <div className={`shrink-0 w-5 h-5 rounded-${question.type === 'single' ? 'full' : 'md'} border-2 flex items-center justify-center transition-all ${
                selected
                  ? 'bg-brand-600 border-brand-500'
                  : 'border-dark-400 group-hover:border-brand-600/50'
              }`}>
                {selected && (
                  <div className={`${question.type === 'single' ? 'w-2 h-2 rounded-full bg-white' : ''}`}>
                    {question.type === 'multiple' && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                )}
              </div>

              {/* Option label */}
              <span className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold transition-all ${
                selected ? 'bg-brand-600 text-white' : 'bg-dark-600 text-gray-400'
              }`}>
                {option.id}
              </span>

              <span className="text-sm leading-relaxed">{option.text}</span>
            </button>
          );
        })}
      </div>

      {/* Answer status */}
      {selectedOptions.length > 0 && (
        <div className="mt-3 text-xs text-emerald-400 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {selectedOptions.length === 1 ? 'Answer selected' : `${selectedOptions.length} options selected`}
        </div>
      )}
    </div>
  );
}
