import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchAdminStats = createAsyncThunk('admin/fetchStats', async () => {
  const { data } = await api.get('/admin/stats');
  return data.data;
});

export const fetchLeaderboard = createAsyncThunk('admin/fetchLeaderboard', async (assessmentId) => {
  const { data } = await api.get(`/admin/leaderboard/${assessmentId}`);
  return data.data;
});

export const fetchCandidates = createAsyncThunk('admin/fetchCandidates', async (params = {}) => {
  const { data } = await api.get('/admin/candidates', { params });
  return data;
});

export const updateShortlist = createAsyncThunk('admin/updateShortlist', async ({ resultId, status }) => {
  const { data } = await api.patch(`/admin/shortlist/${resultId}`, { status });
  return data.data;
});

export const fetchAnalytics = createAsyncThunk('admin/fetchAnalytics', async (assessmentId) => {
  const { data } = await api.get(`/analytics/assessment/${assessmentId}`);
  return data.data;
});

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    stats: null, leaderboard: [], candidates: [], analytics: null,
    activeCandidates: [], loading: false, error: null,
  },
  reducers: {
    addActiveCandidate: (state, action) => {
      const exists = state.activeCandidates.find(c => c.candidateId === action.payload.candidateId);
      if (!exists) state.activeCandidates.push(action.payload);
    },
    removeActiveCandidate: (state, action) => {
      state.activeCandidates = state.activeCandidates.filter(c => c.candidateId !== action.payload);
    },
    updateActiveCount: (state, action) => {
      if (state.stats) state.stats.activeCandidates = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminStats.fulfilled, (state, action) => { state.stats = action.payload; })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => { state.leaderboard = action.payload; })
      .addCase(fetchCandidates.fulfilled, (state, action) => { state.candidates = action.payload.data; })
      .addCase(fetchAnalytics.fulfilled, (state, action) => { state.analytics = action.payload; })
      .addCase(updateShortlist.fulfilled, (state, action) => {
        const idx = state.leaderboard.findIndex(r => r._id === action.payload._id);
        if (idx !== -1) state.leaderboard[idx] = action.payload;
      });
  },
});

export const { addActiveCandidate, removeActiveCandidate, updateActiveCount } = adminSlice.actions;
export default adminSlice.reducer;
