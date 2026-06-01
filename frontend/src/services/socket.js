import { io } from 'socket.io-client';
import { store } from '../store';
import { addViolation, incrementTabSwitch, setServerEndTime } from '../store/slices/attemptSlice';
import { addActiveCandidate, removeActiveCandidate, updateActiveCount } from '../store/slices/adminSlice';
import { addToast, addNotification } from '../store/slices/uiSlice';

let socket = null;

export const connectSocket = (token) => {
  if (socket?.connected) return socket;

  socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
  });

  // Timer sync from server
  socket.on('timer:sync', (data) => {
    store.dispatch(setServerEndTime(data.serverEndTime));
  });

  // Force submit by admin
  socket.on('force-submit', (data) => {
    store.dispatch(addToast({ type: 'warning', message: 'Assessment force-submitted by admin.' }));
    // Trigger submission
    window.dispatchEvent(new CustomEvent('force-submit', { detail: data }));
  });

  // Admin events
  socket.on('candidate:started', (data) => {
    store.dispatch(addActiveCandidate(data));
    store.dispatch(addNotification({ message: `${data.candidateName} started the assessment`, type: 'info' }));
  });

  socket.on('candidate:submitted', (data) => {
    store.dispatch(removeActiveCandidate(data.candidateId));
    store.dispatch(addNotification({ message: `${data.candidateName} submitted`, type: 'success' }));
  });

  socket.on('admin:active-count', (data) => {
    store.dispatch(updateActiveCount(data.count));
  });

  socket.on('violation:detected', (data) => {
    store.dispatch(addNotification({
      message: `Violation: ${data.candidateName} — ${data.type.replace('_', ' ')}`,
      type: 'error',
    }));
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const emitViolation = (type, description, metadata = {}) => {
  if (socket?.connected) {
    socket.emit('violation', { type, description, metadata });
  }
};

export const emitHeartbeat = (attemptId) => {
  if (socket?.connected) {
    socket.emit('heartbeat', { attemptId, timestamp: Date.now() });
  }
};

export const requestAdminData = () => {
  if (socket?.connected) {
    socket.emit('admin:get-active');
  }
};
