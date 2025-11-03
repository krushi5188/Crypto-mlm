const { db } = require('../config/database');
const Notification = require('./Notification');

class Rank {
  // Get all ranks ordered by rank_order
  static async getAll() {
    return db('user_ranks').orderBy('rank_order', 'asc');
  }

  // Get rank by ID
  static async getById(rankId) {
    return db('user_ranks').where({ id: rankId }).first();
  }

  // Get user's current rank with details
  static async getUserRank(userId) {
    return db('users as u')
      .select('u.current_rank_id', 'u.rank_achieved_at', 'r.*')
      .leftJoin('user_ranks as r', 'u.current_rank_id', 'r.id')
      .where('u.id', userId)
      .first();
  }

  // Check user's eligibility for rank and return next eligible rank
  static async checkEligibility(userId) {
    const user = await db('users').select('direct_recruits', 'network_size', 'total_earned', 'current_rank_id').where({ id: userId }).first();

    if (!user) {
      throw new Error('User not found');
    }

    const ranks = await db('user_ranks').orderBy('rank_order', 'desc');

    let eligibleRank = null;
    for (const rank of ranks) {
      if (
        user.direct_recruits >= rank.min_direct_recruits &&
        user.network_size >= rank.min_network_size &&
        parseFloat(user.total_earned) >= parseFloat(rank.min_total_earned)
      ) {
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
    const [result] = await db('users')
      .where({ id: userId })
      .update({
        current_rank_id: newRankId,
        rank_achieved_at: db.fn.now()
      })
      .returning('*');

    const rank = await this.getById(newRankId);

    if (rank) {
      await Notification.notifyRankUp(userId, rank.rank_name, rank.badge_icon);
    }

    return result;
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
    const user = await db('users as u')
      .select(
        'u.id', 'u.direct_recruits', 'u.network_size', 'u.total_earned',
        'u.current_rank_id', 'u.rank_achieved_at',
        'r.rank_name as current_rank_name',
        'r.badge_icon as current_badge_icon',
        'r.badge_color as current_badge_color',
        'r.rank_order as current_rank_order'
      )
      .leftJoin('user_ranks as r', 'u.current_rank_id', 'r.id')
      .where('u.id', userId)
      .first();

    if (!user) {
      throw new Error('User not found');
    }

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
    return db('users as u')
      .select(
        'u.id', 'u.username', 'u.current_rank_id',
        'u.direct_recruits', 'u.network_size', 'u.total_earned',
        'u.rank_achieved_at',
        'r.rank_name', 'r.badge_icon', 'r.badge_color', 'r.rank_order'
      )
      .leftJoin('user_ranks as r', 'u.current_rank_id', 'r.id')
      .where('u.role', 'member')
      .orderBy('r.rank_order', 'desc')
      .orderBy('u.total_earned', 'desc')
      .orderBy('u.direct_recruits', 'desc')
      .limit(limit);
  }

  // Update rank perks (admin function - could be added to instructor routes later)
  static async updatePerks(rankId, perks) {
    const [result] = await db('user_ranks')
      .where({ id: rankId })
      .update({ perks: JSON.stringify(perks) })
      .returning('*');
    return result;
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
