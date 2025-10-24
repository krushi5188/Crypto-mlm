const { pool } = require('../config/database');

class AchievementService {
  /**
   * Check and unlock achievements for user
   */
  static async checkAchievements(userId) {
    try {
      // Get user stats
      const userResult = await pool.query(
        `SELECT direct_recruits, network_size, total_earned
         FROM users
         WHERE id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        return [];
      }

      const user = userResult.rows[0];

      // Get all active achievements
      const achievementsResult = await pool.query(
        'SELECT * FROM achievements WHERE is_active = TRUE'
      );

      // Get already unlocked achievement IDs
      const unlockedResult = await pool.query(
        'SELECT achievement_id FROM user_achievements WHERE user_id = $1',
        [userId]
      );
      const unlockedIds = unlockedResult.rows.map(row => row.achievement_id);

      const newlyUnlocked = [];

      // Check each achievement
      for (const achievement of achievementsResult.rows) {
        // Skip if already unlocked
        if (unlockedIds.includes(achievement.id)) {
          continue;
        }

        const criteria = typeof achievement.criteria === 'string'
          ? JSON.parse(achievement.criteria)
          : achievement.criteria;

        let meetsRequirements = true;
        let progress = 0;

        // Check each criterion
        if (criteria.direct_recruits !== undefined) {
          if (user.direct_recruits < criteria.direct_recruits) {
            meetsRequirements = false;
          }
          progress = Math.min(100, Math.floor((user.direct_recruits / criteria.direct_recruits) * 100));
        }

        if (criteria.network_size !== undefined) {
          if (user.network_size < criteria.network_size) {
            meetsRequirements = false;
          }
          progress = Math.min(100, Math.floor((user.network_size / criteria.network_size) * 100));
        }

        if (criteria.total_earned !== undefined) {
          if (parseFloat(user.total_earned) < criteria.total_earned) {
            meetsRequirements = false;
          }
          progress = Math.min(100, Math.floor((parseFloat(user.total_earned) / criteria.total_earned) * 100));
        }

        // Unlock if meets all requirements
        if (meetsRequirements) {
          await this.unlockAchievement(userId, achievement.id, progress);
          newlyUnlocked.push(achievement);
        }
      }

      return newlyUnlocked;
    } catch (error) {
      console.error('Check achievements error:', error);
      throw error;
    }
  }

  /**
   * Unlock an achievement for user
   */
  static async unlockAchievement(userId, achievementId, progress = 100) {
    try {
      // Insert unlock record
      await pool.query(
        `INSERT INTO user_achievements (user_id, achievement_id, progress)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, achievement_id) DO NOTHING`,
        [userId, achievementId, progress]
      );

      // Get achievement details
      const achievement = await pool.query(
        'SELECT name, description, points FROM achievements WHERE id = $1',
        [achievementId]
      );

      if (achievement.rows.length > 0) {
        const ach = achievement.rows[0];

        // Create notification
        const NotificationService = require('./notificationService');
        await NotificationService.createNotification(
          userId,
          'achievement_unlocked',
          'Achievement Unlocked!',
          `You've earned "${ach.name}" achievement (+${ach.points} points)`,
          { achievementId, name: ach.name, points: ach.points }
        );
      }

      return true;
    } catch (error) {
      console.error('Unlock achievement error:', error);
      throw error;
    }
  }

  /**
   * Get user's unlocked achievements
   */
  static async getUserAchievements(userId) {
    try {
      const result = await pool.query(
        `SELECT
           a.id, a.code, a.name, a.description, a.category,
           a.icon, a.points, a.badge_color,
           ua.unlocked_at, ua.progress
         FROM user_achievements ua
         JOIN achievements a ON ua.achievement_id = a.id
         WHERE ua.user_id = $1
         ORDER BY ua.unlocked_at DESC`,
        [userId]
      );

      return result.rows.map(row => ({
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description,
        category: row.category,
        icon: row.icon,
        points: row.points,
        badgeColor: row.badge_color,
        unlockedAt: row.unlocked_at,
        progress: row.progress
      }));
    } catch (error) {
      console.error('Get user achievements error:', error);
      throw error;
    }
  }

  /**
   * Get all available achievements
   */
  static async getAllAchievements() {
    try {
      const result = await pool.query(
        `SELECT id, code, name, description, category, icon,
                criteria, points, badge_color, is_active
         FROM achievements
         WHERE is_active = TRUE
         ORDER BY points ASC`
      );

      return result.rows.map(row => ({
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description,
        category: row.category,
        icon: row.icon,
        criteria: typeof row.criteria === 'string'
          ? JSON.parse(row.criteria)
          : row.criteria,
        points: row.points,
        badgeColor: row.badge_color,
        isActive: row.is_active
      }));
    } catch (error) {
      console.error('Get all achievements error:', error);
      throw error;
    }
  }

  /**
   * Get achievement progress for user
   */
  static async getAchievementProgress(userId) {
    try {
      // Get user stats
      const userResult = await pool.query(
        `SELECT direct_recruits, network_size, total_earned
         FROM users
         WHERE id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        return [];
      }

      const user = userResult.rows[0];

      // Get all achievements
      const achievements = await this.getAllAchievements();

      // Get unlocked achievement IDs
      const unlockedResult = await pool.query(
        'SELECT achievement_id FROM user_achievements WHERE user_id = $1',
        [userId]
      );
      const unlockedIds = unlockedResult.rows.map(row => row.achievement_id);

      // Calculate progress for each achievement
      return achievements.map(achievement => {
        const criteria = achievement.criteria;
        let progressPercent = 0;
        let progressText = '';
        let isUnlocked = unlockedIds.includes(achievement.id);

        if (criteria.direct_recruits !== undefined) {
          const current = user.direct_recruits;
          const target = criteria.direct_recruits;
          progressPercent = Math.min(100, Math.floor((current / target) * 100));
          progressText = `${current} / ${target} direct recruits`;
        } else if (criteria.network_size !== undefined) {
          const current = user.network_size;
          const target = criteria.network_size;
          progressPercent = Math.min(100, Math.floor((current / target) * 100));
          progressText = `${current} / ${target} network members`;
        } else if (criteria.total_earned !== undefined) {
          const current = parseFloat(user.total_earned);
          const target = criteria.total_earned;
          progressPercent = Math.min(100, Math.floor((current / target) * 100));
          progressText = `${current.toFixed(2)} / ${target} AC earned`;
        }

        return {
          ...achievement,
          unlocked: isUnlocked,
          progress: progressPercent,
          progressText
        };
      });
    } catch (error) {
      console.error('Get achievement progress error:', error);
      throw error;
    }
  }

  /**
   * Get achievement summary for user
   */
  static async getAchievementSummary(userId) {
    try {
      const result = await pool.query(
        `SELECT
           COUNT(*) as total_unlocked,
           COALESCE(SUM(a.points), 0) as total_points
         FROM user_achievements ua
         JOIN achievements a ON ua.achievement_id = a.id
         WHERE ua.user_id = $1`,
        [userId]
      );

      const totalAchievements = await pool.query(
        'SELECT COUNT(*) as count FROM achievements WHERE is_active = TRUE'
      );

      return {
        totalUnlocked: parseInt(result.rows[0].total_unlocked),
        totalAvailable: parseInt(totalAchievements.rows[0].count),
        totalPoints: parseInt(result.rows[0].total_points),
        completionPercent: Math.floor(
          (parseInt(result.rows[0].total_unlocked) / parseInt(totalAchievements.rows[0].count)) * 100
        )
      };
    } catch (error) {
      console.error('Get achievement summary error:', error);
      throw error;
    }
  }

  /**
   * Get achievements by category
   */
  static async getAchievementsByCategory(category) {
    try {
      const result = await pool.query(
        `SELECT id, code, name, description, category, icon,
                criteria, points, badge_color, is_active
         FROM achievements
         WHERE category = $1 AND is_active = TRUE
         ORDER BY points ASC`,
        [category]
      );

      return result.rows.map(row => ({
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description,
        category: row.category,
        icon: row.icon,
        criteria: typeof row.criteria === 'string'
          ? JSON.parse(row.criteria)
          : row.criteria,
        points: row.points,
        badgeColor: row.badge_color,
        isActive: row.is_active
      }));
    } catch (error) {
      console.error('Get achievements by category error:', error);
      throw error;
    }
  }
}

module.exports = AchievementService;
