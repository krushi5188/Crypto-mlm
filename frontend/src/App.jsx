import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/common/Navbar';
import Watermark from './components/common/Watermark';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ErrorPage from './pages/ErrorPage';
import StudentDashboard from './pages/StudentDashboard';
import StudentNetwork from './pages/StudentNetwork';
import StudentEarnings from './pages/StudentEarnings';
import StudentProfile from './pages/StudentProfile';
import InstructorAnalytics from './pages/InstructorAnalytics';
import InstructorParticipants from './pages/InstructorParticipants';
import InstructorReferrals from './pages/InstructorReferrals';
import InstructorNetwork from './pages/InstructorNetwork';
import InstructorControls from './pages/InstructorControls';
import InstructorFraudDetection from './pages/InstructorFraudDetection';
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
  return (
    <div style={{ minHeight: '100vh', paddingBottom: '3rem' }}>
      <Navbar />
      <main>{children}</main>
      <Watermark />
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

            {/* Error Route - Public, no auth required */}
            <Route path="/error" element={<ErrorPage />} />

            {/* Student Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRole="student">
                <AppLayout>
                  <StudentDashboard />
                </AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/network" element={
              <ProtectedRoute allowedRole="student">
                <AppLayout>
                  <StudentNetwork />
                </AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/earnings" element={
              <ProtectedRoute allowedRole="student">
                <AppLayout>
                  <StudentEarnings />
                </AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute allowedRole="student">
                <AppLayout>
                  <StudentProfile />
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
