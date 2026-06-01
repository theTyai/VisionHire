import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    darkMode: localStorage.getItem('vh_dark') !== 'false',
    sidebarOpen: true,
    notifications: [],
    toasts: [],
  },
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('vh_dark', state.darkMode);
    },
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    addToast: (state, action) => {
      state.toasts.push({ id: Date.now(), ...action.payload });
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter(t => t.id !== action.payload);
    },
    addNotification: (state, action) => {
      state.notifications.unshift({ id: Date.now(), read: false, ...action.payload });
    },
    markNotificationRead: (state, action) => {
      const n = state.notifications.find(n => n.id === action.payload);
      if (n) n.read = true;
    },
  },
});

export const { toggleDarkMode, toggleSidebar, addToast, removeToast, addNotification, markNotificationRead } = uiSlice.actions;
export default uiSlice.reducer;
