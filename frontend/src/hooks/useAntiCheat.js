import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { incrementTabSwitch, incrementFullscreenExit, addViolation, logViolation } from '../store/slices/attemptSlice';
import { emitViolation } from '../services/socket';

export const useAntiCheat = ({ onViolationLimit, tabLimit = 3 } = {}) => {
  const dispatch = useDispatch();
  const { attemptId, tabSwitchCount, fullscreenExitCount, status } = useSelector(state => state.attempt);
  const isActive = status === 'in-progress';
  const lastViolationTime = useRef({});

  const recordViolation = useCallback((type, description, metadata = {}, severity = 'medium') => {
    if (!isActive || !attemptId) return;

    // Debounce same violation type (500ms)
    const now = Date.now();
    if (lastViolationTime.current[type] && (now - lastViolationTime.current[type]) < 500) return;
    lastViolationTime.current[type] = now;

    dispatch(addViolation({ type, description, metadata, severity }));
    emitViolation(type, description, metadata);

    // Log to server
    dispatch(logViolation({ attemptId, type, description, metadata }));
  }, [isActive, attemptId, dispatch]);

  useEffect(() => {
    if (!isActive) return;

    // ── Fullscreen enforcement
    const enterFullscreen = () => {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isActive) {
        dispatch(incrementFullscreenExit());
        recordViolation('fullscreen_exit', 'Exited fullscreen mode');
        
        const totalViolations = tabSwitchCount + fullscreenExitCount + 1;
        if (totalViolations >= tabLimit && onViolationLimit) {
          onViolationLimit('fullscreen_limit');
        } else {
          // Re-enter fullscreen
          setTimeout(enterFullscreen, 1000);
        }
      }
    };

    // ── Tab/Window focus detection
    const handleVisibilityChange = () => {
      if (document.hidden && isActive) {
        dispatch(incrementTabSwitch());
        recordViolation('tab_switch', 'Switched tab or minimized window');
        
        const totalViolations = tabSwitchCount + fullscreenExitCount + 1;
        if (totalViolations >= tabLimit && onViolationLimit) {
          onViolationLimit('tab_switch_limit');
        }
      }
    };

    const handleWindowBlur = () => {
      if (isActive) {
        recordViolation('window_blur', 'Window lost focus', {}, 'low');
      }
    };

    // ── Keyboard shortcuts
    const handleKeyDown = (e) => {
      // Block: F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S, Ctrl+A, PrtSc, Alt+Tab
      const blocked = [
        e.key === 'F12',
        e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key),
        e.ctrlKey && ['u', 'U', 's', 'S'].includes(e.key),
        e.key === 'PrintScreen',
        e.metaKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key),
      ];

      if (blocked.some(Boolean)) {
        e.preventDefault();
        recordViolation('keyboard_shortcut', `Blocked keyboard shortcut: ${e.key}`, { key: e.key, ctrlKey: e.ctrlKey }, 'high');
        return false;
      }
    };

    // ── Copy/Paste prevention
    const handleCopy = (e) => {
      if (isActive) {
        e.preventDefault();
        recordViolation('copy_paste', 'Attempted to copy content');
      }
    };

    const handlePaste = (e) => {
      if (isActive) {
        e.preventDefault();
        recordViolation('copy_paste', 'Attempted to paste content');
      }
    };

    const handleCut = (e) => {
      if (isActive) {
        e.preventDefault();
      }
    };

    // ── Right-click prevention
    const handleContextMenu = (e) => {
      if (isActive) {
        e.preventDefault();
        recordViolation('right_click', 'Right-clicked during assessment', {}, 'low');
      }
    };

    // Register all listeners
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);
    document.addEventListener('contextmenu', handleContextMenu);

    // Enter fullscreen on start
    enterFullscreen();

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isActive, attemptId, tabSwitchCount, fullscreenExitCount, tabLimit, recordViolation, onViolationLimit, dispatch]);

  return { recordViolation };
};
