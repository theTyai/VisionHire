import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { autosaveSingle, bulkAutosave } from '../store/slices/attemptSlice';

const DEBOUNCE_MS = 800;
const BULK_INTERVAL_MS = 15000;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

/**
 * useAutosave — implements the critical autosave architecture:
 * - Per-answer debounced save on every option click
 * - Bulk periodic save every 15 seconds
 * - Retry mechanism for failed saves
 * - localStorage backup
 */
export const useAutosave = () => {
  const dispatch = useDispatch();
  const { attemptId, answers, currentIndex } = useSelector(state => state.attempt);
  
  const debounceTimers = useRef({});
  const bulkIntervalRef = useRef(null);
  const retryQueues = useRef({}); // { questionId: { attempts, timer } }

  // ── Retry mechanism
  const scheduleRetry = useCallback((questionId, answerData, source) => {
    if (!retryQueues.current[questionId]) {
      retryQueues.current[questionId] = { attempts: 0 };
    }

    const retryState = retryQueues.current[questionId];
    if (retryState.attempts >= MAX_RETRY_ATTEMPTS) {
      console.warn(`Max retries reached for question ${questionId}. Answer preserved in localStorage.`);
      return;
    }

    retryState.attempts++;
    const delay = RETRY_DELAY_MS * Math.pow(2, retryState.attempts - 1); // exponential backoff

    retryState.timer = setTimeout(() => {
      dispatch(autosaveSingle({
        attemptId,
        questionId,
        selectedOptions: answerData.selectedOptions || [],
        isMarkedForReview: answerData.isMarkedForReview || false,
        timeSpent: answerData.timeSpent || 0,
        source: 'retry',
      }));
    }, delay);
  }, [attemptId, dispatch]);

  // ── Per-answer debounced save
  const debouncedSave = useCallback((questionId, answerData, source = 'option_click') => {
    if (!attemptId || !questionId) return;

    // Cancel existing debounce for this question
    if (debounceTimers.current[questionId]) {
      clearTimeout(debounceTimers.current[questionId]);
    }

    debounceTimers.current[questionId] = setTimeout(async () => {
      try {
        const result = await dispatch(autosaveSingle({
          attemptId,
          questionId,
          selectedOptions: answerData.selectedOptions || [],
          isMarkedForReview: answerData.isMarkedForReview || false,
          timeSpent: answerData.timeSpent || 0,
          source,
        }));

        if (result.meta.requestStatus === 'rejected' && result.payload?.retry) {
          scheduleRetry(questionId, answerData, source);
        } else {
          // Clear retry on success
          if (retryQueues.current[questionId]) {
            clearTimeout(retryQueues.current[questionId].timer);
            delete retryQueues.current[questionId];
          }
        }
      } catch (err) {
        console.error('Autosave failed:', err);
        scheduleRetry(questionId, answerData, source);
      }
    }, DEBOUNCE_MS);
  }, [attemptId, dispatch, scheduleRetry]);

  // ── Bulk periodic save (15s interval)
  const performBulkSave = useCallback(() => {
    if (!attemptId) return;


    // Always send a bulk save as a snapshot even if nothing is dirty
    const allAnswers = Object.entries(answers).map(([questionId, ans]) => ({
      questionId,
      selectedOptions: ans.selectedOptions || [],
      isMarkedForReview: ans.isMarkedForReview || false,
      timeSpent: ans.timeSpent || 0,
    }));

    if (allAnswers.length > 0) {
      dispatch(bulkAutosave({
        attemptId,
        answers: allAnswers,
        currentQuestionIndex: currentIndex,
      }));
    }
  }, [attemptId, answers, currentIndex, dispatch]);

  // ── Start bulk interval
  useEffect(() => {
    if (!attemptId) return;

    bulkIntervalRef.current = setInterval(performBulkSave, BULK_INTERVAL_MS);

    return () => {
      if (bulkIntervalRef.current) clearInterval(bulkIntervalRef.current);
    };
  }, [attemptId, performBulkSave]);

  // ── Save on navigation (question change)
  const saveOnNavigation = useCallback((questionId) => {
    if (!attemptId || !questionId || !answers[questionId]) return;
    debouncedSave(questionId, answers[questionId], 'navigation');
  }, [attemptId, answers, debouncedSave]);

  // ── Save everything before page unload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!attemptId) return;
      
      // Synchronous localStorage backup (only sync option)
      try {
        const backup = {
          attemptId,
          answers,
          currentIndex,
          timestamp: Date.now(),
        };
        localStorage.setItem(`vh_attempt_${attemptId}`, JSON.stringify(backup));
      } catch (err) { /* storage full */ }

      e.preventDefault();
      e.returnValue = 'Your assessment is in progress. Are you sure you want to leave?';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [attemptId, answers, currentIndex]);

  // ── Cleanup debounce timers
  useEffect(() => {
    const activeDebounceTimers = debounceTimers.current;
    const activeRetryQueues = retryQueues.current;
    return () => {
      Object.values(activeDebounceTimers).forEach(clearTimeout);
      Object.values(activeRetryQueues).forEach(r => r.timer && clearTimeout(r.timer));
    };
  }, []);

  return { debouncedSave, saveOnNavigation, performBulkSave };
};
