import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import assessmentReducer from './slices/assessmentSlice';
import attemptReducer from './slices/attemptSlice';
import adminReducer from './slices/adminSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    assessment: assessmentReducer,
    attempt: attemptReducer,
    admin: adminReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['attempt/setServerEndTime'],
        ignoredPaths: ['attempt.serverEndTime'],
      },
    }),
});

export default store;
