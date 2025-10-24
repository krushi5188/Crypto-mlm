const { pool } = require('../config/database');

class Notification {
  // Create notification
  static async create(notificationData) {
    const { user_id, type, title, message, data = null } = notificationData;

    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, type, title, message, data ? JSON.stringify(data) : null]
    );

    return result.rows[0];
  }

  // Get user's notifications
  static async getUserNotifications(userId, filters = {}) {
    const { unreadOnly = false, limit = 50, offset = 0 } = filters;

    let query = `
      SELECT * FROM notifications
      WHERE user_id = $1
    `;

    const params = [userId];
    let paramIndex = 2;

    if (unreadOnly) {
      query += ` AND is_read = false`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  // Get unread count
  static async getUnreadCount(userId) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }

  // Mark as read
  static async markAsRead(notificationId, userId) {
    const result = await pool.query(
      `UPDATE notifications
       SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );
    return result.rows[0];
  }

  // Mark all as read
  static async markAllAsRead(userId) {
    await pool.query(
      `UPDATE notifications
       SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
  }

  // Delete notification
  static async delete(notificationId, userId) {
    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
      [notificationId, userId]
    );
    return result.rows[0];
  }

  // Delete all read notifications
  static async deleteAllRead(userId) {
    await pool.query(
      'DELETE FROM notifications WHERE user_id = $1 AND is_read = true',
      [userId]
    );
  }

  // Create notification for multiple users
  static async createBulk(userIds, type, title, message, data = null) {
    const values = userIds.map((userId, index) => {
      const base = index * 5;
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
    }).join(', ');

    const params = [];
    userIds.forEach(userId => {
      params.push(userId, type, title, message, data ? JSON.stringify(data) : null);
    });

    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ${values}`,
      params
    );
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
