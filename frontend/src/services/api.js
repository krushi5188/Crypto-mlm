import axios from 'axios';

// Use relative path in production, localhost in development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.MODE === 'production' ? '/api/v1' : 'http://localhost:3001/api/v1');

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
  // Dashboard & Profile
  getDashboard: () => api.get('/student/dashboard'),
  getNetwork: (level) => api.get('/student/network', { params: { level } }),
  getEarnings: (params) => api.get('/student/earnings', { params }),
  getProfile: () => api.get('/student/profile'),
  updateProfile: (data) => api.put('/student/profile', data),
  getDirectInvites: () => api.get('/student/direct-invites'),
  getInviteTransactions: (inviteUserId) => api.get(`/student/invite-transactions/${inviteUserId}`),
  
  // Withdrawals
  getWithdrawals: (params) => api.get('/student/withdrawals', { params }),
  createWithdrawal: (data) => api.post('/student/withdrawals', data),
  cancelWithdrawal: (id) => api.delete(`/student/withdrawals/${id}`),
  getWithdrawalStats: () => api.get('/student/withdrawal-stats'),
  
  // Goals
  getGoals: (params) => api.get('/student/goals', { params }),
  createGoal: (data) => api.post('/student/goals', data),
  updateGoal: (id, data) => api.put(`/student/goals/${id}`, data),
  deleteGoal: (id) => api.delete(`/student/goals/${id}`),
  getGoalRecommendations: () => api.get('/student/goal-recommendations'),
  
  // Wallets
  getWallets: () => api.get('/student/wallets'),
  addWallet: (data) => api.post('/student/wallets', data),
  setPrimaryWallet: (id) => api.put(`/student/wallets/${id}/primary`),
  deleteWallet: (id) => api.delete(`/student/wallets/${id}`),
  
  // Analytics
  getEarningsChart: (period) => api.get('/student/analytics/earnings-chart', { params: { period } }),
  getNetworkGrowth: (period) => api.get('/student/analytics/network-growth', { params: { period } }),
  getTopPerformers: (limit) => api.get('/student/analytics/top-performers', { params: { limit } }),
  getDashboardStats: () => api.get('/student/analytics/dashboard-stats'),
  
  // Training Resources
  getResources: (params) => api.get('/student/resources', { params }),
  getResource: (id) => api.get(`/student/resources/${id}`),
  logDownload: (id) => api.post(`/student/resources/${id}/download`),
  getResourceCategories: () => api.get('/student/resources-categories'),
  getPopularResources: (limit) => api.get('/student/resources-popular', { params: { limit } }),
  
  // Team Events
  getEvents: (params) => api.get('/student/events', { params }),
  getEvent: (id) => api.get(`/student/events/${id}`),
  rsvpEvent: (id, data) => api.post(`/student/events/${id}/rsvp`, data),
  cancelRsvp: (id) => api.delete(`/student/events/${id}/rsvp`),
  getMyEvents: (params) => api.get('/student/my-events', { params }),
  
  // Message Templates
  getTemplates: (type) => api.get('/student/templates', { params: { type } }),
  getTemplate: (id) => api.get(`/student/templates/${id}`),
  renderTemplate: (id, variables) => api.post(`/student/templates/${id}/render`, { variables }),
  logShare: (platform, templateId) => api.post('/student/templates/share', { platform, template_id: templateId }),
  getShareStats: () => api.get('/student/share-stats'),
  getTrendingTemplates: (limit) => api.get('/student/templates-trending', { params: { limit } }),
  
  // Webhooks
  getWebhooks: () => api.get('/student/webhooks'),
  createWebhook: (data) => api.post('/student/webhooks', data),
  updateWebhook: (id, data) => api.put(`/student/webhooks/${id}`, data),
  deleteWebhook: (id) => api.delete(`/student/webhooks/${id}`),
  getWebhookDeliveries: (id, limit) => api.get(`/student/webhooks/${id}/deliveries`, { params: { limit } }),
  getWebhookStats: (id) => api.get(`/student/webhooks/${id}/stats`),
  
  // API Keys
  getApiKeys: () => api.get('/student/api-keys'),
  createApiKey: (data) => api.post('/student/api-keys', data),
  deleteApiKey: (id) => api.delete(`/student/api-keys/${id}`),
  getApiKeyStats: (id) => api.get(`/student/api-keys/${id}/stats`),
  getApiKeyHistory: (id, limit) => api.get(`/student/api-keys/${id}/history`, { params: { limit } })
};

// Instructor API
export const instructorAPI = {
  getAnalytics: () => api.get('/instructor/analytics'),
  getParticipants: (params) => api.get('/instructor/participants', { params }),
  getParticipant: (id) => api.get(`/instructor/participants/${id}`),
  approveParticipant: (id) => api.post(`/instructor/participants/${id}/approve`),
  rejectParticipant: (id, data) => api.post(`/instructor/participants/${id}/reject`, data),
  addStudent: (data) => api.post('/instructor/add-student', data),
  addMember: (data) => api.post('/instructor/add-student', data), // Alias for addStudent
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
