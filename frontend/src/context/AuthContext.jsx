
import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI, memberAPI } from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  // Helper to fetch full user data for members from the dashboard endpoint
  const loadUser = async () => {
    try {
      const response = await memberAPI.getDashboard()
      const fullUser = response.data.data || response.data
      localStorage.setItem('user', JSON.stringify(fullUser))
      setUser(fullUser)
      return fullUser
    } catch (error) {
      console.error("Failed to load user data, logging out.", error)
      logout() // If we can't get dashboard data for a member, treat as logged out
      throw error // re-throw so the calling function knows it failed
    }
  }

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          // Immediately set user from localStorage for responsiveness
          const savedUserRaw = localStorage.getItem('user')
          if (savedUserRaw && savedUserRaw !== 'undefined' && savedUserRaw !== 'null') {
            const savedUser = JSON.parse(savedUserRaw)
            setUser(savedUser)
            // If the user is a member, refresh their data from the server
            if (savedUser.role === 'member') {
              await loadUser()
            }
          }
        } catch (error) {
          console.error('Session validation failed on mount.', error)
        }
      }
      setLoading(false)
    }
    initializeAuth()
  }, [])

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials)
      const { token, user: initialUser, require2FA } = response.data.data || response.data

      if (require2FA) {
        return { success: true, require2FA: true }
      }

      localStorage.setItem('token', token)

      let finalUser = initialUser
      if (initialUser.role === 'member') {
        finalUser = await loadUser()
      } else {
        localStorage.setItem('user', JSON.stringify(initialUser))
        setUser(initialUser)
      }

      return { success: true, user: finalUser }
    } catch (error) {
      logout()
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      }
    }
  }

  const register = async (data) => {
    try {
      const response = await authAPI.register(data)
      const { token } = response.data.data || response.data

      localStorage.setItem('token', token)
      const finalUser = await loadUser()

      return { success: true, user: finalUser }
    } catch (error) {
      logout()
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed'
      }
    }
  }

  const web3Login = async (data) => {
    try {
      const response = await authAPI.web3Login(data)
      const { token } = response.data.data || response.data;

      localStorage.setItem('token', token)
      const finalUser = await loadUser()

      return { success: true, user: finalUser }
    } catch (error) {
      logout()
      return {
        success: false,
        error: error.response?.data?.error || 'Web3 login failed',
      }
    }
  }

  const web3Register = async (data) => {
    try {
      const response = await authAPI.web3Register(data)
      const { token } = response.data.data || response.data;

      localStorage.setItem('token', token)
      const finalUser = await loadUser()

      return { success: true, user: finalUser }
    } catch (error) {
      logout()
      return {
        success: false,
        error: error.response?.data?.error || 'Web3 registration failed',
      }
    }
  }

  const value = {
    user,
    loading,
    login,
    web3Login,
    web3Register,
    register,
    logout,
    isAuthenticated: !!user,
    isMember: user?.role === 'member',
    isAdmin: user?.role === 'instructor',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
