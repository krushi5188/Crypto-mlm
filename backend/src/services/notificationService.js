const { pool } = require('../config/database');

class NotificationService {
  /**
   * Create a new notification for a user
   */
  static async createNotification(userId, type, title, message, data = null) {
    try {
      const result = await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, data)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, user_id, type, title, message, data, is_read, created_at`,
        [userId, type, title, message, data ? JSON.stringify(data) : null]
      );

      return {
        id: result.rows[0].id,
        userId: result.rows[0].user_id,
        type: result.rows[0].type,
        title: result.rows[0].title,
        message: result.rows[0].message,
        data: typeof result.rows[0].data === 'string' ? JSON.parse(result.rows[0].data) : result.rows[0].data,
        isRead: result.rows[0].is_read,
        createdAt: result.rows[0].created_at
      };
    } catch (error) {
      console.error('Create notification error:', error);
      throw error;
    }
  }

  /**
   * Get user's notifications with pagination
   */
  static async getUserNotifications(userId, limit = 50, offset = 0, includeRead = false) {
    try {
      let query = `
        SELECT id, user_id, type, title, message, data, is_read, read_at, created_at
        FROM notifications
        WHERE user_id = $1
      `;

      if (!includeRead) {
        query += ' AND is_read = FALSE';
      }

      query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';

      const result = await pool.query(query, [userId, limit, offset]);

      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        type: row.type,
        title: row.title,
        message: row.message,
        data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
        isRead: row.is_read,
        readAt: row.read_at,
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error('Get user notifications error:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId) {
    try {
      const result = await pool.query(
        `SELECT COUNT(*) as count
         FROM notifications
         WHERE user_id = $1 AND is_read = FALSE`,
        [userId]
      );

      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Get unread count error:', error);
      throw error;
    }
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(notificationId, userId) {
    try {
      const result = await pool.query(
        `UPDATE notifications
         SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND user_id = $2
         RETURNING id`,
        [notificationId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Notification not found or does not belong to user');
      }

      return true;
    } catch (error) {
      console.error('Mark notification as read error:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId) {
    try {
      await pool.query(
        `UPDATE notifications
         SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND is_read = FALSE`,
        [userId]
      );

      return true;
    } catch (error) {
      console.error('Mark all as read error:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId, userId) {
    try {
      const result = await pool.query(
        `DELETE FROM notifications
         WHERE id = $1 AND user_id = $2
         RETURNING id`,
        [notificationId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Notification not found or does not belong to user');
      }

      return true;
    } catch (error) {
      console.error('Delete notification error:', error);
      throw error;
    }
  }

  /**
   * Delete all read notifications for a user
   */
  static async deleteAllRead(userId) {
    try {
      const result = await pool.query(
        `DELETE FROM notifications
         WHERE user_id = $1 AND is_read = TRUE
         RETURNING id`,
        [userId]
      );

      return result.rows.length;
    } catch (error) {
      console.error('Delete all read error:', error);
      throw error;
    }
  }

  /**
   * Get notifications by type
   */
  static async getNotificationsByType(userId, type, limit = 50, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT id, user_id, type, title, message, data, is_read, read_at, created_at
         FROM notifications
         WHERE user_id = $1 AND type = $2
         ORDER BY created_at DESC
         LIMIT $3 OFFSET $4`,
        [userId, type, limit, offset]
      );

      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        type: row.type,
        title: row.title,
        message: row.message,
        data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
        isRead: row.is_read,
        readAt: row.read_at,
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error('Get notifications by type error:', error);
      throw error;
    }
  }

  /**
   * Get notification summary for a user
   */
  static async getNotificationSummary(userId) {
    try {
      const result = await pool.query(
        `SELECT
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE is_read = FALSE) as unread,
           COUNT(*) FILTER (WHERE type = 'commission_earned') as commission_notifications,
           COUNT(*) FILTER (WHERE type = 'rank_up') as rank_up_notifications,
           COUNT(*) FILTER (WHERE type = 'achievement_unlocked') as achievement_notifications,
           COUNT(*) FILTER (WHERE type = 'security_alert') as security_notifications,
           MAX(created_at) as latest_notification
         FROM notifications
         WHERE user_id = $1`,
        [userId]
      );

      return {
        total: parseInt(result.rows[0].total),
        unread: parseInt(result.rows[0].unread),
        read: parseInt(result.rows[0].total) - parseInt(result.rows[0].unread),
        byType: {
          commission: parseInt(result.rows[0].commission_notifications),
          rankUp: parseInt(result.rows[0].rank_up_notifications),
          achievement: parseInt(result.rows[0].achievement_notifications),
          security: parseInt(result.rows[0].security_notifications)
        },
        latestNotification: result.rows[0].latest_notification
      };
    } catch (error) {
      console.error('Get notification summary error:', error);
      throw error;
    }
  }

  /**
   * Create bulk notifications (for system-wide announcements)
   */
  static async createBulkNotification(userIds, type, title, message, data = null) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const notifications = [];

      for (const userId of userIds) {
        const result = await client.query(
          `INSERT INTO notifications (user_id, type, title, message, data)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [userId, type, title, message, data ? JSON.stringify(data) : null]
        );

        notifications.push(result.rows[0].id);
      }

      await client.query('COMMIT');

      return {
        created: notifications.length,
        notificationIds: notifications
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Create bulk notification error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete old notifications (cleanup utility)
   */
  static async deleteOldNotifications(daysOld = 90) {
    try {
      const result = await pool.query(
        `DELETE FROM notifications
         WHERE created_at < NOW() - INTERVAL '${daysOld} days'
           AND is_read = TRUE
         RETURNING id`,
        []
      );

      return result.rows.length;
    } catch (error) {
      console.error('Delete old notifications error:', error);
      throw error;
    }
  }

  /**
   * Get recent activity feed (combines notifications with recent events)
   */
  static async getActivityFeed(userId, limit = 20) {
    try {
      // Get recent notifications
      const notifications = await this.getUserNotifications(userId, limit, 0, true);

      // Get recent transactions
      const transactions = await pool.query(
        `SELECT id, amount, type, level, description, created_at, balance_after
         FROM transactions
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [userId, limit]
      );

      // Combine and sort by date
      const activities = [
        ...notifications.map(n => ({
          type: 'notification',
          subType: n.type,
          id: n.id,
          title: n.title,
          message: n.message,
          data: n.data,
          isRead: n.isRead,
          timestamp: n.createdAt
        })),
        ...transactions.rows.map(t => ({
          type: 'transaction',
          subType: t.type,
          id: t.id,
          amount: parseFloat(t.amount),
          description: t.description,
          level: t.level,
          balanceAfter: parseFloat(t.balance_after),
          timestamp: t.created_at
        }))
      ];

      // Sort by timestamp descending
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return activities.slice(0, limit);
    } catch (error) {
      console.error('Get activity feed error:', error);
      throw error;
    }
  }

  /**
   * Create notification for commission earned
   */
  static async notifyCommissionEarned(userId, amount, triggeredByUsername, level) {
    return this.createNotification(
      userId,
      'commission_earned',
      'Commission Earned!',
      `You earned ${amount} AC from ${triggeredByUsername}'s recruitment${level ? ` (Level ${level})` : ''}`,
      { amount, triggeredByUsername, level }
    );
  }

  /**
   * Create notification for new recruit
   */
  static async notifyNewRecruit(userId, recruitUsername) {
    return this.createNotification(
      userId,
      'new_recruit',
      'New Team Member!',
      `${recruitUsername} just joined your team`,
      { recruitUsername }
    );
  }

  /**
   * Create notification for withdrawal processed
   */
  static async notifyWithdrawalProcessed(userId, amount, status) {
    const statusText = status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'processed';
    return this.createNotification(
      userId,
      'withdrawal_status',
      `Withdrawal ${statusText}`,
      `Your withdrawal request of ${amount} AC has been ${statusText}`,
      { amount, status }
    );
  }
}

module.exports = NotificationService;
