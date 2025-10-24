const { pool } = require('../config/database');
const Notification = require('./Notification');

class Rank {
  // Get all ranks ordered by rank_order
  static async getAll() {
    const result = await pool.query(
      'SELECT * FROM user_ranks ORDER BY rank_order ASC'
    );
    return result.rows;
  }

  // Get rank by ID
  static async getById(rankId) {
    const result = await pool.query(
      'SELECT * FROM user_ranks WHERE id = $1',
      [rankId]
    );
    return result.rows[0];
  }

  // Get user's current rank with details
  static async getUserRank(userId) {
    const result = await pool.query(
      `SELECT u.current_rank_id, u.rank_achieved_at, r.*
       FROM users u
       LEFT JOIN user_ranks r ON u.current_rank_id = r.id
       WHERE u.id = $1`,
      [userId]
    );
    return result.rows[0];
  }

  // Check user's eligibility for rank and return next eligible rank
  static async checkEligibility(userId) {
    // Get user stats
    const userResult = await pool.query(
      'SELECT direct_recruits, network_size, total_earned, current_rank_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];

    // Get all ranks
    const ranksResult = await pool.query(
      'SELECT * FROM user_ranks ORDER BY rank_order DESC'
    );

    // Find highest rank user qualifies for
    let eligibleRank = null;
    for (const rank of ranksResult.rows) {
      const meetsRequirements =
        user.direct_recruits >= rank.min_direct_recruits &&
        user.network_size >= rank.min_network_size &&
        parseFloat(user.total_earned) >= parseFloat(rank.min_total_earned);

      if (meetsRequirements) {
        eligibleRank = rank;
        break;
      }
    }

    return {
      currentRankId: user.current_rank_id,
      eligibleRank,
      needsUpdate: eligibleRank && eligibleRank.id !== user.current_rank_id
    };
  }

  // Update user's rank
  static async updateUserRank(userId, newRankId) {
    const result = await pool.query(
      `UPDATE users
       SET current_rank_id = $1, rank_achieved_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [newRankId, userId]
    );

    // Get rank details
    const rank = await this.getById(newRankId);

    // Send notification
    if (rank) {
      await Notification.notifyRankUp(userId, rank.rank_name, rank.badge_icon);
    }

    return result.rows[0];
  }

  // Check and auto-promote user if eligible
  static async checkAndPromote(userId) {
    const eligibility = await this.checkEligibility(userId);

    if (eligibility.needsUpdate && eligibility.eligibleRank) {
      await this.updateUserRank(userId, eligibility.eligibleRank.id);
      return {
        promoted: true,
        newRank: eligibility.eligibleRank
      };
    }

    return {
      promoted: false,
      currentRank: eligibility.currentRankId
    };
  }

  // Get rank progression info for a user
  static async getUserProgress(userId) {
    // Get user stats
    const userResult = await pool.query(
      `SELECT
        u.id, u.direct_recruits, u.network_size, u.total_earned,
        u.current_rank_id, u.rank_achieved_at,
        r.rank_name as current_rank_name,
        r.badge_icon as current_badge_icon,
        r.badge_color as current_badge_color,
        r.rank_order as current_rank_order
       FROM users u
       LEFT JOIN user_ranks r ON u.current_rank_id = r.id
       WHERE u.id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];

    // Get all ranks
    const allRanks = await this.getAll();

    // Find next rank
    const currentOrder = user.current_rank_order || 0;
    const nextRank = allRanks.find(r => r.rank_order > currentOrder);

    // Calculate progress to next rank
    let progress = null;
    if (nextRank) {
      const recruitsProgress = nextRank.min_direct_recruits > 0
        ? Math.min(100, (user.direct_recruits / nextRank.min_direct_recruits) * 100)
        : 100;

      const networkProgress = nextRank.min_network_size > 0
        ? Math.min(100, (user.network_size / nextRank.min_network_size) * 100)
        : 100;

      const earningsProgress = parseFloat(nextRank.min_total_earned) > 0
        ? Math.min(100, (parseFloat(user.total_earned) / parseFloat(nextRank.min_total_earned)) * 100)
        : 100;

      progress = {
        recruits: {
          current: user.direct_recruits,
          required: nextRank.min_direct_recruits,
          percentage: Math.round(recruitsProgress)
        },
        network: {
          current: user.network_size,
          required: nextRank.min_network_size,
          percentage: Math.round(networkProgress)
        },
        earnings: {
          current: parseFloat(user.total_earned),
          required: parseFloat(nextRank.min_total_earned),
          percentage: Math.round(earningsProgress)
        },
        overall: Math.round((recruitsProgress + networkProgress + earningsProgress) / 3)
      };
    }

    return {
      currentRank: user.current_rank_id ? {
        id: user.current_rank_id,
        name: user.current_rank_name,
        icon: user.current_badge_icon,
        color: user.current_badge_color,
        order: user.current_rank_order,
        achievedAt: user.rank_achieved_at
      } : null,
      nextRank: nextRank || null,
      progress,
      allRanks,
      userStats: {
        directRecruits: user.direct_recruits,
        networkSize: user.network_size,
        totalEarned: parseFloat(user.total_earned)
      }
    };
  }

  // Get rank leaderboard
  static async getLeaderboard(limit = 20) {
    const result = await pool.query(
      `SELECT
        u.id, u.username, u.current_rank_id,
        u.direct_recruits, u.network_size, u.total_earned,
        u.rank_achieved_at,
        r.rank_name, r.badge_icon, r.badge_color, r.rank_order
       FROM users u
       LEFT JOIN user_ranks r ON u.current_rank_id = r.id
       WHERE u.role = 'student'
       ORDER BY r.rank_order DESC NULLS LAST, u.total_earned DESC, u.direct_recruits DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  // Update rank perks (admin function - could be added to instructor routes later)
  static async updatePerks(rankId, perks) {
    const result = await pool.query(
      'UPDATE user_ranks SET perks = $1 WHERE id = $2 RETURNING *',
      [JSON.stringify(perks), rankId]
    );
    return result.rows[0];
  }

  // Get rank-based commission multiplier
  static getRankMultiplier(rank) {
    if (!rank || !rank.perks) return 1.0;

    const perks = typeof rank.perks === 'string'
      ? JSON.parse(rank.perks)
      : rank.perks;

    return perks.commissionMultiplier || 1.0;
  }
}

module.exports = Rank;
