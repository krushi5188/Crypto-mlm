const { pool } = require('../config/database');

class RankService {
  /**
   * Calculate and update user's rank based on their stats
   */
  static async calculateRank(userId) {
    try {
      // Get user stats, including manual override flag
      const userResult = await pool.query(
        `SELECT id, direct_recruits, network_size, total_earned, current_rank_id, manual_rank_override
         FROM users
         WHERE id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];

      // If manual override is enabled, do NOT recalculate rank based on stats.
      // Return current rank as the qualified rank to prevent downgrading.
      if (user.manual_rank_override && user.current_rank_id) {
        const currentRankResult = await pool.query(
          'SELECT * FROM user_ranks WHERE id = $1',
          [user.current_rank_id]
        );
        if (currentRankResult.rows.length > 0) {
          return currentRankResult.rows[0];
        }
      }

      // Get all ranks ordered by rank_order descending (highest first)
      const ranksResult = await pool.query(
        `SELECT id, rank_name, min_direct_recruits, min_network_size,
                min_total_earned, rank_order, badge_icon, badge_color, perks, default_commission_tier
         FROM user_ranks
         ORDER BY rank_order DESC`
      );

      // Find highest rank user qualifies for
      let qualifiedRank = null;

      for (const rank of ranksResult.rows) {
        const meetsDirectRecruits = user.direct_recruits >= rank.min_direct_recruits;
        const meetsNetworkSize = user.network_size >= rank.min_network_size;
        const meetsTotalEarned = parseFloat(user.total_earned) >= parseFloat(rank.min_total_earned);

        if (meetsDirectRecruits && meetsNetworkSize && meetsTotalEarned) {
          qualifiedRank = rank;
          break; // Found highest qualifying rank
        }
      }

      // If no rank qualifies, get the lowest rank (Newbie)
      if (!qualifiedRank) {
        const lowestRank = await pool.query(
          'SELECT * FROM user_ranks ORDER BY rank_order ASC LIMIT 1'
        );
        qualifiedRank = lowestRank.rows[0];
      }

      // Check if rank changed
      if (user.current_rank_id !== qualifiedRank.id) {
        await this.updateUserRank(userId, qualifiedRank.id, qualifiedRank.default_commission_tier);

        // Send notification if not initial assignment (user had a rank before)
        if (user.current_rank_id !== null) {
          const NotificationService = require('./notificationService');
          await NotificationService.createNotification(
            userId,
            'rank_up',
            'Rank Up!',
            `Congratulations! You are now ${qualifiedRank.rank_name} ${qualifiedRank.badge_icon}`,
            { rankId: qualifiedRank.id, rankName: qualifiedRank.rank_name }
          );
        }
      }

      return qualifiedRank;
    } catch (error) {
      console.error('Calculate rank error:', error);
      throw error;
    }
  }

  /**
   * Update user's rank in database
   */
  static async updateUserRank(userId, rankId, commissionTier = null) {
    try {
      await pool.query(
        `UPDATE users
         SET current_rank_id = $1,
             commission_tier = COALESCE($3, commission_tier)
         WHERE id = $2`,
        [rankId, userId, commissionTier]
      );

      return true;
    } catch (error) {
      console.error('Update user rank error:', error);
      throw error;
    }
  }

  /**
   * Get user's current rank with details
   */
  static async getUserRank(userId) {
    try {
      const result = await pool.query(
        `SELECT
           u.id as user_id,
           u.direct_recruits,
           u.network_size,
           u.total_earned,
           r.id as rank_id,
           r.rank_name,
           r.min_direct_recruits,
           r.min_network_size,
           r.min_total_earned,
           r.rank_order,
           r.badge_icon,
           r.badge_color,
           r.perks
         FROM users u
         LEFT JOIN user_ranks r ON u.current_rank_id = r.id
         WHERE u.id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const row = result.rows[0];

      return {
        userId: row.user_id,
        currentStats: {
          directRecruits: row.direct_recruits,
          networkSize: row.network_size,
          totalEarned: parseFloat(row.total_earned)
        },
        currentRank: row.rank_id ? {
          id: row.rank_id,
          name: row.rank_name,
          order: row.rank_order,
          icon: row.badge_icon,
          color: row.badge_color,
          requirements: {
            directRecruits: row.min_direct_recruits,
            networkSize: row.min_network_size,
            totalEarned: parseFloat(row.min_total_earned)
          },
          perks: typeof row.perks === 'string' ? JSON.parse(row.perks) : row.perks
        } : null
      };
    } catch (error) {
      console.error('Get user rank error:', error);
      throw error;
    }
  }

  /**
   * Get progress to next rank
   */
  static async getRankProgress(userId) {
    try {
      // Get current rank info
      const userRank = await this.getUserRank(userId);

      if (!userRank.currentRank) {
        return { error: 'User has no rank assigned' };
      }

      // Get next rank
      const nextRankResult = await pool.query(
        `SELECT id, rank_name, min_direct_recruits, min_network_size,
                min_total_earned, rank_order, badge_icon, badge_color, perks
         FROM user_ranks
         WHERE rank_order > $1
         ORDER BY rank_order ASC
         LIMIT 1`,
        [userRank.currentRank.order]
      );

      // Check if at max rank
      if (nextRankResult.rows.length === 0) {
        return {
          atMaxRank: true,
          currentRank: userRank.currentRank,
          progress: {
            directRecruits: { percent: 100, current: userRank.currentStats.directRecruits, required: userRank.currentRank.requirements.directRecruits },
            networkSize: { percent: 100, current: userRank.currentStats.networkSize, required: userRank.currentRank.requirements.networkSize },
            totalEarned: { percent: 100, current: userRank.currentStats.totalEarned, required: userRank.currentRank.requirements.totalEarned }
          }
        };
      }

      const nextRank = nextRankResult.rows[0];

      // Calculate progress for each requirement
      const progress = {
        directRecruits: {
          current: userRank.currentStats.directRecruits,
          required: nextRank.min_direct_recruits,
          percent: Math.min(100, Math.floor((userRank.currentStats.directRecruits / nextRank.min_direct_recruits) * 100))
        },
        networkSize: {
          current: userRank.currentStats.networkSize,
          required: nextRank.min_network_size,
          percent: Math.min(100, Math.floor((userRank.currentStats.networkSize / nextRank.min_network_size) * 100))
        },
        totalEarned: {
          current: userRank.currentStats.totalEarned,
          required: parseFloat(nextRank.min_total_earned),
          percent: Math.min(100, Math.floor((userRank.currentStats.totalEarned / parseFloat(nextRank.min_total_earned)) * 100))
        }
      };

      // Calculate overall progress (average of all requirements)
      const overallProgress = Math.floor(
        (progress.directRecruits.percent + progress.networkSize.percent + progress.totalEarned.percent) / 3
      );

      return {
        atMaxRank: false,
        currentRank: userRank.currentRank,
        nextRank: {
          id: nextRank.id,
          name: nextRank.rank_name,
          order: nextRank.rank_order,
          icon: nextRank.badge_icon,
          color: nextRank.badge_color,
          requirements: {
            directRecruits: nextRank.min_direct_recruits,
            networkSize: nextRank.min_network_size,
            totalEarned: parseFloat(nextRank.min_total_earned)
          },
          perks: typeof nextRank.perks === 'string' ? JSON.parse(nextRank.perks) : nextRank.perks
        },
        progress,
        overallProgress
      };
    } catch (error) {
      console.error('Get rank progress error:', error);
      throw error;
    }
  }

  /**
   * Get all available ranks
   */
  static async getAllRanks() {
    try {
      const result = await pool.query(
        `SELECT id, rank_name, min_direct_recruits, min_network_size,
                min_total_earned, rank_order, badge_icon, badge_color, perks
         FROM user_ranks
         ORDER BY rank_order ASC`
      );

      return result.rows.map(row => ({
        id: row.id,
        name: row.rank_name,
        order: row.rank_order,
        icon: row.badge_icon,
        color: row.badge_color,
        requirements: {
          directRecruits: row.min_direct_recruits,
          networkSize: row.min_network_size,
          totalEarned: parseFloat(row.min_total_earned)
        },
        perks: typeof row.perks === 'string' ? JSON.parse(row.perks) : row.perks
      }));
    } catch (error) {
      console.error('Get all ranks error:', error);
      throw error;
    }
  }

  /**
   * Get perks for a specific rank
   */
  static async getRankPerks(rankId) {
    try {
      const result = await pool.query(
        'SELECT rank_name, perks FROM user_ranks WHERE id = $1',
        [rankId]
      );

      if (result.rows.length === 0) {
        throw new Error('Rank not found');
      }

      const row = result.rows[0];

      return {
        rankName: row.rank_name,
        perks: typeof row.perks === 'string' ? JSON.parse(row.perks) : row.perks
      };
    } catch (error) {
      console.error('Get rank perks error:', error);
      throw error;
    }
  }

  /**
   * Check if user should rank up and do so if needed
   */
  static async checkRankUp(userId) {
    try {
      const newRank = await this.calculateRank(userId);
      return newRank;
    } catch (error) {
      console.error('Check rank up error:', error);
      throw error;
    }
  }

  /**
   * Admin Manual Promotion
   * Promotes a user to a specific rank regardless of stats.
   * Sets the manual_rank_override flag to prevent auto-downgrade.
   */
  static async adminPromoteUser(userId, rankId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify rank exists
      const rankResult = await client.query('SELECT * FROM user_ranks WHERE id = $1', [rankId]);
      if (rankResult.rows.length === 0) {
        throw new Error('Rank not found');
      }
      const rank = rankResult.rows[0];

      // Check if rank has a default commission tier
      const tier = rank.default_commission_tier || null;

      // Update user
      await client.query(
        `UPDATE users
         SET current_rank_id = $1,
             manual_rank_override = TRUE,
             commission_tier = COALESCE($3, commission_tier)
         WHERE id = $2`,
        [rankId, userId, tier]
      );

      // Create Notification
      const NotificationService = require('./notificationService');
      // Note: We can't use the service directly inside transaction usually if it uses pool,
      // but NotificationService usually handles its own pool.
      // For safety, we'll just insert notification manually or call service after commit.

      await client.query('COMMIT');

      // Send notification (outside transaction)
      await NotificationService.createNotification(
        userId,
        'rank_up',
        'Rank Up!',
        `You have been promoted to ${rank.rank_name} by the administrator! ${rank.badge_icon}`,
        { rankId: rank.id, rankName: rank.rank_name }
      );

      return rank;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Admin promote user error:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = RankService;
