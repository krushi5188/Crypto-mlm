import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  verify2FA: (data) => api.post('/auth/2fa/verify', data),
}

// Member API
export const memberAPI = {
  // Dashboard
  getDashboard: () => api.get('/member/dashboard'),
  
  // Network
  getNetwork: () => api.get('/member/network'),
  
  // Earnings
  getEarnings: (params) => api.get('/member/earnings', { params }),
  
  // Profile
  getProfile: () => api.get('/member/profile'),
  updateProfile: (data) => api.put('/member/profile', data),
  
  // Password
  updatePassword: (data) => api.put('/member/profile/password', data),
  
  // Withdrawals
  getWithdrawals: () => api.get('/member/withdrawals'),
  createWithdrawal: (data) => api.post('/member/withdrawals', data),
  
  // Wallets
  getWallets: () => api.get('/member/wallets'),
  addWallet: (data) => api.post('/member/wallets', data),
  deleteWallet: (id) => api.delete(`/member/wallets/${id}`),
  
  // Settings
  getSettings: () => api.get('/member/settings'),
  updateSettings: (data) => api.put('/member/settings', data),
  
  // Admin Methods (for accessing as memberAPI in pages)
  getAdminAnalytics: (params) => api.get('/instructor/analytics', { params }),
  getAdminMembers: (params) => api.get('/instructor/participants', { params }),
  updateMemberStatus: (id, data) => api.post(`/instructor/participants/${id}/status`, data),
  getAdminDeposits: (params) => api.get('/instructor/deposits', { params }),
  updateDepositStatus: (id, data) => api.post(`/instructor/deposits/${id}/confirm`, data),
  getFraudAlerts: (params) => api.get('/instructor/fraud-detection/alerts', { params }),
  resolveFraudAlert: (id, data) => api.post(`/instructor/fraud-detection/flag/${id}`, data),
}

// Admin API
export const adminAPI = {
  // Analytics
  getAnalytics: (params) => api.get('/instructor/analytics', { params }),
  
  // Members
  getMembers: (params) => api.get('/instructor/participants', { params }),
  getMember: (id) => api.get(`/instructor/participants/${id}`),
  updateMemberStatus: (id, data) => api.post(`/instructor/participants/${id}/${data.status === 'active' ? 'unfreeze' : 'freeze'}`),
  addMember: (data) => api.post('/instructor/add-member', data),
  
  // Deposits
  getDeposits: (params) => api.get('/instructor/deposits', { params }),
  confirmDeposit: (id) => api.post(`/instructor/deposits/${id}/confirm`),
  rejectDeposit: (id) => api.post(`/instructor/deposits/${id}/reject`),
  
  // Fraud Detection
  getFraudDashboard: () => api.get('/instructor/fraud-detection/dashboard'),
  getFraudAlerts: (params) => api.get('/instructor/fraud-detection/alerts', { params }),
  flagUser: (id, data) => api.post(`/instructor/fraud-detection/flag/${id}`, data),
  unflagUser: (id) => api.post(`/instructor/fraud-detection/unflag/${id}`),
  
  // Other
  injectCoins: (data) => api.post('/instructor/inject-coins', data),
}

export default api
