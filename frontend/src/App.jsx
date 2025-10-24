import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
<<<<<<< HEAD
=======
import './i18n/config'; // Initialize i18n
>>>>>>> cff4413b1c03039cbf120a9440b4da1d73a81893
import Navbar from './components/common/Navbar';
import Watermark from './components/common/Watermark';
import GlobalSearch, { useGlobalSearch } from './components/GlobalSearch';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
<<<<<<< HEAD
import ErrorPage from './pages/ErrorPage';
import StudentDashboard from './pages/StudentDashboard';
import StudentNetwork from './pages/StudentNetwork';
import StudentEarnings from './pages/StudentEarnings';
import StudentProfile from './pages/StudentProfile';
import StudentSecurity from './pages/StudentSecurity';
import StudentAchievements from './pages/StudentAchievements';
import StudentRank from './pages/StudentRank';
import StudentDeposits from './pages/StudentDeposits';
=======
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
>>>>>>> cff4413b1c03039cbf120a9440b4da1d73a81893
import InstructorAnalytics from './pages/InstructorAnalytics';
import InstructorParticipants from './pages/InstructorParticipants';
import InstructorReferrals from './pages/InstructorReferrals';
import InstructorNetwork from './pages/InstructorNetwork';
import InstructorControls from './pages/InstructorControls';
<<<<<<< HEAD
import InstructorFraudDetection from './pages/InstructorFraudDetection';
import InstructorBI from './pages/InstructorBI';
import InstructorDeposits from './pages/InstructorDeposits';
=======
import InstructorConfiguration from './pages/InstructorConfiguration';
>>>>>>> cff4413b1c03039cbf120a9440b4da1d73a81893
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
      <main>{children}</main>
      <Watermark />
      <GlobalSearch isOpen={isOpen} onClose={close} />
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

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={
              <PublicRoute>
                <AppLayout>
                  <LoginPage />
                </AppLayout>
              </PublicRoute>
            } />

<<<<<<< HEAD
            {/* Error Route - Public, no auth required */}
            <Route path="/error" element={<ErrorPage />} />

            {/* Student Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRole="student">
                <AppLayout>
                  <StudentDashboard />
=======
            {/* Member Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRole="member">
                <AppLayout>
                  <MemberDashboard />
>>>>>>> cff4413b1c03039cbf120a9440b4da1d73a81893
                </AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/network" element={
<<<<<<< HEAD
              <ProtectedRoute allowedRole="student">
                <AppLayout>
                  <StudentNetwork />
=======
              <ProtectedRoute allowedRole="member">
                <AppLayout>
                  <MemberNetwork />
>>>>>>> cff4413b1c03039cbf120a9440b4da1d73a81893
                </AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/earnings" element={
<<<<<<< HEAD
              <ProtectedRoute allowedRole="student">
                <AppLayout>
                  <StudentEarnings />
=======
              <ProtectedRoute allowedRole="member">
                <AppLayout>
                  <MemberEarnings />
>>>>>>> cff4413b1c03039cbf120a9440b4da1d73a81893
                </AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
<<<<<<< HEAD
              <ProtectedRoute allowedRole="student">
                <AppLayout>
                  <StudentProfile />
=======
              <ProtectedRoute allowedRole="member">
                <AppLayout>
                  <MemberProfile />
>>>>>>> cff4413b1c03039cbf120a9440b4da1d73a81893
                </AppLayout>
              </ProtectedRoute>
            } />

<<<<<<< HEAD
            <Route path="/security" element={
              <ProtectedRoute allowedRole="student">
                <AppLayout>
                  <StudentSecurity />
=======
            <Route path="/member/achievements" element={
              <ProtectedRoute allowedRole="member">
                <AppLayout>
                  <MemberAchievements />
>>>>>>> cff4413b1c03039cbf120a9440b4da1d73a81893
                </AppLayout>
              </ProtectedRoute>
            } />

<<<<<<< HEAD
            <Route path="/achievements" element={
              <ProtectedRoute allowedRole="student">
                <AppLayout>
                  <StudentAchievements />
=======
            <Route path="/member/leaderboard" element={
              <ProtectedRoute allowedRole="member">
                <AppLayout>
                  <MemberLeaderboard />
>>>>>>> cff4413b1c03039cbf120a9440b4da1d73a81893
                </AppLayout>
              </ProtectedRoute>
            } />

<<<<<<< HEAD
            <Route path="/rank" element={
              <ProtectedRoute allowedRole="student">
                <AppLayout>
                  <StudentRank />
=======
            <Route path="/member/notifications" element={
              <ProtectedRoute allowedRole="member">
                <AppLayout>
                  <MemberNotifications />
>>>>>>> cff4413b1c03039cbf120a9440b4da1d73a81893
                </AppLayout>
              </ProtectedRoute>
            } />

<<<<<<< HEAD
            <Route path="/deposits" element={
              <ProtectedRoute allowedRole="student">
                <AppLayout>
                  <StudentDeposits />
=======
            <Route path="/member/security" element={
              <ProtectedRoute allowedRole="member">
                <AppLayout>
                  <MemberSecurity />
                </AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/member/withdrawals" element={
              <ProtectedRoute allowedRole="member">
                <AppLayout>
                  <MemberWithdrawals />
                </AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/member/analytics" element={
              <ProtectedRoute allowedRole="member">
                <AppLayout>
                  <MemberAnalytics />
>>>>>>> cff4413b1c03039cbf120a9440b4da1d73a81893
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

<<<<<<< HEAD
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
=======
            <Route path="/instructor/configuration" element={
              <ProtectedRoute allowedRole="instructor">
                <AppLayout>
                  <InstructorConfiguration />
>>>>>>> cff4413b1c03039cbf120a9440b4da1d73a81893
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
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
