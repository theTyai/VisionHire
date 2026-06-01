import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTimer } from '../store/slices/attemptSlice';
import { emitHeartbeat } from '../services/socket';

const SYNC_INTERVAL_MS = 30000; // Re-sync with server every 30s
const HEARTBEAT_INTERVAL_MS = 10000;
const WARNING_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
const CRITICAL_THRESHOLD_MS = 60 * 1000;    // 1 minute

export const useTimer = ({ onExpire, onWarning, onCritical } = {}) => {
  const dispatch = useDispatch();
  const { attemptId, serverEndTime, startTime } = useSelector(state => state.attempt);

  const [remainingMs, setRemainingMs] = useState(0);
  const [timerState, setTimerState] = useState('normal'); // normal | warning | critical | expired
  const countdownRef = useRef(null);
  const syncRef = useRef(null);
  const heartbeatRef = useRef(null);
  const warningFiredRef = useRef(false);
  const criticalFiredRef = useRef(false);
  const expiredFiredRef = useRef(false);

  const computeRemaining = useCallback(() => {
    if (!serverEndTime) return 0;
    return Math.max(0, new Date(serverEndTime).getTime() - Date.now());
  }, [serverEndTime]);

  // Sync with server
  const syncWithServer = useCallback(async () => {
    if (!attemptId) return;
    try {
      const result = await dispatch(fetchTimer(attemptId));
      if (result.payload?.expired) {
        setRemainingMs(0);
        if (!expiredFiredRef.current) {
          expiredFiredRef.current = true;
          onExpire?.();
        }
      }
    } catch (e) { /* non-critical */ }
  }, [attemptId, dispatch, onExpire]);

  // Countdown tick
  useEffect(() => {
    if (!serverEndTime) return;

    const tick = () => {
      const remaining = computeRemaining();
      setRemainingMs(remaining);

      if (remaining <= 0) {
        if (!expiredFiredRef.current) {
          expiredFiredRef.current = true;
          setTimerState('expired');
          onExpire?.();
        }
        clearInterval(countdownRef.current);
        return;
      }

      if (remaining <= CRITICAL_THRESHOLD_MS) {
        setTimerState('critical');
        if (!criticalFiredRef.current) {
          criticalFiredRef.current = true;
          onCritical?.();
        }
      } else if (remaining <= WARNING_THRESHOLD_MS) {
        setTimerState('warning');
        if (!warningFiredRef.current) {
          warningFiredRef.current = true;
          onWarning?.();
        }
      }
    };

    tick(); // immediate
    countdownRef.current = setInterval(tick, 1000);

    // Periodic server sync
    syncRef.current = setInterval(syncWithServer, SYNC_INTERVAL_MS);

    // Heartbeat
    heartbeatRef.current = setInterval(() => {
      if (attemptId) emitHeartbeat(attemptId);
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      clearInterval(countdownRef.current);
      clearInterval(syncRef.current);
      clearInterval(heartbeatRef.current);
    };
  }, [serverEndTime, computeRemaining, syncWithServer, onExpire, onWarning, onCritical, attemptId]);

  const formatTime = (ms) => {
    if (ms <= 0) return '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
  };

  return {
    remainingMs,
    formattedTime: formatTime(remainingMs),
    timerState,
    isExpired: remainingMs <= 0,
    isWarning: remainingMs <= WARNING_THRESHOLD_MS && remainingMs > CRITICAL_THRESHOLD_MS,
    isCritical: remainingMs <= CRITICAL_THRESHOLD_MS && remainingMs > 0,
    percentage: serverEndTime && startTime
      ? Math.max(0, (remainingMs / (new Date(serverEndTime) - new Date(startTime))) * 100)
      : 100,
  };
};
