const { db } = require('../config/database');

class Notification {
  // Create notification
  static async create(notificationData) {
    const [result] = await db('notifications').insert(notificationData).returning('*');
    return result;
  }

  // Get user's notifications
  static async getUserNotifications(userId, filters = {}) {
    const { unreadOnly = false, limit = 50, offset = 0 } = filters;

    const query = db('notifications').where({ user_id: userId });

    if (unreadOnly) {
      query.andWhere('is_read', false);
    }

    return query.orderBy('created_at', 'desc').limit(limit).offset(offset);
  }

  // Get unread count
  static async getUnreadCount(userId) {
    const { count } = await db('notifications')
      .where({ user_id: userId, is_read: false })
      .count({ count: '*' })
      .first();
    return parseInt(count);
  }

  // Mark as read
  static async markAsRead(notificationId, userId) {
    const [result] = await db('notifications')
      .where({ id: notificationId, user_id: userId })
      .update({ is_read: true, read_at: db.fn.now() })
      .returning('*');
    return result;
  }

  // Mark all as read
  static async markAllAsRead(userId) {
    return db('notifications')
      .where({ user_id: userId, is_read: false })
      .update({ is_read: true, read_at: db.fn.now() });
  }

  // Delete notification
  static async delete(notificationId, userId) {
    const [result] = await db('notifications')
      .where({ id: notificationId, user_id: userId })
      .del()
      .returning('*');
    return result;
  }

  // Delete all read notifications
  static async deleteAllRead(userId) {
    return db('notifications').where({ user_id: userId, is_read: true }).del();
  }

  // Create notification for multiple users
  static async createBulk(userIds, type, title, message, data = null) {
    const notifications = userIds.map(user_id => ({
      user_id,
      type,
      title,
      message,
      data: data ? JSON.stringify(data) : null
    }));
    return db('notifications').insert(notifications);
  }

  // Helper: Create achievement unlocked notification
  static async notifyAchievementUnlocked(userId, achievementName, points) {
    return this.create({
      user_id: userId,
      type: 'achievement_unlocked',
      title: 'Achievement Unlocked!',
      message: `You earned "${achievementName}" and ${points} points!`,
      data: { achievementName, points }
    });
  }

  // Helper: Create rank up notification
  static async notifyRankUp(userId, oldRank, newRank, perks) {
    return this.create({
      user_id: userId,
      type: 'rank_up',
      title: 'Rank Promotion!',
      message: `Congratulations! You've been promoted from ${oldRank} to ${newRank}!`,
      data: { oldRank, newRank, perks }
    });
  }

  // Helper: Create new recruit notification
  static async notifyNewRecruit(userId, recruitUsername) {
    return this.create({
      user_id: userId,
      type: 'new_recruit',
      title: 'New Team Member',
      message: `${recruitUsername} joined your team!`,
      data: { recruitUsername }
    });
  }

  // Helper: Create commission earned notification
  static async notifyCommissionEarned(userId, amount, triggeredBy, level) {
    return this.create({
      user_id: userId,
      type: 'commission_earned',
      title: 'Commission Earned',
      message: `You earned ${amount} AC from ${triggeredBy} (Level ${level})`,
      data: { amount, triggeredBy, level }
    });
  }

  // Helper: Create security alert notification
  static async notifySecurityAlert(userId, alertType, description) {
    return this.create({
      user_id: userId,
      type: 'security_alert',
      title: 'Security Alert',
      message: description,
      data: { alertType }
    });
  }

  // Helper: Create system message notification
  static async notifySystemMessage(userId, title, message) {
    return this.create({
      user_id: userId,
      type: 'system_message',
      title,
      message,
      data: null
    });
  }
}

module.exports = Notification;
