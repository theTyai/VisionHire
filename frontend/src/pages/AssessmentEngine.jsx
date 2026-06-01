import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  startAttempt, submitAttempt, selectOption, toggleMarkForReview,
  markVisited, setCurrentIndex, clearAttempt, selectProgress,
} from '../store/slices/attemptSlice';
import { useAutosave } from '../hooks/useAutosave';
import { useAntiCheat } from '../hooks/useAntiCheat';
import { useTimer } from '../hooks/useTimer';
import TimerDisplay from '../components/assessment/TimerDisplay';
import QuestionPanel from '../components/assessment/QuestionPanel';
import QuestionNavigator from '../components/assessment/QuestionNavigator';
import SubmitModal from '../components/assessment/SubmitModal';
import ViolationWarning from '../components/assessment/ViolationWarning';

export default function AssessmentEngine() {
  const { id: assessmentId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    attemptId, questions, answers, currentIndex, status, submitError, config, tabSwitchCount,
  } = useSelector(s => s.attempt);
  const progress = useSelector(selectProgress);

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [violationMessage, setViolationMessage] = useState('');
  const questionStartTime = useRef(Date.now());
  const submittingRef = useRef(false);

  const { debouncedSave, saveOnNavigation, performBulkSave } = useAutosave();

  // ── Start attempt on mount
  useEffect(() => {
    dispatch(startAttempt(assessmentId));
    return () => {
      // Don't clear on unmount if submitted — let result page show
    };
  }, [assessmentId, dispatch]);

  // ── Final submit function
  const handleFinalSubmit = useCallback(async (auto = false) => {
    if (submittingRef.current) return;
    submittingRef.current = true;

    // Build answers payload from current state
    const allAnswers = Object.entries(answers).map(([questionId, ans]) => ({
      questionId,
      selectedOptions: ans.selectedOptions || [],
      isMarkedForReview: ans.isMarkedForReview || false,
      timeSpent: ans.timeSpent || 0,
    }));

    const result = await dispatch(submitAttempt({
      attemptId,
      answers: allAnswers,
      currentQuestionIndex: currentIndex,
    }));

    if (submitAttempt.fulfilled.match(result)) {
      dispatch(clearAttempt());
      navigate(`/results/${attemptId}`);
    } else {
      submittingRef.current = false;
    }
  }, [answers, attemptId, currentIndex, dispatch, navigate]);

  // ── Timer callbacks
  const handleTimerExpire = useCallback(() => {
    handleFinalSubmit(true);
  }, [handleFinalSubmit]);

  const handleTimerWarning = useCallback(() => {
    setViolationMessage('⚠️ 5 minutes remaining!');
    setShowViolationWarning(true);
    setTimeout(() => setShowViolationWarning(false), 4000);
  }, []);

  const handleTimerCritical = useCallback(() => {
    setViolationMessage('🚨 Less than 1 minute remaining!');
    setShowViolationWarning(true);
    setTimeout(() => setShowViolationWarning(false), 4000);
  }, []);

  const { formattedTime, timerState, remainingMs } = useTimer({
    onExpire: handleTimerExpire,
    onWarning: handleTimerWarning,
    onCritical: handleTimerCritical,
  });

  // ── Anti-cheat
  const handleViolationLimit = useCallback((type) => {
    if (type === 'tab_switch_limit') {
      setViolationMessage('🚫 Maximum tab switches exceeded. Assessment will be auto-submitted.');
      setShowViolationWarning(true);
      setTimeout(() => handleFinalSubmit(true), 3000);
    }
  }, [handleFinalSubmit]);

  useAntiCheat({
    onViolationLimit: handleViolationLimit,
    tabLimit: config?.tabSwitchLimit || 3,
  });

  // ── Force submit from admin socket
  useEffect(() => {
    const handleForceSubmit = () => handleFinalSubmit(true);
    window.addEventListener('force-submit', handleForceSubmit);
    return () => window.removeEventListener('force-submit', handleForceSubmit);
  }, [handleFinalSubmit]);

  // ── Tab switch warning display
  useEffect(() => {
    if (tabSwitchCount > 0 && tabSwitchCount < (config?.tabSwitchLimit || 3)) {
      setViolationMessage(`Tab switch detected! Warning ${tabSwitchCount}/${config?.tabSwitchLimit || 3}`);
      setShowViolationWarning(true);
      setTimeout(() => setShowViolationWarning(false), 4000);
    }
  }, [tabSwitchCount, config?.tabSwitchLimit]);

  // ── Question navigation
  const navigateTo = useCallback((index) => {
    if (index === currentIndex) return;
    const currentQ = questions[currentIndex];
    if (currentQ) saveOnNavigation(currentQ.id);
    dispatch(setCurrentIndex(index));
    const newQ = questions[index];
    if (newQ) dispatch(markVisited({ questionId: newQ.id }));
    questionStartTime.current = Date.now();
  }, [currentIndex, questions, saveOnNavigation, dispatch]);

  const handleOptionSelect = useCallback((questionId, optionId, type) => {
    dispatch(selectOption({ questionId, optionId, type }));
    const answer = { ...answers[questionId] };
    if (type === 'single') {
      answer.selectedOptions = answer.selectedOptions?.[0] === optionId ? [] : [optionId];
    } else {
      const current = answer.selectedOptions || [];
      answer.selectedOptions = current.includes(optionId)
        ? current.filter(id => id !== optionId)
        : [...current, optionId];
    }
    debouncedSave(questionId, answer, 'option_click');
  }, [dispatch, answers, debouncedSave]);

  const handleMarkForReview = useCallback((questionId) => {
    dispatch(toggleMarkForReview({ questionId }));
    debouncedSave(questionId, answers[questionId] || {}, 'mark_review');
  }, [dispatch, answers, debouncedSave]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (status === 'error' && !attemptId) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-white mb-2">Unable to start assessment</h2>
          <p className="text-gray-400 mb-4">{submitError}</p>
          <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-500 transition-colors">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col" style={{ userSelect: 'none' }}>
      {/* Top bar */}
      <header className="h-14 bg-dark-800 border-b border-dark-600/50 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
          <span className="font-display font-bold text-white text-sm">VisionHire</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Progress */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
            <span className="text-emerald-400 font-medium">{progress.answered}</span>/<span>{progress.total}</span> answered
          </div>

          {/* Autosave indicator */}
          <AutosaveIndicator answers={answers} />

          {/* Timer */}
          <TimerDisplay time={formattedTime} state={timerState} remainingMs={remainingMs} />

          {/* Submit button */}
          <button
            onClick={() => setShowSubmitModal(true)}
            disabled={status === 'submitting'}
            className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {status === 'submitting' ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Question area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {currentQuestion && (
            <QuestionPanel
              question={currentQuestion}
              answer={answers[currentQuestion.id]}
              questionNumber={currentIndex + 1}
              totalQuestions={questions.length}
              onOptionSelect={handleOptionSelect}
              onMarkForReview={handleMarkForReview}
            />
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-6 max-w-3xl">
            <button
              onClick={() => navigateTo(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-lg border border-dark-500 text-gray-300 hover:border-brand-600/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm"
            >
              ← Previous
            </button>

            <span className="text-xs text-gray-500">{currentIndex + 1} / {questions.length}</span>

            <button
              onClick={() => navigateTo(Math.min(questions.length - 1, currentIndex + 1))}
              disabled={currentIndex === questions.length - 1}
              className="px-4 py-2 rounded-lg border border-dark-500 text-gray-300 hover:border-brand-600/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm"
            >
              Next →
            </button>
          </div>
        </main>

        {/* Question navigator sidebar */}
        <aside className="w-64 shrink-0 border-l border-dark-600/50 overflow-y-auto hidden lg:block">
          <QuestionNavigator
            questions={questions}
            answers={answers}
            currentIndex={currentIndex}
            onNavigate={navigateTo}
            progress={progress}
          />
        </aside>
      </div>

      {/* Modals */}
      {showSubmitModal && (
        <SubmitModal
          progress={progress}
          onConfirm={() => { setShowSubmitModal(false); handleFinalSubmit(false); }}
          onCancel={() => setShowSubmitModal(false)}
          isSubmitting={status === 'submitting'}
        />
      )}

      {showViolationWarning && (
        <ViolationWarning message={violationMessage} onDismiss={() => setShowViolationWarning(false)} />
      )}
    </div>
  );
}

// Autosave status indicator
function AutosaveIndicator({ answers }) {
  const hasDirty = Object.values(answers).some(a => a?.isDirty);
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <div className={`w-1.5 h-1.5 rounded-full ${hasDirty ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-400'}`} />
      <span className={hasDirty ? 'text-yellow-400' : 'text-emerald-400'}>
        {hasDirty ? 'Saving...' : 'Saved'}
      </span>
    </div>
  );
}
