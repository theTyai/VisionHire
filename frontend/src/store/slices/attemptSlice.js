import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// ──── THUNKS ────────────────────────────────────────────────

export const startAttempt = createAsyncThunk('attempt/start', async (assessmentId, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/attempt/start/${assessmentId}`);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to start assessment');
  }
});

export const autosaveSingle = createAsyncThunk('attempt/autosave', async ({ attemptId, questionId, selectedOptions, isMarkedForReview, timeSpent, source }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/attempt/autosave/${attemptId}`, {
      questionId, selectedOptions, isMarkedForReview, timeSpent, source,
    });
    return { questionId, savedAt: data.savedAt };
  } catch (err) {
    return rejectWithValue({ questionId, error: err.message });
  }
});

export const bulkAutosave = createAsyncThunk('attempt/bulkAutosave', async ({ attemptId, answers, currentQuestionIndex }, { rejectWithValue }) => {
  try {
    await api.post(`/attempt/autosave-bulk/${attemptId}`, { answers, currentQuestionIndex });
    return { savedCount: answers.length };
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const submitAttempt = createAsyncThunk('attempt/submit', async ({ attemptId, answers, currentQuestionIndex }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/attempt/submit/${attemptId}`, { answers, currentQuestionIndex });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Submission failed');
  }
});

export const fetchTimer = createAsyncThunk('attempt/fetchTimer', async (attemptId, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/attempt/timer/${attemptId}`);
    return data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const logViolation = createAsyncThunk('attempt/logViolation', async ({ attemptId, type, description, metadata }) => {
  try {
    await api.post(`/attempt/violation/${attemptId}`, { type, description, metadata });
  } catch (e) { /* non-critical */ }
});

// ──── SLICE ──────────────────────────────────────────────────

const attemptSlice = createSlice({
  name: 'attempt',
  initialState: {
    attemptId: null,
    questions: [],
    answers: {}, // { questionId: { selectedOptions, isMarkedForReview, timeSpent, savedAt, isDirty } }
    currentIndex: 0,
    serverEndTime: null,
    startTime: null,
    config: {},
    status: 'idle', // idle | loading | in-progress | submitting | submitted | error
    submitError: null,
    autosaveStatus: {}, // { questionId: 'saving' | 'saved' | 'error' }
    lastBulkSave: null,
    tabSwitchCount: 0,
    fullscreenExitCount: 0,
    violations: [],
    pendingAnswers: [], // answers that failed to save
  },
  reducers: {
    setCurrentIndex: (state, action) => {
      state.currentIndex = action.payload;
    },

    selectOption: (state, action) => {
      const { questionId, optionId, type } = action.payload;
      if (!state.answers[questionId]) {
        state.answers[questionId] = { selectedOptions: [], isMarkedForReview: false, timeSpent: 0, isDirty: true };
      }

      const answer = state.answers[questionId];
      answer.isDirty = true;

      if (type === 'single') {
        answer.selectedOptions = answer.selectedOptions[0] === optionId ? [] : [optionId];
      } else {
        const idx = answer.selectedOptions.indexOf(optionId);
        if (idx === -1) answer.selectedOptions.push(optionId);
        else answer.selectedOptions.splice(idx, 1);
      }

      // Optimistic UI - mark as saving
      state.autosaveStatus[questionId] = 'saving';

      // LocalStorage backup
      try {
        const backup = { attemptId: state.attemptId, answers: state.answers, currentIndex: state.currentIndex, timestamp: Date.now() };
        localStorage.setItem(`vh_attempt_${state.attemptId}`, JSON.stringify(backup));
      } catch (e) { /* storage full */ }
    },

    toggleMarkForReview: (state, action) => {
      const { questionId } = action.payload;
      if (!state.answers[questionId]) {
        state.answers[questionId] = { selectedOptions: [], isMarkedForReview: false, timeSpent: 0, isDirty: true };
      }
      state.answers[questionId].isMarkedForReview = !state.answers[questionId].isMarkedForReview;
      state.answers[questionId].isDirty = true;
    },

    markVisited: (state, action) => {
      const { questionId } = action.payload;
      if (!state.answers[questionId]) {
        state.answers[questionId] = { selectedOptions: [], isMarkedForReview: false, timeSpent: 0, isDirty: false };
      }
    },

    updateTimeSpent: (state, action) => {
      const { questionId, seconds } = action.payload;
      if (state.answers[questionId]) {
        state.answers[questionId].timeSpent = (state.answers[questionId].timeSpent || 0) + seconds;
      }
    },

    incrementTabSwitch: (state) => { state.tabSwitchCount++; },
    incrementFullscreenExit: (state) => { state.fullscreenExitCount++; },

    addViolation: (state, action) => {
      state.violations.push({ ...action.payload, timestamp: Date.now() });
    },

    setServerEndTime: (state, action) => {
      state.serverEndTime = action.payload;
    },

    clearAttempt: (state) => {
      Object.assign(state, {
        attemptId: null, questions: [], answers: {}, currentIndex: 0,
        serverEndTime: null, startTime: null, config: {}, status: 'idle',
        submitError: null, autosaveStatus: {}, lastBulkSave: null,
        tabSwitchCount: 0, fullscreenExitCount: 0, violations: [], pendingAnswers: [],
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(startAttempt.pending, (state) => { state.status = 'loading'; })
      .addCase(startAttempt.fulfilled, (state, action) => {
        const { attemptId, questions, serverEndTime, startTime, config, savedAnswers, currentQuestionIndex } = action.payload;
        state.status = 'in-progress';
        state.attemptId = attemptId;
        state.questions = questions;
        state.serverEndTime = serverEndTime;
        state.startTime = startTime;
        state.config = config || {};
        state.currentIndex = currentQuestionIndex || 0;

        // Restore saved answers (resume)
        if (savedAnswers) {
          savedAnswers.forEach(sa => {
            state.answers[sa.questionId] = {
              selectedOptions: sa.selectedOptions || [],
              isMarkedForReview: sa.isMarkedForReview || false,
              timeSpent: sa.timeSpent || 0,
              isDirty: false,
              savedAt: sa.savedAt,
            };
          });
        }

        // Also restore from localStorage if newer
        try {
          const backup = JSON.parse(localStorage.getItem(`vh_attempt_${attemptId}`));
          if (backup && backup.timestamp > (new Date(startTime).getTime())) {
            Object.entries(backup.answers || {}).forEach(([qId, ans]) => {
              if (!state.answers[qId] || ans.isDirty) {
                state.answers[qId] = ans;
              }
            });
          }
        } catch (e) { /* corrupted backup */ }
      })
      .addCase(startAttempt.rejected, (state, action) => {
        state.status = 'error';
        state.submitError = action.payload;
      })

      .addCase(autosaveSingle.fulfilled, (state, action) => {
        const { questionId, savedAt } = action.payload;
        state.autosaveStatus[questionId] = 'saved';
        if (state.answers[questionId]) {
          state.answers[questionId].isDirty = false;
          state.answers[questionId].savedAt = savedAt;
        }
      })
      .addCase(autosaveSingle.rejected, (state, action) => {
        if (action.payload?.questionId) {
          state.autosaveStatus[action.payload.questionId] = 'error';
        }
      })

      .addCase(bulkAutosave.fulfilled, (state) => {
        state.lastBulkSave = new Date().toISOString();
        // Mark all as not dirty
        Object.keys(state.answers).forEach(qId => {
          if (state.answers[qId]) state.answers[qId].isDirty = false;
        });
      })

      .addCase(submitAttempt.pending, (state) => {
        state.status = 'submitting';
        state.submitError = null;
      })
      .addCase(submitAttempt.fulfilled, (state) => {
        state.status = 'submitted';
        try { localStorage.removeItem(`vh_attempt_${state.attemptId}`); } catch (e) { /* ok */ }
      })
      .addCase(submitAttempt.rejected, (state, action) => {
        state.status = 'error';
        state.submitError = action.payload;
      })

      .addCase(fetchTimer.fulfilled, (state, action) => {
        if (action.payload.serverEndTime) state.serverEndTime = action.payload.serverEndTime;
      });
  },
});

export const {
  setCurrentIndex, selectOption, toggleMarkForReview, markVisited,
  updateTimeSpent, incrementTabSwitch, incrementFullscreenExit,
  addViolation, setServerEndTime, clearAttempt,
} = attemptSlice.actions;

// Selectors
export const selectCurrentQuestion = (state) => state.attempt.questions[state.attempt.currentIndex];
export const selectAnswerForQuestion = (questionId) => (state) => state.attempt.answers[questionId];
export const selectProgress = (state) => {
  const { questions, answers } = state.attempt;
  const answered = questions.filter(q => answers[q.id]?.selectedOptions?.length > 0).length;
  const marked = questions.filter(q => answers[q.id]?.isMarkedForReview).length;
  return { answered, marked, total: questions.length, unanswered: questions.length - answered };
};

export default attemptSlice.reducer;
