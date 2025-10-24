const { pool } = require('../config/database');
const Notification = require('./Notification');

class Achievement {
  // Get all achievements
  static async getAll() {
    const result = await pool.query(
      'SELECT * FROM achievements ORDER BY points DESC, name ASC'
    );
    return result.rows;
  }

  // Get achievement by ID
  static async getById(achievementId) {
    const result = await pool.query(
      'SELECT * FROM achievements WHERE id = $1',
      [achievementId]
    );
    return result.rows[0];
  }

  // Get user's unlocked achievements
  static async getUserAchievements(userId) {
    const result = await pool.query(
      `SELECT a.*, ua.unlocked_at, ua.progress
       FROM achievements a
       JOIN user_achievements ua ON a.id = ua.achievement_id
       WHERE ua.user_id = $1
       ORDER BY ua.unlocked_at DESC`,
      [userId]
    );
    return result.rows;
  }

  // Get user's achievement progress (all achievements with unlock status)
  static async getUserProgress(userId) {
    const result = await pool.query(
      `SELECT
        a.*,
        ua.unlocked_at,
        ua.progress,
        CASE WHEN ua.achievement_id IS NOT NULL THEN true ELSE false END as is_unlocked
       FROM achievements a
       LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
       ORDER BY is_unlocked DESC, a.points DESC, a.name ASC`,
      [userId]
    );
    return result.rows;
  }

  // Unlock achievement for user
  static async unlock(userId, achievementId, progress = null) {
    // Check if already unlocked
    const existing = await pool.query(
      'SELECT * FROM user_achievements WHERE user_id = $1 AND achievement_id = $2',
      [userId, achievementId]
    );

    if (existing.rows.length > 0) {
      return { alreadyUnlocked: true };
    }

    // Get achievement details
    const achievement = await this.getById(achievementId);
    if (!achievement) {
      throw new Error('Achievement not found');
    }

    // Unlock achievement
    await pool.query(
      `INSERT INTO user_achievements (user_id, achievement_id, progress)
       VALUES ($1, $2, $3)`,
      [userId, achievementId, progress]
    );

    // Update user's total points
    await pool.query(
      'UPDATE users SET achievement_points = achievement_points + $1 WHERE id = $2',
      [achievement.points, userId]
    );

    // Create notification
    await Notification.notifyAchievementUnlocked(userId, achievement.name, achievement.points);

    return {
      alreadyUnlocked: false,
      achievement,
      totalPoints: achievement.points
    };
  }

  // Check all achievements for a user
  static async checkAchievements(userId) {
    const user = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (user.rows.length === 0) {
      throw new Error('User not found');
    }

    const userData = user.rows[0];
    const unlockedAchievements = [];

    // Define achievement checking logic
    const achievements = [
      // First Steps
      {
        id: 1,
        condition: userData.direct_recruits >= 1,
        name: 'First Recruit'
      },
      {
        id: 2,
        condition: parseFloat(userData.total_earned) >= 10,
        name: 'First Earnings'
      },
      // Network Builder
      {
        id: 3,
        condition: userData.direct_recruits >= 5,
        name: 'Team Builder'
      },
      {
        id: 4,
        condition: userData.direct_recruits >= 10,
        name: 'Network Pro'
      },
      {
        id: 5,
        condition: userData.direct_recruits >= 25,
        name: 'Recruitment Master'
      },
      {
        id: 6,
        condition: userData.direct_recruits >= 50,
        name: 'Empire Builder'
      },
      // Earnings Milestones
      {
        id: 7,
        condition: parseFloat(userData.total_earned) >= 100,
        name: 'Century Club'
      },
      {
        id: 8,
        condition: parseFloat(userData.total_earned) >= 500,
        name: 'High Roller'
      },
      {
        id: 9,
        condition: parseFloat(userData.total_earned) >= 1000,
        name: 'Thousand Club'
      },
      {
        id: 10,
        condition: parseFloat(userData.total_earned) >= 5000,
        name: 'Platinum Earner'
      },
      {
        id: 11,
        condition: parseFloat(userData.total_earned) >= 10000,
        name: 'Diamond Earner'
      },
      // Network Size
      {
        id: 12,
        condition: userData.network_size >= 10,
        name: 'Growing Network'
      },
      {
        id: 13,
        condition: userData.network_size >= 50,
        name: 'Large Network'
      },
      {
        id: 14,
        condition: userData.network_size >= 100,
        name: 'Network Giant'
      },
      {
        id: 15,
        condition: userData.network_size >= 250,
        name: 'Network Titan'
      }
    ];

    // Check each achievement
    for (const achievement of achievements) {
      if (achievement.condition) {
        try {
          const result = await this.unlock(userId, achievement.id);
          if (!result.alreadyUnlocked) {
            unlockedAchievements.push(result.achievement);
          }
        } catch (error) {
          console.error(`Error unlocking achievement ${achievement.id}:`, error);
        }
      }
    }

    return unlockedAchievements;
  }

  // Get user's total achievement points
  static async getUserPoints(userId) {
    const result = await pool.query(
      'SELECT achievement_points FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0]?.achievement_points || 0;
  }

  // Get leaderboard by achievement points
  static async getLeaderboard(limit = 10) {
    const result = await pool.query(
      `SELECT
        id, username, achievement_points,
        (SELECT COUNT(*) FROM user_achievements WHERE user_id = users.id) as achievements_count
       FROM users
       WHERE role = 'student' AND achievement_points > 0
       ORDER BY achievement_points DESC, achievements_count DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  // Seed initial achievements (run once)
  static async seedAchievements() {
    const achievements = [
      // First Steps (100 points each)
      { id: 1, name: 'First Recruit', description: 'Recruit your first team member', points: 100, icon: '🎯', category: 'recruiting' },
      { id: 2, name: 'First Earnings', description: 'Earn your first 10 AC', points: 100, icon: '💵', category: 'earnings' },

      // Network Builder (200-1000 points)
      { id: 3, name: 'Team Builder', description: 'Recruit 5 team members', points: 200, icon: '👥', category: 'recruiting' },
      { id: 4, name: 'Network Pro', description: 'Recruit 10 team members', points: 300, icon: '🌟', category: 'recruiting' },
      { id: 5, name: 'Recruitment Master', description: 'Recruit 25 team members', points: 500, icon: '👑', category: 'recruiting' },
      { id: 6, name: 'Empire Builder', description: 'Recruit 50 team members', points: 1000, icon: '🏆', category: 'recruiting' },

      // Earnings Milestones (200-2000 points)
      { id: 7, name: 'Century Club', description: 'Earn 100 AC total', points: 200, icon: '💰', category: 'earnings' },
      { id: 8, name: 'High Roller', description: 'Earn 500 AC total', points: 400, icon: '💎', category: 'earnings' },
      { id: 9, name: 'Thousand Club', description: 'Earn 1,000 AC total', points: 600, icon: '🔥', category: 'earnings' },
      { id: 10, name: 'Platinum Earner', description: 'Earn 5,000 AC total', points: 1000, icon: '⚡', category: 'earnings' },
      { id: 11, name: 'Diamond Earner', description: 'Earn 10,000 AC total', points: 2000, icon: '💠', category: 'earnings' },

      // Network Size (200-1500 points)
      { id: 12, name: 'Growing Network', description: 'Build a network of 10 people', points: 200, icon: '🌱', category: 'network' },
      { id: 13, name: 'Large Network', description: 'Build a network of 50 people', points: 500, icon: '🌳', category: 'network' },
      { id: 14, name: 'Network Giant', description: 'Build a network of 100 people', points: 800, icon: '🌲', category: 'network' },
      { id: 15, name: 'Network Titan', description: 'Build a network of 250 people', points: 1500, icon: '🏔️', category: 'network' }
    ];

    for (const achievement of achievements) {
      await pool.query(
        `INSERT INTO achievements (id, name, description, points, icon, category)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           name = $2, description = $3, points = $4, icon = $5, category = $6`,
        [achievement.id, achievement.name, achievement.description, achievement.points, achievement.icon, achievement.category]
      );
    }

    return achievements.length;
  }
}

module.exports = Achievement;
