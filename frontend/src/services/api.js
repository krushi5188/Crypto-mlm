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
  login: (data) => api.post('/auth/login', data),
  // 2FA
  setup2FA: () => api.post('/auth/2fa/setup'),
  enable2FA: (data) => api.post('/auth/2fa/enable', data),
  disable2FA: (data) => api.post('/auth/2fa/disable', data),
  get2FAStatus: () => api.get('/auth/2fa/status')
};

// Student API
export const memberAPI = {
  // Dashboard & Profile
  getDashboard: () => api.get('/member/dashboard'),
  getNetwork: (level) => api.get('/member/network', { params: { level } }),
  getEarnings: (params) => api.get('/member/earnings', { params }),
  getProfile: () => api.get('/member/profile'),
  updateProfile: (data) => api.put('/member/profile', data),
  getDirectInvites: () => api.get('/member/direct-invites'),
  getInviteTransactions: (inviteUserId) => api.get(`/student/invite-transactions/${inviteUserId}`),
  
  // Withdrawals
  getWithdrawals: (params) => api.get('/member/withdrawals', { params }),
  createWithdrawal: (data) => api.post('/member/withdrawals', data),
  cancelWithdrawal: (id) => api.delete(`/student/withdrawals/${id}`),
  getWithdrawalStats: () => api.get('/member/withdrawal-stats'),
  
  // Goals
  getGoals: (params) => api.get('/member/goals', { params }),
  createGoal: (data) => api.post('/member/goals', data),
  updateGoal: (id, data) => api.put(`/student/goals/${id}`, data),
  deleteGoal: (id) => api.delete(`/student/goals/${id}`),
  getGoalRecommendations: () => api.get('/member/goal-recommendations'),
  
  // Wallets
  getWallets: () => api.get('/member/wallets'),
  addWallet: (data) => api.post('/member/wallets', data),
  setPrimaryWallet: (id) => api.put(`/student/wallets/${id}/primary`),
  deleteWallet: (id) => api.delete(`/student/wallets/${id}`),
  
  // Analytics
  getEarningsChart: (period) => api.get('/member/analytics/earnings-chart', { params: { period } }),
  getNetworkGrowth: (period) => api.get('/member/analytics/network-growth', { params: { period } }),
  getTopPerformers: (limit) => api.get('/member/analytics/top-performers', { params: { limit } }),
  getDashboardStats: () => api.get('/member/analytics/dashboard-stats'),
  
  // Training Resources
  getResources: (params) => api.get('/member/resources', { params }),
  getResource: (id) => api.get(`/student/resources/${id}`),
  logDownload: (id) => api.post(`/student/resources/${id}/download`),
  getResourceCategories: () => api.get('/member/resources-categories'),
  getPopularResources: (limit) => api.get('/member/resources-popular', { params: { limit } }),
  
  // Team Events
  getEvents: (params) => api.get('/member/events', { params }),
  getEvent: (id) => api.get(`/student/events/${id}`),
  rsvpEvent: (id, data) => api.post(`/student/events/${id}/rsvp`, data),
  cancelRsvp: (id) => api.delete(`/student/events/${id}/rsvp`),
  getMyEvents: (params) => api.get('/member/my-events', { params }),
  
  // Message Templates
  getTemplates: (type) => api.get('/member/templates', { params: { type } }),
  getTemplate: (id) => api.get(`/student/templates/${id}`),
  renderTemplate: (id, variables) => api.post(`/student/templates/${id}/render`, { variables }),
  logShare: (platform, templateId) => api.post('/member/templates/share', { platform, template_id: templateId }),
  getShareStats: () => api.get('/member/share-stats'),
  getTrendingTemplates: (limit) => api.get('/member/templates-trending', { params: { limit } }),
  
  // Webhooks
  getWebhooks: () => api.get('/member/webhooks'),
  createWebhook: (data) => api.post('/member/webhooks', data),
  updateWebhook: (id, data) => api.put(`/student/webhooks/${id}`, data),
  deleteWebhook: (id) => api.delete(`/student/webhooks/${id}`),
  getWebhookDeliveries: (id, limit) => api.get(`/student/webhooks/${id}/deliveries`, { params: { limit } }),
  getWebhookStats: (id) => api.get(`/student/webhooks/${id}/stats`),
  
  // API Keys
  getApiKeys: () => api.get('/member/api-keys'),
  createApiKey: (data) => api.post('/member/api-keys', data),
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
  updateConfig: (data) => api.put('/instructor/config', data),
  
  // Bulk Operations
  bulkApprove: (userIds) => api.post('/instructor/bulk-approve', { userIds }),
  bulkReject: (userIds, reason) => api.post('/instructor/bulk-reject', { userIds, reason }),
  bulkFreeze: (userIds, reason) => api.post('/instructor/bulk-freeze', { userIds, reason }),
  bulkUnfreeze: (userIds) => api.post('/instructor/bulk-unfreeze', { userIds }),
  
  // Freeze/Unfreeze Individual Accounts
  freezeAccount: (id, reason) => api.post(`/instructor/participants/${id}/freeze`, { reason }),
  unfreezeAccount: (id) => api.post(`/instructor/participants/${id}/unfreeze`),
  
  // Commission Rate Adjustments
  adjustCommissionRate: (id, commissionRate, useDefault = false) => 
    api.put(`/instructor/participants/${id}/commission-rate`, { commissionRate, useDefault }),
  
  // Manual Transactions
  createTransaction: (data) => api.post('/instructor/transactions/create', data),
  reverseTransaction: (id, reason) => api.post(`/instructor/transactions/${id}/reverse`, { reason }),
  
  // Campaigns
  getCampaigns: (params) => api.get('/instructor/campaigns', { params }),
  getCampaign: (id) => api.get(`/instructor/campaigns/${id}`),
  createCampaign: (data) => api.post('/instructor/campaigns', data),
  updateCampaign: (id, data) => api.put(`/instructor/campaigns/${id}`, data),
  deleteCampaign: (id) => api.delete(`/instructor/campaigns/${id}`),
  updateCampaignStatus: (id, status) => api.put(`/instructor/campaigns/${id}/status`, { status }),
  executeCampaign: (id) => api.post(`/instructor/campaigns/${id}/execute`),
  getCampaignStats: (id) => api.get(`/instructor/campaigns/${id}/stats`),
  addDripStep: (id, data) => api.post(`/instructor/campaigns/${id}/drip-step`, data),
  getCampaignRecipients: (id, params) => api.get(`/instructor/campaigns/${id}/recipients`, { params }),
  
  // A/B Testing
  getExperiments: (params) => api.get('/instructor/ab-experiments', { params }),
  getExperiment: (id) => api.get(`/instructor/ab-experiments/${id}`),
  getExperimentResults: (id) => api.get(`/instructor/ab-experiments/${id}/results`),
  getExperimentsSummary: () => api.get('/instructor/ab-experiments/summary'),
  createExperiment: (data) => api.post('/instructor/ab-experiments', data),
  updateExperiment: (id, data) => api.put(`/instructor/ab-experiments/${id}`, data),
  updateExperimentStatus: (id, status) => api.put(`/instructor/ab-experiments/${id}/status`, { status }),
  setExperimentWinner: (id, winnerVariant) => api.post(`/instructor/ab-experiments/${id}/winner`, { winnerVariant }),
  deleteExperiment: (id) => api.delete(`/instructor/ab-experiments/${id}`),
  trackExperimentEvent: (id, data) => api.post(`/instructor/ab-experiments/${id}/track`, data)
};

// System API
export const systemAPI = {
  getStatus: () => api.get('/system/status'),
  getConfig: () => api.get('/system/config')
};

// Gamification API
export const gamificationAPI = {
  // Security
  getLoginHistory: (params) => api.get('/gamification/login-history', { params }),
  getSecurityEvents: (params) => api.get('/gamification/security-events', { params }),
  getSecuritySummary: () => api.get('/gamification/security-summary'),
  resolveSecurityEvent: (id) => api.put(`/gamification/security-events/${id}/resolve`),
  
  // Achievements
  getAllAchievements: () => api.get('/gamification/achievements'),
  getUserAchievements: () => api.get('/gamification/achievements/user'),
  getAchievementProgress: () => api.get('/gamification/achievements/progress'),
  getAchievementSummary: () => api.get('/gamification/achievements/summary'),
  getAchievementsByCategory: (category) => api.get(`/gamification/achievements/category/${category}`),
  
  // Ranks
  getUserRank: () => api.get('/gamification/rank'),
  getRankProgress: () => api.get('/gamification/rank/progress'),
  getAllRanks: () => api.get('/gamification/ranks'),
  getRankPerks: (id) => api.get(`/gamification/ranks/${id}/perks`),
  
  // Leaderboards
  getTopEarners: (params) => api.get('/gamification/leaderboard/earners', { params }),
  getTopRecruiters: (params) => api.get('/gamification/leaderboard/recruiters', { params }),
  getFastestGrowing: (params) => api.get('/gamification/leaderboard/fastest-growing', { params }),
  getCombinedLeaderboard: (params) => api.get('/gamification/leaderboard/combined', { params }),
  getUserPosition: (params) => api.get('/gamification/leaderboard/position', { params }),
  getLeaderboardStats: (params) => api.get('/gamification/leaderboard/stats', { params }),
  
  // Notifications
  getNotifications: (params) => api.get('/gamification/notifications', { params }),
  getUnreadCount: () => api.get('/gamification/notifications/unread-count'),
  markAsRead: (id) => api.put(`/gamification/notifications/${id}/read`),
  markAllAsRead: () => api.put('/gamification/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/gamification/notifications/${id}`),
  deleteAllRead: () => api.delete('/gamification/notifications/read'),
  getNotificationsByType: (type, params) => api.get(`/gamification/notifications/by-type/${type}`, { params }),
  getNotificationSummary: () => api.get('/gamification/notifications/summary'),
  getActivityFeed: (params) => api.get('/gamification/activity-feed', { params })
};

export default api;
