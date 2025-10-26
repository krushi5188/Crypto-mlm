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
  getDashboard: () => api.get('/member/dashboard'),
  getNetwork: () => api.get('/member/network'),
  getEarnings: (params) => api.get('/member/earnings', { params }),
  getProfile: () => api.get('/member/profile'),
  updateProfile: (data) => api.put('/member/profile', data),
  getWithdrawals: () => api.get('/member/withdrawals'),
  createWithdrawal: (data) => api.post('/member/withdrawals', data),
  getWallets: () => api.get('/member/wallets'),
}

// Admin API
export const adminAPI = {
  getAnalytics: () => api.get('/instructor/analytics'),
  getMembers: (params) => api.get('/instructor/participants', { params }),
  getMember: (id) => api.get(`/instructor/participants/${id}`),
  addMember: (data) => api.post('/instructor/add-member', data),
  injectCoins: (data) => api.post('/instructor/inject-coins', data),
}

export default api
