import axios from 'axios';
import { store } from '../store';
import { logout } from '../store/slices/authSlice';
import { addToast } from '../store/slices/uiSlice';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vh_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response } = error;

    if (response?.status === 401 && !error.config.url.includes('/auth/logout')) {
      store.dispatch(logout());
      store.dispatch(addToast({ type: 'error', message: 'Session expired. Please login again.' }));
    }

    if (response?.status === 429) {
      store.dispatch(addToast({ type: 'warning', message: 'Too many requests. Please slow down.' }));
    }

    if (response?.status >= 500) {
      store.dispatch(addToast({ type: 'error', message: 'Server error. Please try again.' }));
    }

    return Promise.reject(error);
  }
);

export default api;
