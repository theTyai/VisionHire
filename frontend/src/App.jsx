import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe } from './store/slices/authSlice';
import { connectSocket } from './services/socket';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CandidateDashboard from './pages/CandidateDashboard';
import AssessmentListPage from './pages/AssessmentListPage';
import AssessmentEngine from './pages/AssessmentEngine';
import ResultPage from './pages/ResultPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminAssessments from './pages/AdminAssessments';
import AdminQuestions from './pages/AdminQuestions';
import AdminLeaderboard from './pages/AdminLeaderboard';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminMonitor from './pages/AdminMonitor';

// Components
import ToastContainer from './components/common/ToastContainer';
import LoadingSpinner from './components/common/LoadingSpinner';

const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, token, initialized } = useSelector(s => s.auth);
  if (!initialized) return <LoadingSpinner fullScreen />;
  if (!token || !user) return <Navigate to="/login" replace />;
  if (roles.length > 0 && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, token, initialized } = useSelector(s => s.auth);
  if (!initialized) return <LoadingSpinner fullScreen />;
  if (token && user) {
    return <Navigate to={user.role === 'candidate' ? '/dashboard' : '/admin'} replace />;
  }
  return children;
};

function App() {
  const dispatch = useDispatch();
  const { token, user, darkMode } = useSelector(s => ({ ...s.auth, darkMode: s.ui.darkMode }));

  useEffect(() => {
    if (token) dispatch(fetchMe());
    else dispatch({ type: 'auth/fetchMe/rejected' });
  }, [dispatch, token]);

  useEffect(() => {
    if (token && user) {
      connectSocket(token);
    }
  }, [token, user]);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 text-gray-900 dark:text-gray-100 font-body">
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          {/* Candidate */}
          <Route path="/dashboard" element={<ProtectedRoute roles={['candidate']}><CandidateDashboard /></ProtectedRoute>} />
          <Route path="/assessments" element={<ProtectedRoute roles={['candidate']}><AssessmentListPage /></ProtectedRoute>} />
          <Route path="/assessment/:id/start" element={<ProtectedRoute roles={['candidate']}><AssessmentEngine /></ProtectedRoute>} />
          <Route path="/results/:attemptId" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin', 'superadmin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/assessments" element={<ProtectedRoute roles={['admin', 'superadmin']}><AdminAssessments /></ProtectedRoute>} />
          <Route path="/admin/assessments/:id/questions" element={<ProtectedRoute roles={['admin', 'superadmin']}><AdminQuestions /></ProtectedRoute>} />
          <Route path="/admin/leaderboard/:assessmentId" element={<ProtectedRoute roles={['admin', 'superadmin']}><AdminLeaderboard /></ProtectedRoute>} />
          <Route path="/admin/analytics/:assessmentId" element={<ProtectedRoute roles={['admin', 'superadmin']}><AdminAnalytics /></ProtectedRoute>} />
          <Route path="/admin/monitor" element={<ProtectedRoute roles={['admin', 'superadmin']}><AdminMonitor /></ProtectedRoute>} />

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <ToastContainer />
    </div>
  );
}

export default App;
