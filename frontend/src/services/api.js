import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data)
};

// Student API
export const studentAPI = {
  getDashboard: () => api.get('/student/dashboard'),
  getNetwork: (level) => api.get('/student/network', { params: { level } }),
  getEarnings: (params) => api.get('/student/earnings', { params }),
  getProfile: () => api.get('/student/profile'),
  updateProfile: (data) => api.put('/student/profile', data)
};

// Instructor API
export const instructorAPI = {
  getAnalytics: () => api.get('/instructor/analytics'),
  getParticipants: (params) => api.get('/instructor/participants', { params }),
  getParticipant: (id) => api.get(`/instructor/participants/${id}`),
  getNetworkGraph: () => api.get('/instructor/network-graph'),
  injectCoins: (data) => api.post('/instructor/inject-coins', data),
  pause: () => api.post('/instructor/pause'),
  resume: () => api.post('/instructor/resume'),
  reset: (data) => api.post('/instructor/reset', data),
  export: (data) => api.post('/instructor/export', data, { responseType: 'blob' }),
  updateConfig: (data) => api.put('/instructor/config', data)
};

// System API
export const systemAPI = {
  getStatus: () => api.get('/system/status')
};

export default api;
