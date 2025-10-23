import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Watermark from './components/common/Watermark';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import InstructorAnalytics from './pages/InstructorAnalytics';
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

  return <Navigate to="/login" replace />;
};

function App() {
  return (
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
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <h2>Network Page</h2>
                  <p style={{ color: '#a0aec0' }}>Feature coming soon - visualize your downline network</p>
                </div>
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/earnings" element={
            <ProtectedRoute allowedRole="student">
              <AppLayout>
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <h2>Earnings Page</h2>
                  <p style={{ color: '#a0aec0' }}>Feature coming soon - detailed earnings history</p>
                </div>
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute allowedRole="student">
              <AppLayout>
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <h2>Profile Page</h2>
                  <p style={{ color: '#a0aec0' }}>Feature coming soon - manage your profile</p>
                </div>
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
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <h2>Participants Management</h2>
                  <p style={{ color: '#a0aec0' }}>Feature coming soon - manage all participants</p>
                </div>
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/instructor/network" element={
            <ProtectedRoute allowedRole="instructor">
              <AppLayout>
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <h2>Network Visualization</h2>
                  <p style={{ color: '#a0aec0' }}>Feature coming soon - complete network graph</p>
                </div>
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/instructor/controls" element={
            <ProtectedRoute allowedRole="instructor">
              <AppLayout>
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <h2>Simulation Controls</h2>
                  <p style={{ color: '#a0aec0' }}>Feature coming soon - pause, resume, reset simulation</p>
                </div>
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
  );
}

export default App;
