const { db } = require('../config/database');
const Notification = require('./Notification');

class Achievement {
  // Get all achievements
  static async getAll() {
    return db('achievements').orderBy(['points', 'name'], ['desc', 'asc']);
  }

  // Get achievement by ID
  static async getById(achievementId) {
    return db('achievements').where({ id: achievementId }).first();
  }

  // Get user's unlocked achievements
  static async getUserAchievements(userId) {
    return db('achievements as a')
      .select('a.*', 'ua.unlocked_at', 'ua.progress')
      .join('user_achievements as ua', 'a.id', 'ua.achievement_id')
      .where('ua.user_id', userId)
      .orderBy('ua.unlocked_at', 'desc');
  }

  // Get user's achievement progress (all achievements with unlock status)
  static async getUserProgress(userId) {
    return db('achievements as a')
      .select(
        'a.*',
        'ua.unlocked_at',
        'ua.progress',
        db.raw('CASE WHEN ua.achievement_id IS NOT NULL THEN true ELSE false END as is_unlocked')
      )
      .leftJoin('user_achievements as ua', function () {
        this.on('a.id', '=', 'ua.achievement_id').andOn('ua.user_id', '=', userId);
      })
      .orderBy('is_unlocked', 'desc')
      .orderBy('a.points', 'desc')
      .orderBy('a.name', 'asc');
  }

  // Unlock achievement for user
  static async unlock(userId, achievementId, progress = null) {
    const existing = await db('user_achievements').where({ user_id: userId, achievement_id: achievementId }).first();

    if (existing) {
      return { alreadyUnlocked: true };
    }

    const achievement = await this.getById(achievementId);
    if (!achievement) {
      throw new Error('Achievement not found');
    }

    await db('user_achievements').insert({
      user_id: userId,
      achievement_id: achievementId,
      progress
    });

    await db('users').where({ id: userId }).increment('achievement_points', achievement.points);

    await Notification.notifyAchievementUnlocked(userId, achievement.name, achievement.points);

    return {
      alreadyUnlocked: false,
      achievement,
      totalPoints: achievement.points
    };
  }

  // Check all achievements for a user
  static async checkAchievements(userId) {
    const userData = await db('users').where({ id: userId }).first();

    if (!userData) {
      throw new Error('User not found');
    }
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
    const result = await db('users').where({ id: userId }).select('achievement_points').first();
    return result?.achievement_points || 0;
  }

  // Get leaderboard by achievement points
  static async getLeaderboard(limit = 10) {
    return db('users')
      .select(
        'id',
        'username',
        'achievement_points',
        db.raw('(SELECT COUNT(*) FROM user_achievements WHERE user_id = users.id) as achievements_count')
      )
      .where('role', 'member')
      .andWhere('achievement_points', '>', 0)
      .orderBy('achievement_points', 'desc')
      .orderBy('achievements_count', 'desc')
      .limit(limit);
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

    return db('achievements').insert(achievements).onConflict('id').merge();
  }
}

module.exports = Achievement;
