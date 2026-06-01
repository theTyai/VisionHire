import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchAssessments = createAsyncThunk('assessment/fetchAll', async (params = {}) => {
  const { data } = await api.get('/assessments', { params });
  return data;
});

export const fetchAssessment = createAsyncThunk('assessment/fetchOne', async (id) => {
  const { data } = await api.get(`/assessments/${id}`);
  return data.data;
});

export const createAssessment = createAsyncThunk('assessment/create', async (assessmentData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/assessments', assessmentData);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const updateAssessment = createAsyncThunk('assessment/update', async ({ id, data: updateData }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/assessments/${id}`, updateData);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const assessmentSlice = createSlice({
  name: 'assessment',
  initialState: { list: [], current: null, loading: false, error: null, total: 0, page: 1 },
  reducers: { clearCurrent: (state) => { state.current = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssessments.pending, (state) => { state.loading = true; })
      .addCase(fetchAssessments.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data;
        state.total = action.payload.total;
      })
      .addCase(fetchAssessments.rejected, (state) => { state.loading = false; })
      .addCase(fetchAssessment.fulfilled, (state, action) => { state.current = action.payload; })
      .addCase(createAssessment.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
        state.total++;
      })
      .addCase(updateAssessment.fulfilled, (state, action) => {
        const idx = state.list.findIndex(a => a._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
        if (state.current?._id === action.payload._id) state.current = action.payload;
      });
  },
});

export const { clearCurrent } = assessmentSlice.actions;
export default assessmentSlice.reducer;
