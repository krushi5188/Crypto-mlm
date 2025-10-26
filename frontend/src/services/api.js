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
    // 1. Check for network errors (backend not responding)
    if (!error.response && error.request) {
      console.error('Network error:', error.message);
      // Don't redirect for network errors in dev
      return Promise.reject(error);
    }

    // 2. Check for 503 Service Unavailable (database/initialization issues)
    if (error.response?.status === 503) {
      console.error('Service unavailable:', error.response?.data);
      return Promise.reject(error);
    }

    // 3. Check for 401 Unauthorized (auth errors)
    if (error.response?.status === 401) {
      const token = localStorage.getItem('token');

      if (token) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.setItem('authMessage', 'Your session expired. Please log in again.');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      return Promise.reject(error);
    }

    // 4. Check for other 5xx errors (500, 502, 504)
    if (error.response?.status >= 500 && error.response?.status < 600) {
      console.error('Server error:', error.response?.data);
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  setup2FA: () => api.post('/auth/2fa/setup'),
  enable2FA: (data) => api.post('/auth/2fa/enable', data),
  disable2FA: (data) => api.post('/auth/2fa/disable', data),
  get2FAStatus: () => api.get('/auth/2fa/status')
};

// Member API (formerly Student API)
export const memberAPI = {
  // Dashboard & Profile
  getDashboard: () => api.get('/member/dashboard'),
  getNetwork: (level) => api.get('/member/network', { params: { level } }),
  getEarnings: (params) => api.get('/member/earnings', { params }),
  getProfile: () => api.get('/member/profile'),
  updateProfile: (data) => api.put('/member/profile', data),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/member/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  getDirectInvites: () => api.get('/member/direct-invites'),
  getInviteTransactions: (inviteUserId) => api.get(`/member/invite-transactions/${inviteUserId}`),

  // Withdrawals
  getWithdrawals: (params) => api.get('/member/withdrawals', { params }),
  createWithdrawal: (data) => api.post('/member/withdrawals', data),
  cancelWithdrawal: (id) => api.delete(`/member/withdrawals/${id}`),
  getWithdrawalStats: () => api.get('/member/withdrawal-stats'),

  // Goals
  getGoals: (params) => api.get('/member/goals', { params }),
  createGoal: (data) => api.post('/member/goals', data),
  updateGoal: (id, data) => api.put(`/member/goals/${id}`, data),
  deleteGoal: (id) => api.delete(`/member/goals/${id}`),
  getGoalRecommendations: () => api.get('/member/goal-recommendations'),

  // Wallets
  getWallets: () => api.get('/member/wallets'),
  addWallet: (data) => api.post('/member/wallets', data),
  setPrimaryWallet: (id) => api.put(`/member/wallets/${id}/primary`),
  deleteWallet: (id) => api.delete(`/member/wallets/${id}`),

  // Analytics
  getEarningsChart: (period) => api.get('/member/analytics/earnings-chart', { params: { period } }),
  getNetworkGrowth: (period) => api.get('/member/analytics/network-growth', { params: { period } }),
  getTopPerformers: (limit) => api.get('/member/analytics/top-performers', { params: { limit } }),
  getDashboardStats: () => api.get('/member/analytics/dashboard-stats'),

  // Training Resources
  getResources: (params) => api.get('/member/resources', { params }),
  getResource: (id) => api.get(`/member/resources/${id}`),
  logDownload: (id) => api.post(`/member/resources/${id}/download`),
  getResourceCategories: () => api.get('/member/resources-categories'),
  getPopularResources: (limit) => api.get('/member/resources-popular', { params: { limit } }),

  // Team Events
  getEvents: (params) => api.get('/member/events', { params }),
  getEvent: (id) => api.get(`/member/events/${id}`),
  rsvpEvent: (id, data) => api.post(`/member/events/${id}/rsvp`, data),
  cancelRsvp: (id) => api.delete(`/member/events/${id}/rsvp`),
  getMyEvents: (params) => api.get('/member/my-events', { params }),

  // Message Templates
  getTemplates: (type) => api.get('/member/templates', { params: { type } }),
  getTemplate: (id) => api.get(`/member/templates/${id}`),
  renderTemplate: (id, variables) => api.post(`/member/templates/${id}/render`, { variables }),
  logShare: (platform, templateId) => api.post('/member/templates/share', { platform, template_id: templateId }),
  getShareStats: () => api.get('/member/share-stats'),
  getTrendingTemplates: (limit) => api.get('/member/templates-trending', { params: { limit } }),

  // Webhooks
  getWebhooks: () => api.get('/member/webhooks'),
  createWebhook: (data) => api.post('/member/webhooks', data),
  updateWebhook: (id, data) => api.put(`/member/webhooks/${id}`, data),
  deleteWebhook: (id) => api.delete(`/member/webhooks/${id}`),
  getWebhookDeliveries: (id, limit) => api.get(`/member/webhooks/${id}/deliveries`, { params: { limit } }),
  getWebhookStats: (id) => api.get(`/member/webhooks/${id}/stats`),

  // API Keys
  getApiKeys: () => api.get('/member/api-keys'),
  createApiKey: (data) => api.post('/member/api-keys', data),
  deleteApiKey: (id) => api.delete(`/member/api-keys/${id}`),
  getApiKeyStats: (id) => api.get(`/member/api-keys/${id}/stats`),
  getApiKeyHistory: (id, limit) => api.get(`/member/api-keys/${id}/history`, { params: { limit } }),

  // User Preferences
  getPreferences: () => api.get('/member/preferences'),
  createPreferences: () => api.post('/member/preferences'),
  updatePreferences: (data) => api.put('/member/preferences', data),
  completeOnboarding: () => api.post('/member/preferences/complete-onboarding'),

  // Global Search
  search: (query, limit) => api.get('/member/search', { params: { q: query, limit } }),

  // Settings (for SettingsPage)
  getSettings: () => api.get('/member/preferences'),
  updateSettings: (data) => api.put('/member/preferences', data),
  updatePassword: (data) => api.put('/member/profile', data)
};

// Instructor API (renamed to adminAPI for frontend consistency)
export const adminAPI = {
  getAnalytics: () => api.get('/instructor/analytics'),
  getParticipants: (params) => api.get('/instructor/participants', { params }),
  getParticipant: (id) => api.get(`/instructor/participants/${id}`),
  approveParticipant: (id) => api.post(`/instructor/participants/${id}/approve`),
  rejectParticipant: (id, data) => api.post(`/instructor/participants/${id}/reject`, data),
  addMember: (data) => api.post('/instructor/add-member', data),
  getNetworkGraph: () => api.get('/instructor/network-graph'),
  injectCoins: (data) => api.post('/instructor/inject-coins', data),
  pause: () => api.post('/instructor/pause'),
  resume: () => api.post('/instructor/resume'),
  reset: (data) => api.post('/instructor/reset', data),
  export: (data) => api.post('/instructor/export', data, { responseType: 'blob' }),
  updateConfig: (data) => api.put('/instructor/config', data),

  // Fraud Detection
  getFraudDashboard: () => api.get('/instructor/fraud-detection/dashboard'),
  getFlaggedUsers: () => api.get('/instructor/fraud-detection/flagged-users'),
  getUserFraudDetails: (id) => api.get(`/instructor/fraud-detection/user/${id}`),
  flagUser: (id, reason) => api.post(`/instructor/fraud-detection/flag/${id}`, { reason }),
  unflagUser: (id, notes) => api.post(`/instructor/fraud-detection/unflag/${id}`, { notes }),
  getMultiAccounts: () => api.get('/instructor/fraud-detection/multi-accounts'),
  getFraudAlerts: (params) => api.get('/instructor/fraud-detection/alerts', { params }),

  // Business Intelligence
  getBIRetention: () => api.get('/instructor/bi/retention'),
  getBIConversion: () => api.get('/instructor/bi/conversion'),
  getBINetworkDepth: () => api.get('/instructor/bi/network-depth'),
  getBIEarningsDistribution: () => api.get('/instructor/bi/earnings-distribution'),
  getBIGrowthPredictions: () => api.get('/instructor/bi/growth-predictions'),

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

  // Deposits
  getDeposits: (params) => api.get('/instructor/deposits', { params }),
  getDepositStats: () => api.get('/instructor/deposits/stats'),
  confirmDeposit: (id) => api.post(`/instructor/deposits/${id}/confirm`),
  rejectDeposit: (id, reason) => api.post(`/instructor/deposits/${id}/reject`, { reason }),

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

// Keep instructorAPI as alias for backwards compatibility
export const instructorAPI = adminAPI;

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
