import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import ToastContainer from './components/common/ToastContainer';
import './i18n/config'; // Initialize i18n
import { checkVersion } from './utils/versionCheck';
import Navbar from './components/common/Navbar';
import Watermark from './components/common/Watermark';
import GlobalSearch, { useGlobalSearch } from './components/GlobalSearch';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ErrorPage from './pages/ErrorPage';
import MemberDashboard from './pages/MemberDashboard';
import MemberNetwork from './pages/MemberNetwork';
import MemberEarnings from './pages/MemberEarnings';
import MemberProfile from './pages/MemberProfile';
import MemberAchievements from './pages/MemberAchievements';
import MemberLeaderboard from './pages/MemberLeaderboard';
import MemberNotifications from './pages/MemberNotifications';
import MemberSecurity from './pages/MemberSecurity';
import MemberWithdrawals from './pages/MemberWithdrawals';
import MemberAnalytics from './pages/MemberAnalytics';
import MemberWallets from './pages/MemberWallets';
import MemberShare from './pages/MemberShare';
import MemberEvents from './pages/MemberEvents';
import MemberGoals from './pages/MemberGoals';
import MemberResources from './pages/MemberResources';
import MemberApiKeys from './pages/MemberApiKeys';
import InstructorAnalytics from './pages/InstructorAnalytics';
import InstructorParticipants from './pages/InstructorParticipants';
import InstructorReferrals from './pages/InstructorReferrals';
import InstructorNetwork from './pages/InstructorNetwork';
import InstructorControls from './pages/InstructorControls';
import InstructorFraudDetection from './pages/InstructorFraudDetection';
import InstructorBI from './pages/InstructorBI';
import InstructorDeposits from './pages/InstructorDeposits';
import InstructorConfiguration from './pages/InstructorConfiguration';
import InstructorABTesting from './pages/InstructorABTesting';
import InstructorCampaigns from './pages/InstructorCampaigns';
import './styles/global.css';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRole }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="spin" style={{ fontSize: '3rem' }}>⏳</div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user?.role !== allowedRole) {
    // Redirect to appropriate dashboard based on role
    return <Navigate to={user?.role === 'instructor' ? '/instructor/analytics' : '/dashboard'} replace />;
  }

  return children;
};

// Public Route (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="spin" style={{ fontSize: '3rem' }}>⏳</div>
      </div>
    );
  }

  if (isAuthenticated()) {
    return <Navigate to={user?.role === 'instructor' ? '/instructor/analytics' : '/dashboard'} replace />;
  }

  return children;
};

// Main App Layout
const AppLayout = ({ children }) => {
  const { isOpen, close } = useGlobalSearch();

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '3rem' }}>
      <Navbar />
      <main style={{ paddingTop: '5rem' }}>{children}</main>
      <Watermark />
      <GlobalSearch isOpen={isOpen} onClose={close} />
      <ToastContainer />
    </div>
  );
};

// Home Page
const HomePage = () => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated()) {
    return <Navigate to={user?.role === 'instructor' ? '/instructor/analytics' : '/dashboard'} replace />;
  }

  return (
    <AppLayout>
      <LandingPage />
    </AppLayout>
  );
};

// Animated Routes Component
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/login" element={
          <PublicRoute>
            <AppLayout>
              <LoginPage />
            </AppLayout>
          </PublicRoute>
        } />

        {/* Error Page Route */}
        <Route path="/error" element={
          <AppLayout>
            <ErrorPage />
          </AppLayout>
        } />

        {/* Member Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRole="member">
            <AppLayout>
              <MemberDashboard />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/network" element={
          <ProtectedRoute allowedRole="member">
            <AppLayout>
              <MemberNetwork />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/earnings" element={
          <ProtectedRoute allowedRole="member">
            <AppLayout>
              <MemberEarnings />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute allowedRole="member">
            <AppLayout>
              <MemberProfile />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/achievements" element={
          <ProtectedRoute allowedRole="member">
            <AppLayout>
              <MemberAchievements />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/leaderboard" element={
          <ProtectedRoute allowedRole="member">
            <AppLayout>
              <MemberLeaderboard />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/notifications" element={
          <ProtectedRoute allowedRole="member">
            <AppLayout>
              <MemberNotifications />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/security" element={
          <ProtectedRoute allowedRole="member">
            <AppLayout>
              <MemberSecurity />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/withdrawals" element={
          <ProtectedRoute allowedRole="member">
            <AppLayout>
              <MemberWithdrawals />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/analytics" element={
          <ProtectedRoute allowedRole="member">
            <AppLayout>
              <MemberAnalytics />
            </AppLayout>
          </ProtectedRoute>
        } />

        {/* Instructor Routes */}
        <Route path="/instructor/analytics" element={
          <ProtectedRoute allowedRole="instructor">
            <AppLayout>
              <InstructorAnalytics />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/instructor/participants" element={
          <ProtectedRoute allowedRole="instructor">
            <AppLayout>
              <InstructorParticipants />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/instructor/referrals" element={
          <ProtectedRoute allowedRole="instructor">
            <AppLayout>
              <InstructorReferrals />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/instructor/network" element={
          <ProtectedRoute allowedRole="instructor">
            <AppLayout>
              <InstructorNetwork />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/instructor/controls" element={
          <ProtectedRoute allowedRole="instructor">
            <AppLayout>
              <InstructorControls />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/instructor/fraud-detection" element={
          <ProtectedRoute allowedRole="instructor">
            <AppLayout>
              <InstructorFraudDetection />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/instructor/bi" element={
          <ProtectedRoute allowedRole="instructor">
            <AppLayout>
              <InstructorBI />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/instructor/deposits" element={
          <ProtectedRoute allowedRole="instructor">
            <AppLayout>
              <InstructorDeposits />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/instructor/configuration" element={
          <ProtectedRoute allowedRole="instructor">
            <AppLayout>
              <InstructorConfiguration />
            </AppLayout>
          </ProtectedRoute>
        } />

        {/* Home Route */}
        <Route path="/" element={<HomePage />} />

        {/* 404 Route */}
        <Route path="*" element={
          <AppLayout>
            <div style={{ padding: '4rem', textAlign: 'center' }}>
              <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>404</h1>
              <p style={{ color: '#a0aec0', fontSize: '1.25rem' }}>Page not found</p>
            </div>
          </AppLayout>
        } />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  // Check version on app mount - force logout if version changed
  React.useEffect(() => {
    checkVersion();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
