import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Public Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

// Member Pages
import MemberDashboard from './pages/MemberDashboard'
import NetworkPage from './pages/NetworkPage'
import EarningsPage from './pages/EarningsPage'
import WithdrawalsPage from './pages/WithdrawalsPage'
import WalletsPage from './pages/WalletsPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'

// Admin Pages
import AdminAnalytics from './pages/admin/AdminAnalytics'
import AdminMembers from './pages/admin/AdminMembers'
import AdminDeposits from './pages/admin/AdminDeposits'
import AdminFraud from './pages/admin/AdminFraud'

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && user.role !== 'instructor') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Member Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MemberDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/network"
        element={
          <ProtectedRoute>
            <NetworkPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/earnings"
        element={
          <ProtectedRoute>
            <EarningsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/withdrawals"
        element={
          <ProtectedRoute>
            <WithdrawalsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/wallets"
        element={
          <ProtectedRoute>
            <WalletsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute requireAdmin={true}>
            <AdminAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/members"
        element={
          <ProtectedRoute requireAdmin={true}>
            <AdminMembers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/deposits"
        element={
          <ProtectedRoute requireAdmin={true}>
            <AdminDeposits />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/fraud"
        element={
          <ProtectedRoute requireAdmin={true}>
            <AdminFraud />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

import { Web3ModalProvider } from './config/web3modal'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Web3ModalProvider>
          <AppRoutes />
        </Web3ModalProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
