const express = require('express');
const router = express.Router();
const SecurityService = require('../services/securityService');
const AchievementService = require('../services/achievementService');
const RankService = require('../services/rankService');
const LeaderboardService = require('../services/leaderboardService');
const NotificationService = require('../services/notificationService');
const { authenticate } = require('../middleware/auth');
const { requireMember } = require('../middleware/roleAuth');

// Apply authentication
router.use(authenticate);
router.use(requireMember);

/**
 * SECURITY ENDPOINTS
 */

// GET /api/v1/gamification/login-history - Get user's login history
router.get('/login-history', async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const history = await SecurityService.getLoginHistory(userId, limit, offset);

    res.json({
      success: true,
      data: { history }
    });
  } catch (error) {
    console.error('Login history error:', error);
    res.status(500).json({
      error: 'Failed to load login history',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/gamification/security-events - Get user's security events
router.get('/security-events', async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const includeResolved = req.query.includeResolved === 'true';

    const events = await SecurityService.getSecurityEvents(userId, limit, offset, includeResolved);

    res.json({
      success: true,
      data: { events }
    });
  } catch (error) {
    console.error('Security events error:', error);
    res.status(500).json({
      error: 'Failed to load security events',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/gamification/security-summary - Get security summary
router.get('/security-summary', async (req, res) => {
  try {
    const userId = req.user.id;
    const summary = await SecurityService.getSecuritySummary(userId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Security summary error:', error);
    res.status(500).json({
      error: 'Failed to load security summary',
      code: 'DATABASE_ERROR'
    });
  }
});

// PUT /api/v1/gamification/security-events/:id/resolve - Resolve security event
router.put('/security-events/:id/resolve', async (req, res) => {
  try {
    const userId = req.user.id;
    const eventId = parseInt(req.params.id);

    await SecurityService.resolveSecurityEvent(eventId, userId);

    res.json({
      success: true,
      data: { message: 'Security event resolved' }
    });
  } catch (error) {
    console.error('Resolve security event error:', error);
    res.status(500).json({
      error: 'Failed to resolve security event',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * ACHIEVEMENT ENDPOINTS
 */

// GET /api/v1/gamification/achievements - Get all achievements
router.get('/achievements', async (req, res) => {
  try {
    const achievements = await AchievementService.getAllAchievements();

    res.json({
      success: true,
      data: { achievements }
    });
  } catch (error) {
    console.error('Achievements error:', error);
    res.status(500).json({
      error: 'Failed to load achievements',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/gamification/achievements/user - Get user's unlocked achievements
router.get('/achievements/user', async (req, res) => {
  try {
    const userId = req.user.id;
    const achievements = await AchievementService.getUserAchievements(userId);

    res.json({
      success: true,
      data: { achievements }
    });
  } catch (error) {
    console.error('User achievements error:', error);
    res.status(500).json({
      error: 'Failed to load user achievements',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/gamification/achievements/progress - Get achievement progress
router.get('/achievements/progress', async (req, res) => {
  try {
    const userId = req.user.id;
    const progress = await AchievementService.getAchievementProgress(userId);

    res.json({
      success: true,
      data: { progress }
    });
  } catch (error) {
    console.error('Achievement progress error:', error);
    res.status(500).json({
      error: 'Failed to load achievement progress',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/gamification/achievements/summary - Get achievement summary
router.get('/achievements/summary', async (req, res) => {
  try {
    const userId = req.user.id;
    const summary = await AchievementService.getAchievementSummary(userId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Achievement summary error:', error);
    res.status(500).json({
      error: 'Failed to load achievement summary',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/gamification/achievements/category/:category - Get achievements by category
router.get('/achievements/category/:category', async (req, res) => {
  try {
    const category = req.params.category;
    const achievements = await AchievementService.getAchievementsByCategory(category);

    res.json({
      success: true,
      data: { achievements }
    });
  } catch (error) {
    console.error('Achievements by category error:', error);
    res.status(500).json({
      error: 'Failed to load achievements',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * RANK ENDPOINTS
 */

// GET /api/v1/gamification/rank - Get user's current rank
router.get('/rank', async (req, res) => {
  try {
    const userId = req.user.id;
    const rank = await RankService.getUserRank(userId);

    res.json({
      success: true,
      data: rank
    });
  } catch (error) {
    console.error('User rank error:', error);
    res.status(500).json({
      error: 'Failed to load user rank',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/gamification/rank/progress - Get progress to next rank
router.get('/rank/progress', async (req, res) => {
  try {
    const userId = req.user.id;
    const progress = await RankService.getRankProgress(userId);

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Rank progress error:', error);
    res.status(500).json({
      error: 'Failed to load rank progress',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/gamification/ranks - Get all available ranks
router.get('/ranks', async (req, res) => {
  try {
    const ranks = await RankService.getAllRanks();

    res.json({
      success: true,
      data: { ranks }
    });
  } catch (error) {
    console.error('All ranks error:', error);
    res.status(500).json({
      error: 'Failed to load ranks',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/gamification/ranks/:id/perks - Get rank perks
router.get('/ranks/:id/perks', async (req, res) => {
  try {
    const rankId = parseInt(req.params.id);
    const perks = await RankService.getRankPerks(rankId);

    res.json({
      success: true,
      data: perks
    });
  } catch (error) {
    console.error('Rank perks error:', error);
    res.status(500).json({
      error: 'Failed to load rank perks',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * LEADERBOARD ENDPOINTS
 */

// GET /api/v1/gamification/leaderboard/earners - Get top earners
router.get('/leaderboard/earners', async (req, res) => {
  try {
    // Increase limit to cover ghosts if requested, though frontend might handle pagination later.
    // For now we allow large limit for "all users".
    const limit = parseInt(req.query.limit) || 2000;
    const period = req.query.period || 'all_time';
    const currentUserId = req.user.id;

    const leaderboard = await LeaderboardService.getTopEarners(limit, period, currentUserId);

    res.json({
      success: true,
      data: { leaderboard }
    });
  } catch (error) {
    console.error('Top earners error:', error);
    res.status(500).json({
      error: 'Failed to load top earners',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/gamification/leaderboard/recruiters - Get top recruiters
router.get('/leaderboard/recruiters', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 2000;
    const period = req.query.period || 'all_time';
    const currentUserId = req.user.id;

    const leaderboard = await LeaderboardService.getTopRecruiters(limit, period, currentUserId);

    res.json({
      success: true,
      data: { leaderboard }
    });
  } catch (error) {
    console.error('Top recruiters error:', error);
    res.status(500).json({
      error: 'Failed to load top recruiters',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/gamification/leaderboard/fastest-growing - Get fastest growing networks
router.get('/leaderboard/fastest-growing', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const period = req.query.period || 'monthly';

    const leaderboard = await LeaderboardService.getFastestGrowing(limit, period);

    res.json({
      success: true,
      data: { leaderboard }
    });
  } catch (error) {
    console.error('Fastest growing error:', error);
    res.status(500).json({
      error: 'Failed to load fastest growing networks',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/gamification/leaderboard/combined - Get combined leaderboard data
router.get('/leaderboard/combined', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const period = req.query.period || 'all_time';

    const leaderboard = await LeaderboardService.getCombinedLeaderboard(limit, period);

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('Combined leaderboard error:', error);
    res.status(500).json({
      error: 'Failed to load leaderboard',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/gamification/leaderboard/position - Get user's position in leaderboard
router.get('/leaderboard/position', async (req, res) => {
  try {
    const userId = req.user.id;
    const type = req.query.type || 'earners';
    const period = req.query.period || 'all_time';

    const position = await LeaderboardService.getUserPosition(userId, type, period);

    res.json({
      success: true,
      data: position
    });
  } catch (error) {
    console.error('User position error:', error);
    res.status(500).json({
      error: 'Failed to load user position',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/gamification/leaderboard/stats - Get leaderboard statistics
router.get('/leaderboard/stats', async (req, res) => {
  try {
    const period = req.query.period || 'all_time';
    const stats = await LeaderboardService.getLeaderboardStats(period);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Leaderboard stats error:', error);
    res.status(500).json({
      error: 'Failed to load leaderboard statistics',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * NOTIFICATION ENDPOINTS
 */

// GET /api/v1/gamification/notifications - Get user's notifications
router.get('/notifications', async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const includeRead = req.query.includeRead === 'true';

    const notifications = await NotificationService.getUserNotifications(userId, limit, offset, includeRead);

    res.json({
      success: true,
      data: { notifications }
    });
  } catch (error) {
    console.error('Notifications error:', error);
    res.status(500).json({
      error: 'Failed to load notifications',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/gamification/notifications/unread-count - Get unread notification count
router.get('/notifications/unread-count', async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await NotificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({
      error: 'Failed to load unread count',
      code: 'DATABASE_ERROR'
    });
  }
});

// PUT /api/v1/gamification/notifications/:id/read - Mark notification as read
router.put('/notifications/:id/read', async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = parseInt(req.params.id);

    await NotificationService.markAsRead(notificationId, userId);

    res.json({
      success: true,
      data: { message: 'Notification marked as read' }
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      error: 'Failed to mark notification as read',
      code: 'DATABASE_ERROR'
    });
  }
});

// PUT /api/v1/gamification/notifications/read-all - Mark all notifications as read
router.put('/notifications/read-all', async (req, res) => {
  try {
    const userId = req.user.id;
    await NotificationService.markAllAsRead(userId);

    res.json({
      success: true,
      data: { message: 'All notifications marked as read' }
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      error: 'Failed to mark all notifications as read',
      code: 'DATABASE_ERROR'
    });
  }
});

// DELETE /api/v1/gamification/notifications/:id - Delete notification
router.delete('/notifications/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = parseInt(req.params.id);

    await NotificationService.deleteNotification(notificationId, userId);

    res.json({
      success: true,
      data: { message: 'Notification deleted' }
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      error: 'Failed to delete notification',
      code: 'DATABASE_ERROR'
    });
  }
});

// DELETE /api/v1/gamification/notifications/read - Delete all read notifications
router.delete('/notifications/read', async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await NotificationService.deleteAllRead(userId);

    res.json({
      success: true,
      data: { message: `${count} notifications deleted` }
    });
  } catch (error) {
    console.error('Delete all read error:', error);
    res.status(500).json({
      error: 'Failed to delete notifications',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/gamification/notifications/by-type/:type - Get notifications by type
router.get('/notifications/by-type/:type', async (req, res) => {
  try {
    const userId = req.user.id;
    const type = req.params.type;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const notifications = await NotificationService.getNotificationsByType(userId, type, limit, offset);

    res.json({
      success: true,
      data: { notifications }
    });
  } catch (error) {
    console.error('Notifications by type error:', error);
    res.status(500).json({
      error: 'Failed to load notifications',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/gamification/notifications/summary - Get notification summary
router.get('/notifications/summary', async (req, res) => {
  try {
    const userId = req.user.id;
    const summary = await NotificationService.getNotificationSummary(userId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Notification summary error:', error);
    res.status(500).json({
      error: 'Failed to load notification summary',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/gamification/activity-feed - Get activity feed
router.get('/activity-feed', async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    const activities = await NotificationService.getActivityFeed(userId, limit);

    res.json({
      success: true,
      data: { activities }
    });
  } catch (error) {
    console.error('Activity feed error:', error);
    res.status(500).json({
      error: 'Failed to load activity feed',
      code: 'DATABASE_ERROR'
    });
  }
});

module.exports = router;
